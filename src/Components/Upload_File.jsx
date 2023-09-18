import React, { useState, useEffect, useRef } from "react";
import { Container, Button, Card, Modal } from "react-bootstrap";
import CustomNavbar from "./CustomNavbar";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useUserAuth } from "../UserContextProvider";
import { useNavigate } from "react-router-dom";
import QRCode from "qrcode.react"; // Import QRCode

function UploadFile() {
  const { eventId } = useParams();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [event, setEvent] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [showAllPhotos, setShowAllPhotos] = useState(true); // Add state for toggling between all photos and personal photos
  const [loading, setLoading] = useState(true); // Add loading state for fetching matched images
  const [matchedImages, setMatchedImages] = useState([]); // Add state to store matched images
  const { user } = useUserAuth();
  const userId = user?.uid;
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const [galleryURL, setGalleryURL] = useState("");
  const [isURLCopied, setIsURLCopied] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const galleryUrl = `${window.location.origin}/uploadfile/${eventId}`;

  const handleFileInputChange = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
  };

  const toggleQRModal = () => {
    setShowQRModal(!showQRModal);
  };

  const copyGalleryURL = () => {
    navigator.clipboard.writeText(galleryURL).then(() => {
      setIsURLCopied(true);
    });
  };

  const handleUploadButtonClick = () => {
    // Check if any files are selected
    if (selectedFiles.length === 0) {
      // Open the file dialog for multiple file uploads
      fileInputRef.current.click();
    } else {
      // Upload files one by one
      const uploadNextFile = (index) => {
        if (index < selectedFiles.length) {
          const file = selectedFiles[index];

          // Create a FormData object to send the file to the server
          const formData = new FormData();
          formData.append("galleryImage", file);

          // Send a POST request to upload the file
          axios
            .post(
              `${process.env.REACT_APP_API}/events/${eventId}/upload`,
              formData,
              {
                headers: {
                  "Content-Type": "multipart/form-data",
                },
              }
            )
            .then(() => {
              // File uploaded successfully
              if (index === selectedFiles.length - 1) {
                // All files uploaded, clear the selected files
                setSelectedFiles([]);
                alert("All files uploaded successfully.");
              }

              // Upload the next file
              uploadNextFile(index + 1);
            })
            .catch((error) => {
              console.error("Error uploading files:", error);
              alert("An error occurred while uploading files.");
            });
          axios
            .get(`${process.env.REACT_APP_API}/events/${eventId}/gallery`)
            .then((response) => {
              setGalleryImages(response.data);
            })
            .catch((error) => {
              console.error("Error fetching gallery images: ", error);
            });
        }
      };

      // Start uploading files from the first file in the array
      uploadNextFile(0);
    }
  };

  const fetchMatchedImages = () => {
    const apiUrl = `${process.env.REACT_APP_API}/events/matched/${userId}/${eventId}`;

    // Fetch matched images when the component mounts
    axios
      .get(apiUrl)
      .then((response) => {
        setMatchedImages(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching matched images:", error);
        setLoading(false);
      });
  };

  const handleInviteButtonClick = () => {
    // Generate the gallery URL
    const galleryURL = `${window.location.origin}/uploadfile/${eventId}`;

    // Set the gallery URL in state and show the QR code
    setGalleryURL(galleryURL);
    setIsURLCopied(false);
    toggleQRModal();
  };

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API}/events/all/${userId}`)
      .then((response) => {
        const eventid = eventId;
        const selectedEvent = response.data.find(
          (event) => event.id === eventid
        );
        setEvent(selectedEvent);
      })
      .catch((error) => {
        console.error("Error fetching event data: ", error);
      });

    axios
      .get(`${process.env.REACT_APP_API}/events/${eventId}/gallery`)
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
    // Send a request to grant access based on the "access" query parameter
    axios
      .post(`${process.env.REACT_APP_API}/events/access/${eventId}`, {
        userId: userId,
        galleryUrl: galleryUrl,
      })
      .then(() => {
        // Access granted successfully
        console.log("Access_Granted");
      })
      .catch((error) => {
        console.error("Error granting access:", error);
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
            <button onClick={() => setShowAllPhotos(true)}>All Photos</button>
            <button
              onClick={() => {
                setShowAllPhotos(false);
                fetchMatchedImages(); // Fetch matched images when the user clicks "Personal Gallery"
              }}
            >
              Personal Gallery
            </button>
            <button onClick={handleInviteButtonClick}>Invite</button>
          </Card.Body>
        </Card>
      )}
      {/* QR Code Modal */}
      <Modal show={showQRModal} onHide={toggleQRModal}>
        <Modal.Header closeButton>
          <Modal.Title>QR Code</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {/* Display the QR code */}
          <QRCode value={galleryURL} size={200} />

          {/* Display the gallery URL */}
          <p>Gallery URL: {galleryURL}</p>

          {/* Copy button */}
          <Button
            variant="primary"
            onClick={copyGalleryURL}
            disabled={isURLCopied}
          >
            {isURLCopied ? "URL Copied!" : "Copy URL"}
          </Button>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={toggleQRModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
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
        {showAllPhotos
          ? galleryImages.map((item, index) => (
              <div key={index} className="gallery-item">
                <img
                  src={item.imageUrl}
                  alt={`Uploaded ${index}`}
                  className="gallery-img"
                />
              </div>
            ))
          : matchedImages.map((item, index) => (
              <div key={index} className="gallery-item">
                <img
                  src={item.matchedImageUrl}
                  alt={`Matched ${index}`}
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
