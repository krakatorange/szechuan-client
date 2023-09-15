import React, { useState, useEffect, useRef } from "react";
import { Container, Button, Card } from "react-bootstrap";
import CustomNavbar from "./CustomNavbar";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useUserAuth } from "../UserContextProvider";

function UploadFile() {
  const { eventId } = useParams();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [event, setEvent] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const {user} = useUserAuth();
  const userId = user?.uid
  const fileInputRef = useRef(null);

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
      // Create a FormData object to send files to the server
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append(`galleryImage`, file);
      });

      // Send a POST request to the server to upload files
      axios.post(`${process.env.REACT_APP_API}/events/${eventId}/upload`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
        .then(() => {
          // console.log("Upload successful"); // Add this line
          alert("Files uploaded successfully.");
          setSelectedFiles([]); // Clear the selected files
          // console.log("Selected files cleared"); // Add this line

          axios.get(`${process.env.REACT_APP_API}/events/${eventId}/gallery`)
            .then((response) => {
              setGalleryImages(response.data);
            })
            .catch((error) => {
              console.error("Error fetching gallery images: ", error);
            });
        })
        .catch((error) => {
          console.error("Error uploading files:", error);
          alert("An error occurred while uploading files.");
        });
    }
  };

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API}/events/all/${userId}`)
      .then((response) => {
        const eventid = eventId; // Replace with your logic to get the eventId
        const selectedEvent = response.data.find(
          (event) => event.id === eventid
        );
        setEvent(selectedEvent);
      })
      .catch((error) => {
        console.error("Error fetching event data: ", error);
      });

    axios.get(`${process.env.REACT_APP_API}/events/${eventId}/gallery`)
      .then((response) => {
        setGalleryImages(response.data);
      })
      .catch((error) => {
        console.error("Error fetching gallery images: ", error);
      });
      axios
      .post(`${process.env.REACT_APP_API}/events/detect-face`, {
        userId: userId,
        eventId: eventId,
      })
      .then((response) => {
        console.log("Face detection completed:", response.data.message);
        // Handle the response as needed
      })
      .catch((error) => {
        console.error("Error detecting face:", error);
      });
  }, [eventId, userId]);

  return (
    <Container>
      <CustomNavbar />
      {event && (
        <Card className="mt-4" style={{ width: "100%", maxWidth: "100vw" }}>
          <Card.Img
            variant="top"
            src={event.coverPhotoUrl}
            style={{ width: "100%", height: "500px", objectFit: "cover" }}
          />
          <Card.Body
            className="text-center"
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              background: "rgba(255, 255, 255, 0.2)",
              borderBottomLeftRadius: "5px",
              borderBottomRightRadius: "5px",
              color: "white",
              width: "100%",
              maxWidth: "100vw",
              boxSizing: "border-box",
            }}
          >
            <Card.Title>{event.eventName}</Card.Title>
            <Card.Text>Event Date/Time: {event.eventDateTime}</Card.Text>
            <Card.Text>Location: {event.eventLocation}</Card.Text>
            <Card.Text>
              Time remaining: {/* Implement time remaining logic */}
            </Card.Text>
          </Card.Body>
        </Card>
      )}
      <div className="d-flex justify-content-end mt-3">
        <Button
          variant="primary"
          onClick={handleUploadButtonClick}
          style={{ borderRadius: "20px" }}
        >
          Upload Image
        </Button>
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
        {galleryImages.map((imageUrl, index) => (
          <div key={index} className="gallery-item">
            <img
              src={imageUrl}
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

export default UploadFile;
