import React, { useState, useEffect, useRef } from "react";
import { Container, Button, Card, Modal, Toast } from "react-bootstrap";
import CustomNavbar from "./CustomNavbar";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useUserAuth } from "../UserContextProvider";
import { useNavigate } from "react-router-dom";
import DirectoryPoller from "./DirectoryPoller";
import io from "socket.io-client"; 
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
  const socketRef = useRef(null);
  const [galleryURL, setGalleryURL] = useState("");
  const [isURLCopied, setIsURLCopied] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [isPollerMinimized, setIsPollerMinimized] = useState(false);
  const [showDirectoryPoller, setShowDirectoryPoller] = useState(false);
  const [uploadingStatus, setUploadingStatus] = useState({
    uploading: false,
    success: false,
    error: null,
    exists: false,
  });

  const galleryUrl = `${window.location.origin}/event/${eventId}`;

  const handleFileInputChange = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
  };

  const handleMinimizeClick = () => {
    setIsPollerMinimized(!isPollerMinimized);
  };

  const toggleDirectoryPoller = () => {
    setShowDirectoryPoller(!showDirectoryPoller);
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
    const YOUR_MAX_SIZE = 5 * 1024 * 1024;
    if (selectedFiles.length === 0) {
      fileInputRef.current.click();
    } else {
      // Start the loading bar when uploading begins
      setUploadingStatus({ uploading: true, success: false, error: null });

      const uploadNextFile = (index) => {
        if (index < selectedFiles.length) {
          const file = selectedFiles[index];
          if (file.size > YOUR_MAX_SIZE) {
            // define YOUR_MAX_SIZE in bytes
            setUploadingStatus({
              uploading: false,
              success: false,
              error: "The image size is too big",
            });
            return;
          }
          const formData = new FormData();
          formData.append("galleryImage", file);

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
              if (index === selectedFiles.length - 1) {
                setSelectedFiles([]);
                // Display success message
                setUploadingStatus({
                  uploading: false,
                  success: true,
                  error: null,
                });
              }
              uploadNextFile(index + 1);
            })
            .catch((error) => {
              console.error("Error uploading files:", error);
              if (error.message === "Image already exists in the gallery.") {
                setUploadingStatus({
                  uploading: false,
                  success: false,
                  error: null,
                  exists: true,
                });
              } else {
                setUploadingStatus({
                  uploading: false,
                  success: false,
                  error: "Image Already exists.",
                  exists: false,
                });
              }
              fileInputRef.current.value = "";
              setSelectedFiles([]);
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
    const galleryURL = `${window.location.origin}/event/${eventId}`;

    // Set the gallery URL in state and show the QR code
    setGalleryURL(galleryURL);
    setIsURLCopied(false);
    toggleQRModal();
  };

  useEffect(() => {
    socketRef.current = io.connect(process.env.REACT_APP_API);
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

      socketRef.current.on('new-image', (data) => {
        // When a new image is uploaded, fetch the gallery images again
        axios
          .get(`${process.env.REACT_APP_API}/events/${eventId}/gallery`)
          .then((response) => {
            setGalleryImages(response.data);
          })
          .catch((error) => {
            console.error("Error fetching gallery images: ", error);
          });
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
      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
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
          <p>Event URL: {galleryURL}</p>

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
              uploadingStatus.error ||
              uploadingStatus.exists
            }
            onClose={() =>
              setUploadingStatus({
                uploading: false,
                success: false,
                error: null,
                exists: false,
              })
            }
            delay={3000}
            autohide
          >
            <Toast.Body>
              {uploadingStatus.uploading && "Uploading..."}
              {uploadingStatus.success && "Upload successful!"}
              {uploadingStatus.error && uploadingStatus.error}
              {uploadingStatus.exists && "Image already exists in the gallery."}
            </Toast.Body>
          </Toast>
        </div>

        <Button
          variant="primary"
          onClick={toggleDirectoryPoller}
          style={{ marginLeft: "10px", borderRadius: "20px" }}
        >
          Directory Polling
        </Button>
        <div
        className={`directory-poller-container ${showDirectoryPoller ? "active" : ""} ${isPollerMinimized ? "minimized" : ""}`}
        >
        <div className="directory-poller-header">
          <h5>Directory Polling</h5>
          <button onClick={handleMinimizeClick}>
            {isPollerMinimized ? "Maximize" : "Minimize"}
          </button>
          <button onClick={toggleDirectoryPoller}>Close</button>
        </div>
        <div className="directory-poller-content">
          {showDirectoryPoller && <DirectoryPoller eventId={eventId} />}
        </div>
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

          .directory-poller-container {
            position: fixed;
            bottom: 0;
            right: 0;
            width: 300px;
            z-index: 1000;
            max-height: 70vh;
            overflow-y: auto;
            display: none; /* Default to not display */
            transform: translateY(100%);
            background-color: #fff;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
            border-radius: 10px 10px 0 0;
            transform: translateY(0);
            transition: transform 0.3s ease;
          }

          .directory-poller-container.active {
            display: block; /* Display when active */
            transform: translateY(0); /* Bring into view when active */
        }

          .directory-poller-container.minimized {
            transform: translateY(calc(100% - 40px));
          }

          .directory-poller-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            background-color: #f5f5f5;
            border-top-left-radius: 10px;
            border-top-right-radius: 10px;
          }

          .directory-poller-content {
            padding: 10px;
          }
        `}
      </style>
    </Container>
  );
}

export default UploadFile;
