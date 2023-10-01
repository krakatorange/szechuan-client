import React, { useState, useRef } from "react";
import axios from "axios";

function MonitorImages({ eventId }) {
  const [url, setUrl] = useState("");
  const [images, setImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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
        const newDetectedImages = data.image_urls.filter(
          (img) => !images.includes(img) && !uploadedImages.includes(img)
        );
        setNewImages((prevImages) => [...prevImages, ...newDetectedImages]);
        setImages((prevImages) => [...prevImages, ...newDetectedImages]);
      } else {
        console.error("Unexpected response format");
      }
    } catch (err) {
      console.error("Failed to fetch images:", err);
    } finally {
      setLoading(false);
    }
  };

  const startUploading = () => {
    setIsUploading(true);

    uploadInterval.current = setInterval(async () => {
      // Check for new images
      await monitorImages();

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

            console.log(`Image ${imageName} uploaded successfully!`);

            setUploadedImages((prevImages) => [...prevImages, imageSrc]);
            setNewImages((prevNewImages) =>
              prevNewImages.filter((img) => img !== imageSrc)
            );
          } catch (error) {
            console.error("Error uploading image:", error);
          }
        }
      }
    }, 5000); // Check every 5 seconds
  };

  const stopUploading = () => {
    setIsUploading(false);
    clearInterval(uploadInterval.current);
  };

  return (
    <div>
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter URL to monitor"
      />
      <button onClick={monitorImages} disabled={loading}>
        Monitor
      </button>

      <button onClick={startUploading} disabled={isUploading}>
        Start
      </button>
      <button onClick={stopUploading} disabled={!isUploading}>
        Stop
      </button>

      {loading && <p>Loading...</p>}
      {isUploading && newImages.length === 0 && <p>Waiting for new images...</p>}

      <ul>
        {images.map((imageSrc, index) => (
          <li key={index} style={{ margin: "10px" }}>
            <img
              src={imageSrc}
              alt={`Fetched Image ${index + 1}`}
              style={{ width: "100px" }}
            />
            <p>{imageSrc.split("/").pop().split("?")[0]}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default MonitorImages;
