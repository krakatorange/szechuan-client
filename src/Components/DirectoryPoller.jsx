import React, { useState, useEffect, useRef } from "react";
import { Modal, Button } from "react-bootstrap";
import axios from "axios";
import io from "socket.io-client";
import Logger from "../logger";

function MonitorImages({  show, onHide, eventId }) {
  const [url, setUrl] = useState("");
  const [newImages, setNewImages] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showTick, setShowTick] = useState(false);  // New state for showing the tick
  const socketRef = useRef(null);
  const uploadInterval = useRef(null);

  const monitorImages = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}/events/fetch-external-resource`,
        {
          params: {
            externalResourceUrl: url,
          },
        }
      );

      const data = response.data;
      if (data.image_urls && Array.isArray(data.image_urls)) {
        setNewImages((prevNewImages) => {
          const newDetectedImages = data.image_urls.filter(
            (img) => !prevNewImages.includes(img)
          );
          return [...prevNewImages, ...newDetectedImages];
        });
      } else {
        Logger.error("Unexpected response format");
      }
    } catch (err) {
      Logger.error("Failed to fetch images:", err);
    } finally {
      setLoading(false);
    }
  };

  const uploadImages = async () => {
    for (const imageSrc of newImages) {
      if (!uploadedImages.includes(imageSrc)) {
        try {
          const response = await axios.get(
            `${process.env.REACT_APP_API}/events/fetch-image`,
            {
              params: {
                imageUrl: imageSrc,
              },
              responseType: "arraybuffer",
            }
          );

          const blob = new Blob([response.data], { type: "image/jpeg" });

          const formData = new FormData();
          const imageName = imageSrc.split("/").pop().split("?")[0];
          formData.append("galleryImage", blob, imageName);

          await axios.post(
            `${process.env.REACT_APP_API}/events/${eventId}/upload`,
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );

          Logger.log(`Image ${imageName} uploaded successfully!`);

          setUploadedImages((prevImages) => [...prevImages, imageSrc]);
          setNewImages((prevNewImages) =>
            prevNewImages.filter((img) => img !== imageSrc)
          );

          // Show the tick when an image is uploaded
          setShowTick(true);
          setTimeout(() => setShowTick(false), 2000);  // Hide the tick after 2 seconds

        } catch (error) {
          Logger.error("Error uploading image:", error);
        }
      }
    }
  };

  const startMonitoringAndUploading = () => {
    setIsUploading(true);

    uploadInterval.current = setInterval(async () => {
      await monitorImages();
    }, 5000); // Check every 5 seconds
  };

  const stopUploading = () => {
    setIsUploading(false);
    clearInterval(uploadInterval.current);
  };

  useEffect(() => {
    // Establish the socket connection
    socketRef.current = io(process.env.REACT_APP_API);

    // Set up the event listener for 'new-image'
    socketRef.current.on('new-image', (data) => {
        // Handle the new image data as needed
        Logger.log("New image:", data.imageUrl);
        // You can add the new image URL to your state if needed
        // setGalleryImages(prevImages => [...prevImages, data.imageUrl]);
    });

    // Clean up the socket connection when the component is unmounted
    return () => {
        if (socketRef.current) {
            socketRef.current.disconnect();
        }
    };
  }, []);

  useEffect(() => {
    if (isUploading) {
      uploadImages();
    }
  }, [newImages]);

  return (
    <Modal show={show} onHide={onHide} centered> {/* Utilizing the Modal component */}
      <Modal.Header closeButton>
        <Modal.Title>Monitor External Directory</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter URL to monitor"
          style={{ width: "100%", marginBottom: "10px" }}
        />
        <Button onClick={startMonitoringAndUploading} disabled={isUploading} variant="primary" style={{ marginRight: "10px" }}>
          Start
        </Button>
        <Button onClick={stopUploading} disabled={!isUploading} variant="secondary">
          Stop
        </Button>

        {loading && <p>Loading...</p>}
        {isUploading && newImages.length === 0 && <p>Waiting for new images...</p>}
        {showTick && <span>&#10003;</span>} {/* Display the tick when showTick is true */}
      </Modal.Body>
    </Modal>
  );
}

export default MonitorImages;
