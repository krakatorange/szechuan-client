import React, { useState, useEffect, useRef } from "react";
import {
  Container,
  Button,
  Card,
  Modal,
  Toast,
  Carousel,
} from "react-bootstrap";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useUserAuth } from "../UserContextProvider";
import DirectoryPoller from "./DirectoryPoller";
import io from "socket.io-client";
import QRCode from "qrcode.react"; // Import QRCode
import Logger from "../logger";
import { useDirectoryPoller } from "../DirectoryPollerContext";
import SwipeableViews from "react-swipeable-views";

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
  const {
    setCurrentEventId,
    showMonitorImages,
    setShowMonitorImages,
    setEventName,
  } = useDirectoryPoller();
  const socketRef = useRef(null);
  const [galleryURL, setGalleryURL] = useState("");
  const [isURLCopied, setIsURLCopied] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedImageType, setSelectedImageType] = useState(null); // 'uploaded' or 'matched'
  const [showDeleteToast, setShowDeleteToast] = useState(false);
  const [uploadingStatus, setUploadingStatus] = useState({
    uploading: false,
    success: false,
    error: null,
    exists: false,
  });

  const galleryUrl = `${window.location.origin}/event/${eventId}`;

  useEffect(() => {
    // When the component mounts, set the currentEventId in your global state
    setCurrentEventId(eventId);
  }, [eventId, setCurrentEventId]);

  const handleFileInputChange = (event) => {
    const files = Array.from(event.target.files);
    uploadFiles(files);
  };

  const toggleDirectoryPoller = () => {
    setShowMonitorImages(!showMonitorImages);
  };

  const toggleQRModal = () => {
    setShowQRModal(!showQRModal);
  };

  const copyGalleryURL = () => {
    navigator.clipboard.writeText(galleryURL).then(() => {
      setIsURLCopied(true);
    });
  };

  const handleImageClick = (index, type) => {
    setSelectedImageIndex(index);
    setSelectedImageType(type); // set the type of image clicked
    setShowImageViewer(true);
  };

  const handleNextImage = () => {
    if (selectedImageIndex < galleryImages.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  const handlePreviousImage = () => {
    if (selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  const handleDeleteImage = () => {
    if (selectedImageIndex !== null) {
      const imageToDelete = galleryImages[selectedImageIndex];

      // Extract the imageId from the imageUrl
      const imageUrlSegments = imageToDelete.imageUrl.split("/");
      const imageIdToDelete = imageUrlSegments[imageUrlSegments.length - 1];

      // Make the DELETE API call
      axios
        .delete(
          `${process.env.REACT_APP_API}/events/${eventId}/gallery/${imageIdToDelete}`
        )
        .then(() => {
          // Update the gallery state by removing the deleted image
          const updatedGalleryImages = galleryImages.filter(
            (_, index) => index !== selectedImageIndex
          );
          setGalleryImages(updatedGalleryImages);

          // Close the image viewer
          setShowImageViewer(false);

          // Show the toast notification
          setShowDeleteToast(true);
        })
        .catch((error) => {
          Logger.error("Error deleting image:", error);
        });
    }
  };

  useEffect(() => {
    if (selectedFiles.length > 0) {
      uploadFiles(selectedFiles);
    }
  }, [selectedFiles]);

  const handleUploadButtonClick = () => {
    if (selectedFiles.length === 0) {
      fileInputRef.current.click(); // trigger the file input if no files are selected
    }
  };

  const uploadFiles = (filesToUpload) => {
    Logger.log("uploadFiles function called with:", filesToUpload);
    if (filesToUpload.length === 0) {
      Logger.log("No files to upload."); // And this
      return;
    } // if no files, just return

    const YOUR_MAX_SIZE = 5 * 1024 * 1024;
    // Start the loading bar when uploading begins
    setUploadingStatus({ uploading: true, success: false, error: null });

    const uploadNextFile = (index) => {
      if (index < filesToUpload.length) {
        const file = filesToUpload[index];
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
            if (index === filesToUpload.length - 1) {
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
            Logger.error("Error uploading files:");
            if (error.message === "Image already exists in the gallery.") {
              setUploadingStatus({
                uploading: false,
                success: false,
                error: null,
                exists: true,
              });
              fileInputRef.current.value = null;
            } else {
              setUploadingStatus({
                uploading: false,
                success: false,
                error: "Image Already exists.",
                exists: false,
              });
              fileInputRef.current.value = null;
            }
            setSelectedFiles([]);
          });
        axios
          .get(`${process.env.REACT_APP_API}/events/${eventId}/gallery`)
          .then((response) => {
            setGalleryImages(response.data);
          })
          .catch((error) => {
            Logger.error("Error fetching gallery images: ", error);
          });
      }
    };
    uploadNextFile(0);
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
        Logger.error("Error fetching matched images:", error);
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
    if (!userId || !eventId) return;
    socketRef.current = io.connect(process.env.REACT_APP_API);
    socketRef.current.on("access-granted", (data) => {
      if (data.userId === userId) {
        // Fetch event details using Axios
        axios
          .get(`${process.env.REACT_APP_API}/events/all/${userId}`)
          .then((response) => {
            const currentEvent = response.data.find(
              (event) => event.id === eventId
            );
            if (currentEvent) {
              setEvent(currentEvent);
              setEventName(currentEvent.eventName);
            }
          })
          .catch((error) => {
            Logger.error("Error fetching event details: ", error);
          });
      }
    });
    axios
      .get(`${process.env.REACT_APP_API}/events/all/${userId}`)
      .then((response) => {
        const currentEvent = response.data.find(
          (event) => event.id === eventId
        );
        setEvent(currentEvent);

        setEventName(currentEvent.eventName);
      })
      .catch((error) => {
        Logger.error("Error fetching event details: ", error);
      });

    socketRef.current.on("new-image", (data) => {
      // When a new image is uploaded, fetch the gallery images again
      axios
        .get(`${process.env.REACT_APP_API}/events/${eventId}/gallery`)
        .then((response) => {
          setGalleryImages(response.data);
        })
        .catch((error) => {
          Logger.error("Error fetching gallery images: ", error);
        });
    });

    axios
      .get(`${process.env.REACT_APP_API}/events/${eventId}/gallery`)
      .then((response) => {
        setGalleryImages(response.data);
      })
      .catch((error) => {
        Logger.error("Error fetching gallery images: ", error);
      });
    axios
      .post(`${process.env.REACT_APP_API}/events/detect-face`, {
        userId: userId,
        eventId: eventId,
      })
      .then((response) => {
        Logger.log("Face detection completed:", response.data.message);
        // Handle the response as needed
      })
      .catch(() => {
        Logger.log("Error detecting face:");
      });
    // Send a request to grant access based on the "access" query parameter
    axios
      .post(`${process.env.REACT_APP_API}/events/access/${eventId}`, {
        userId: userId,
        galleryUrl: galleryUrl,
      })
      .then(() => {
        // Access granted successfully
        Logger.log("Access_Granted");
      })
      .catch((error) => {
        Logger.log("Error granting access:");
      });
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [eventId, userId]);

  useEffect(() => {
    // Establish socket connection
    socketRef.current = io.connect(process.env.REACT_APP_API);

    // Listen for new face match event
    socketRef.current.on("new-face-match", (data) => {
      if (data.userId === userId && data.eventId === eventId) {
        // Update the matchedImages state with the new image
        setMatchedImages((prevMatchedImages) => [
          ...prevMatchedImages,
          data.matchedImage,
        ]);
      }
    });

    // Clean up the listener when the component unmounts
    return () => {
      socketRef.current.off("new-face-match");
      socketRef.current.disconnect();
    };
  }, [userId, eventId]); // Dependencies array

  function formatDate(dateString) {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Intl.DateTimeFormat("en-US", options).format(
      new Date(dateString)
    );
  }

  const containerStyle = {
    maxWidth: "100%", // allows the container to expand fully on all screen sizes
    padding: "0", // maintains a small padding on the sides
    margin: "0",
  };

  const coverPhotoStyle = {
    width: "100%",
    objectFit: "cover",
  };

  return (
    <Container style={containerStyle}>
      {event ? (
        <Card className="mt-0" style={{ width: "100%", maxWidth: "100vw" }}>
          {/* The Card.Img component is for the cover photo */}
          <Card.Img
            variant="top"
            src={event.coverPhotoUrl}
            className="cover-photo"
            style={coverPhotoStyle}
          />

          {/* The Card.Body component holds the event information and is displayed below the image */}
          <Card.Body className="text-center" style={{padding: 10}}>
            <Card.Title>{event.eventName}</Card.Title>
            <Card.Text>
              {galleryImages.length} Photos . {formatDate(event.eventDateTime)}
            </Card.Text>
            <Card.Text>Venue: {event.eventLocation}</Card.Text>
            <button
              onClick={() => setShowAllPhotos(true)}
              className="custom-button"
            >
              All Photos ({galleryImages.length})
            </button>
            <button
              onClick={() => {
                setShowAllPhotos(false);
                fetchMatchedImages(); // Fetch matched images when the user clicks "Personal Gallery"
              }}
              className="custom-button"
            >
              Personal Gallery ({matchedImages.length})
            </button>
            <button onClick={handleInviteButtonClick} className="custom-button">
              Invite
            </button>
          </Card.Body>
        </Card>
      ) : (
        <p>Loading...</p> // or your preferred loading indicator
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
          className="btn-md"
          onClick={handleUploadButtonClick}
          style={{ borderRadius: "20px", backgroundColor: " #40a5f3" }}
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
          className="btn-md"
          onClick={toggleDirectoryPoller}
          style={{
            marginLeft: "10px",
            borderRadius: "20px",
            backgroundColor: " #40a5f3",
            marginRight: "25px",
          }}
        >
          Directory Polling
        </Button>
        <DirectoryPoller
          show={showMonitorImages} // use showMonitorImages from context to control visibility
          onHide={toggleDirectoryPoller}
          eventId={eventId}
        />
        <input
          ref={fileInputRef}
          type="file"
          name="galleryImage"
          multiple
          style={{ display: "none" }}
          onChange={handleFileInputChange}
        />
      </div>

      <div
        className="gallery mt-4"
        style={{ marginLeft: "15px", marginRight: "15px" }}
      >
        {showAllPhotos
          ? galleryImages.map((item, index) => (
              <div
                key={index}
                className="gallery-item"
                onClick={() => handleImageClick(index, "uploaded")}
              >
                <img
                  src={item.imageUrl}
                  alt={`Uploaded ${index}`}
                  className="mb-2 mb-md-4 shadow-1-strong rounded"
                />
              </div>
            ))
          : matchedImages.map((item, index) => (
              <div
                key={index}
                className="gallery-item"
                onClick={() => handleImageClick(index, "matched")}
              >
                <img
                  src={item.matchedImageUrl}
                  alt={`Matched ${index}`}
                  className="shadow-1-strong rounded"
                />
              </div>
            ))}
      </div>
      {/* Image Viewer Modal as Lightbox */}
      {selectedImageIndex !== null && (
        <Modal
          show={showImageViewer}
          onHide={() => {
            setShowImageViewer(false);
            setSelectedImageType(null);
            setShowMenu(false); // Reset the delete button state here
          }}
          centered
          size="xl"
          dialogClassName="lightbox-modal"
        >
          <Modal.Body>
            <Carousel
              activeIndex={selectedImageIndex}
              onSelect={(selectedIndex, e) => {
                setSelectedImageIndex(selectedIndex);
                setShowMenu(false); // Reset the delete button state here
              }}
              interval={null}
              nextLabel=""
              prevLabel=""
              indicators={false}
              touch={true}
            >
              {(selectedImageType === "uploaded"
                ? galleryImages
                : matchedImages
              ).map((item, index) => (
                <Carousel.Item key={index}>
                  <img
                    src={
                      selectedImageType === "uploaded"
                        ? item.imageUrl
                        : item.matchedImageUrl
                    }
                    alt={`Image ${index}`}
                    className="d-block w-100 lightbox-image"
                  />
                  <div className="lightbox-menu">
                    <button
                      className={`menu-btn ${showMenu ? "active" : ""}`} // Toggle the 'active' class
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(!showMenu);
                      }}
                    >
                      •••
                    </button>
                    {showMenu && (
                      <div className="menu-dropdown">
                        <button onClick={handleDeleteImage}>Delete</button>
                      </div>
                    )}
                  </div>
                </Carousel.Item>
              ))}
            </Carousel>
          </Modal.Body>
        </Modal>
      )}
      <Toast
        style={{
          position: "fixed", // Change from "absolute" to "fixed"
          bottom: 20, // Change from "top" to "bottom"
          right: 20,
          zIndex: 1000,
        }}
        onClose={() => setShowDeleteToast(false)}
        show={showDeleteToast}
        delay={3000}
        autohide
      >
        <Toast.Header>
          <strong className="mr-auto">Notification</strong>
        </Toast.Header>
        <Toast.Body>Image successfully deleted!</Toast.Body>
      </Toast>
      <style>
        {`
          /* CSS styles for the gallery */
          

          .delete-btn {
            position: absolute;
            top: 10px;
            right: 10px;
            background-color: rgba(0, 0, 0, 0.7);
            color: white;
            border: none;
            border-radius: 50%;
            padding: 10px;
            cursor: pointer;
          }
          
          .nav-btn {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            background-color: rgba(0, 0, 0, 0.7);
            color: white;
            border: none;
            border-radius: 50%;
            padding: 10px;
            cursor: pointer;
          }
          
          .lightbox-modal .modal-content {
  background: rgba(0, 0, 0, 0.5); /* Semi-transparent black background */
  border: none;
}

.lightbox-image {
  max-height: 80vh; /* Limit image height to fit the screen */
  object-fit: contain; /* Ensure the image fits within the element */
  background-color: #000; /* Black background to fill empty space */
}

.lightbox-menu {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1050; /* This should be higher than the z-index of the carousel controls */
}

.menu-btn {
  background: none;
  border: none;
  color: #fff; /* White color for visibility */
  font-size: 1.5rem; /* Larger dots */
  cursor: pointer;
  z-index: 1050;
}

.menu-dropdown {
  display: none; /* Initially hidden */
  position: absolute;
  top: 30px;
  right: 0;
  background-color: #fff;
  border-radius: 5px;
  padding: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.menu-dropdown button {
  background: none;
  border: none;
  color: #333;
  padding: 10px 20px;
  cursor: pointer;
  display: block;
  width: 100%;
  text-align: left;
  z-index: 1050;
}

/* Show the dropdown menu when the menu button is active */
.menu-btn.active + .menu-dropdown {
  display: block;
  z-index: 1050;
}

          
          .blurred-backdrop {
            backdrop-filter: blur(5px);
          } 
          
          .custom-button {
            margin: 0 10px;
            background-color: #40a5f3;
            color: white;
            opacity: 0.8;
            border: none;
            border-radius: 4px;
            padding: 10px 20px;
            cursor: pointer;
            transition: opacity 0.3s ease;
          }
          
          .custom-button:hover {
            opacity: 1;
          }

          @media (max-width: 767px) {
            .custom-button {
              margin: 5px; /* smaller margins for mobile */
              padding: 5px 10px; /* smaller padding for mobile */
              font-size: 0.8rem; /* smaller font size for mobile */
            }
      
            .button-container {
              display: flex;
              flex-direction: row; /* ensures buttons are in a horizontal line */
              justify-content: space-around; /* evenly spaces buttons across the available width */
              padding: 10px 0; /* adds some padding at the top and bottom */
            }
          }

          /* CSS in your stylesheet or <style> tag */
.gallery {
  column-count: 6;
  column-gap: 10px;
}

.gallery-item {
  break-inside: avoid;
  margin-bottom: 15px;
  display: inline-block;
  width: 100%;
}

/* Responsive adjustments */
@media (max-width: 1200px) {
  .gallery {
    column-count: 4;
  }
}

@media (max-width: 992px) {
  .gallery {
    column-count: 3;
  }
}

@media (max-width: 768px) {
  .gallery {
    column-count: 2;
  }
}

@media (max-width: 576px) {
  .gallery {
    column-count: 3;
  }
}

.gallery-item img {
  width: 100%;
  display: block;
  border-radius: 4px;
}

/* Mobile devices */
@media (max-width: 767px) { 
  .cover-photo { 
    height: 250px; /* Rectangle shape for mobile */
  }
}

/* Tablets and up */
@media (min-width: 768px) { 
  .cover-photo{ 
    height: 400px; /* Slightly larger for tablets */
  }
}

/* Desktops and up */
@media (min-width: 992px) { 
  .cover-photo { 
    height: 600px; /* Standard size for desktops */
  }
}
          
        `}
      </style>
    </Container>
  );
}

export default UploadFile;
