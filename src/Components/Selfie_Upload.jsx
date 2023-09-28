import React, { useState, useEffect, useRef } from "react";
import { Container, Button, Toast } from "react-bootstrap";
import CustomNavbar from "./CustomNavbar";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useUserAuth } from "../UserContextProvider";

function Selfie_Upload() {
  const { eventId} = useParams();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [event, setEvent] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const {user} = useUserAuth();
  const userId = user?.uid;
  const fileInputRef = useRef(null);
  const [uploadingStatus, setUploadingStatus] = useState({
    uploading: false,
    success: false,
    error: null,
  });

  const handleFileInputChange = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
  };

  const handleUploadButtonClick = () => {
    // Check if any files are selected
    if (selectedFiles.length === 0) {
      // Open the file dialog for regular file uploads
      fileInputRef.current.click();
    } else {
      setUploadingStatus({ uploading: true, success: false, error: null });
      // Create a FormData object to send files to the server
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append(`selfieImage`, file);
      });

      // Send a POST request to the server to upload files
      axios.post(`${process.env.REACT_APP_API}/events/${userId}/selfie`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
        .then(() => {
          console.log("Upload successful"); // Add this line
          setSelectedFiles([]); // Clear the selected files
          setUploadingStatus({
            uploading: false,
            success: true,
            error: null,
          });
          console.log("Selected files cleared"); // Add this line

          axios.get(`${process.env.REACT_APP_API}/events/getselfie/${userId}`)
            .then((response) => {
              setGalleryImages(response.data);
            })
            .catch((error) => {
              console.error("Error fetching gallery images: ", error);
              setUploadingStatus({
                uploading: false,
                success: false,
                error: "An error occurred while uploading files.",
              });
            });
        })
        .catch((error) => {
          console.error("Error uploading files:", error);
          alert("An error occurred while uploading files.");
        });
    }
  };

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API}/events/getselfie/${userId}`)
      .then((response) => {
        setGalleryImages(response.data);
      })
      .catch((error) => {
        console.error("Error fetching gallery images: ", error);
      });
  }, [userId]);

  return (
    <Container>
      <CustomNavbar />
      <div className="d-flex justify-content-end mt-3">
        <Button
          variant="primary"
          onClick={handleUploadButtonClick}
          style={{ borderRadius: "20px" }}
        >
          Upload Image
        </Button>
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            right: "20px",
            zIndex: 1000,
          }}
        >
          <Toast
            show={
              uploadingStatus.uploading ||
              uploadingStatus.success ||
              uploadingStatus.error
            }
            onClose={() =>
              setUploadingStatus({
                uploading: false,
                success: false,
                error: null,
              })
            }
            delay={3000}
            autohide
          >
            <Toast.Body>
              {uploadingStatus.uploading && "Uploading..."}
              {uploadingStatus.success && "Upload successful!"}
              {uploadingStatus.error && uploadingStatus.error}
            </Toast.Body>
          </Toast>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          name="galleryImage"
          multiple
          style={{ display: "none" }}
          onChange={handleFileInputChange}
        />
      </div>
      <div className="gallery mt-4">
        {galleryImages.map((item, index) => (
          <div key={index} className="gallery-item">
            <img
              src={item.imageUrl}
              alt={`Uploaded ${index}`}
              className="gallery-img"
            />
          </div>
        ))}
      </div>
      <style>
        {`
          /* CSS styles for the gallery */
          .gallery {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 10px;
            margin-top: 20px;
          }

          .gallery-item {
            position: relative;
            width: 100%;
            height: 0;
            padding-bottom: 100%;
            overflow: hidden;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            cursor: pointer;
          }

          .gallery-img {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.2s ease-in-out;
          }

          .gallery-item:hover .gallery-img {
            transform: scale(1.05);
          }
        `}
      </style>
    </Container>
  );
}

export default Selfie_Upload;
