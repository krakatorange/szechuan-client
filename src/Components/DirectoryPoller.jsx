import React, { useState, useEffect, useRef, useContext } from "react";
import { Modal, Button } from "react-bootstrap";
import axios from "axios";
import io from "socket.io-client";
import PQueue from 'p-queue';
import Logger from "../logger";
import { DirectoryPollerContext } from "../DirectoryPollerContext";

function MonitorImages({ show, onHide, eventId }) {
  const [loading, setLoading] = useState(false);
  const [uploadedImageHash, setUploadedImageHash] = useState({}); // State for uploaded image hash
  const socketRef = useRef(null);
  const [isInputDisabled, setIsInputDisabled] = useState(false);
  const uploadInterval = useRef(null);
  const uploadQueue = useRef(new PQueue({ concurrency: 5 }));

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
        const uniqueNewImages = data.image_urls.filter(img => !uploadedImageHash[img]);
        setNewImages(prevNewImages => [...prevNewImages, ...uniqueNewImages]);
        Logger.log('New images set:', uniqueNewImages.length);
      } else {
        Logger.error("Unexpected response format");
      }
    } catch (err) {
      Logger.error("Failed to fetch images:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateUploadedImageHash = (imageSrc) => {
    setUploadedImageHash(prevHash => {
      const updatedHash = { ...prevHash, [imageSrc]: true };
      Logger.log("Updated state of uploadedImageHash:", Object.keys(updatedHash).length);
      return updatedHash;
    });
  };

  const uploadImage = async (imageSrc) => {
    try {
      Logger.log("Attempting to upload:", imageSrc);

      const response = await axios.get(
        `${process.env.REACT_APP_API}/events/fetch-image`,
        { params: { imageUrl: imageSrc }, responseType: "arraybuffer" }
      );
      const blob = new Blob([response.data], { type: "image/jpeg" });
      const formData = new FormData();
      formData.append("galleryImage", blob, imageSrc.split("/").pop().split("?")[0]);

      await axios.post(
        `${process.env.REACT_APP_API}/events/${eventId}/upload`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setUploadedImages(prev => [...prev, imageSrc]);
      updateUploadedImageHash(imageSrc);
    } catch (error) {
      Logger.error("Error uploading image:", error);
    }
  };

  const uploadImages = () => {
    Logger.log('Uploading new images, count:', newImages.length);
    newImages.forEach(imageSrc => {
      if (!uploadedImageHash[imageSrc]) {
        uploadQueue.current.add(() => uploadImage(imageSrc));
      }
    });
    Logger.log('Current queue size:', uploadQueue.current.size);
  };

  const startMonitoringAndUploading = () => {
    setIsPollerRunning(true);
    setIsUploading(true);
    setIsInputDisabled(true);
    monitorImages();
    uploadInterval.current = setInterval(monitorImages, 10000);
  };

  const stopUploading = () => {
    setIsPollerRunning(false);
    setIsUploading(false);
    setIsInputDisabled(false);
    clearInterval(uploadInterval.current);
    uploadQueue.current.clear();
    setUploadedImageHash({});
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
      onHide={onHide}
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
          disabled={isInputDisabled}
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
      </Modal.Body>
    </Modal>
  );
}

export default MonitorImages;
