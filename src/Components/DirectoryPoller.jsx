import React, { useState, useEffect, useRef, useContext } from "react";
import { Modal, Button } from "react-bootstrap";
import axios from "axios";
import io from "socket.io-client";
import PQueue from 'p-queue';
import Logger from "../logger";
import { DirectoryPollerContext } from "../DirectoryPollerContext";

function MonitorImages({ show, onHide, eventId }) {
  const [loading, setLoading] = useState(false);
  const [showTick, setShowTick] = useState(false);
  const socketRef = useRef(null);
  const [isInputDisabled, setIsInputDisabled] = useState(false);
  const uploadInterval = useRef(null);
  const uploadQueue = useRef(new PQueue({ concurrency: 5 })); // Manage concurrency
  const uploadedImageHash = useRef({});
  const {
    url,
    setUrl,
    newImages,
    setNewImages,
    uploadedImages,
    setUploadedImages,
    isUploading,
    setIsUploading,
    setIsPollerRunning,
  } = useContext(DirectoryPollerContext);

  const monitorImages = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}/events/fetch-external-resource`,
        { params: { externalResourceUrl: url } }
      );

      const data = response.data;
      if (data.image_urls && Array.isArray(data.image_urls)) {
        const uniqueNewImages = data.image_urls.filter(img => !uploadedImageHash.current[img]);
        setNewImages(prevNewImages => [...prevNewImages, ...uniqueNewImages]);
      } else {
        Logger.error("Unexpected response format");
      }
    } catch (err) {
      Logger.error("Failed to fetch images:", err);
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (imageSrc) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}/events/fetch-image`,
        { params: { imageUrl: imageSrc }, responseType: "arraybuffer" }
      );

      const blob = new Blob([response.data], { type: "image/jpeg" });
      const formData = new FormData();
      const imageName = imageSrc.split("/").pop().split("?")[0];
      formData.append("galleryImage", blob, imageName);

      await axios.post(
        `${process.env.REACT_APP_API}/events/${eventId}/upload`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setUploadedImages(prev => [...prev, imageSrc]);
      Logger.log("image uploaded")
      uploadedImageHash.current[imageSrc] = true; // Mark as uploaded
    } catch (error) {
      Logger.error("Error uploading image:", error);
    }
  };

  const uploadImages = () => {
    newImages.forEach(imageSrc => {
      if (!uploadedImageHash.current[imageSrc]) {
        uploadedImageHash.current[imageSrc] = false; // Mark as in process
        uploadQueue.current.add(() => uploadImage(imageSrc));
      }
    });
  };

  const startMonitoringAndUploading = () => {
    setIsPollerRunning(true);
    setIsUploading(true);
    setIsInputDisabled(true);
    uploadInterval.current = setInterval(monitorImages, 5000);
  };

  const stopUploading = () => {
    setIsPollerRunning(false);
    setIsUploading(false);
    setIsInputDisabled(false);
    clearInterval(uploadInterval.current);
    uploadQueue.current.clear();
    uploadedImageHash.current = {};
    setNewImages([]);
    setUploadedImages([]);
  };

  useEffect(() => {
    socketRef.current = io(process.env.REACT_APP_API);
    socketRef.current.on("new-image", (data) => Logger.log("New image:", data.imageUrl));
    return () => { if (socketRef.current) socketRef.current.disconnect(); };
  }, []);

  useEffect(() => {
    if (isUploading) {
      uploadImages();
    }
  }, [newImages, isUploading]);

  return (
    <Modal
      show={show}
      onHide={onHide} // just call onHide, don't alter the poller's state
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>Monitor External Directory</Modal.Title>
      </Modal.Header>
      <Modal.Body>
      <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter URL to monitor"
          disabled={isInputDisabled} // Apply the disabled property
          style={{ width: "100%", marginBottom: "10px" }}
        />
        <Button
          onClick={startMonitoringAndUploading}
          disabled={isUploading}
          variant="primary"
          style={{ marginRight: "10px" }}
        >
          Start
        </Button>
        <Button
          onClick={stopUploading}
          disabled={!isUploading}
          variant="secondary"
        >
          Stop
        </Button>
        {loading && <p>Loading...</p>}
        {isUploading && newImages.length === 0 && (
          <p>Waiting for new images...</p>
        )}
        {showTick && <span>&#10003;</span>}{" "}
        {/* Display the tick when showTick is true */}
      </Modal.Body>
    </Modal>
  );
}

export default MonitorImages;
