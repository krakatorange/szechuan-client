import React, { useState } from "react";
import axios from "axios";

function MonitorImages() {
  const [url, setUrl] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

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
      console.log("Received data:", data);
      if (data.image_urls && Array.isArray(data.image_urls)) {
        setImages(data.image_urls);
      } else {
        console.error("Unexpected response format");
      }
    } catch (err) {
      console.error("Failed to fetch images:", err);
    } finally {
      setLoading(false);
    }
  };

  const extractImageName = (url) => {
    return url.split("/").pop().split("?")[0];
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

      {loading && <p>Loading...</p>}

      <ul>
        {images.map((imageSrc, index) => (
          <li key={index} style={{ margin: "10px" }}>
            <img src={imageSrc} alt={`Fetched Image ${index + 1}`} style={{ width: "100px" }} />
            <p>{extractImageName(imageSrc)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default MonitorImages;
