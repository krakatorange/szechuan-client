import React, { useState, useEffect, useRef } from "react";
import { Container, Button, Card, Modal, Toast } from "react-bootstrap";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useUserAuth } from "../UserContextProvider";
import DirectoryPoller from "./DirectoryPoller";
import io from "socket.io-client";
import QRCode from "qrcode.react"; // Import QRCode
import Logger from "../logger";
import { useDirectoryPoller } from "../DirectoryPollerContext";

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
    if(!userId || !eventId) return;
    socketRef.current = io.connect(process.env.REACT_APP_API);
    socketRef.current.on("access-granted", (data) => {
      // Handle the event data here
      Logger.log("Access granted to user:", data.userId, "for event:", data.eventId, "with gallery URL:", data.galleryUrl);
      // You can also update the state or perform other operations based on the event data
    });
    axios
      .get(`${process.env.REACT_APP_API}/events/all/${userId}`)
      .then((response) => {
        const currentEvent = response.data.find((event) => event.id === eventId);
        setEvent(currentEvent);
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

  const containerStyle = {
    maxWidth: '90%', // allows the container to expand fully on all screen sizes
    padding: '0 15px', // maintains a small padding on the sides
  };

  return (
    <Container style={containerStyle}>
      {event ? (
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
      <div className="gallery mt-4">
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
                  className="gallery-img"
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
                  className="gallery-img"
                />
              </div>
            ))}
      </div>
      {selectedImageIndex !== null && (
        <Modal
          show={showImageViewer}
          onHide={() => {
            setShowImageViewer(false);
            setSelectedImageType(null);
            setShowMenu(false);
          }}
          centered
          size="lg"
          backdropClassName="blurred-backdrop"
        >
          <Modal.Body>
            <img
              src={
                selectedImageType === "uploaded"
                  ? galleryImages[selectedImageIndex]?.imageUrl
                  : matchedImages[selectedImageIndex]?.matchedImageUrl
              }
              alt="Selected"
              className="w-100"
            />

            <button onClick={() => setShowMenu(!showMenu)} className="menu-btn">
              •••
            </button>

            {showMenu && (
              <div className="menu-dropdown">
                <button onClick={handleDeleteImage}>Delete</button>
              </div>
            )}

            <button onClick={handlePreviousImage} className="nav-btn prev-btn">
              ⬅️
            </button>
            <button onClick={handleNextImage} className="nav-btn next-btn">
              ➡️
            </button>
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
          
          .prev-btn {
            left: 10px;
          }
          
          .next-btn {
            right: 10px;
          }

          .menu-btn {
            position: absolute;
            top: 10px;
            right: 10px;
            background-color: rgba(0, 0, 0, 0.7);
            color: white;
            border: none;
            border-radius: 50%;
            padding: 5px 10px;
            cursor: pointer;
            font-size: 18px;
          }
          
          .menu-dropdown {
            position: absolute;
            top: 40px;
            right: 10px;
            background-color: white;
            border: 1px solid #ccc;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
          }
          
          .menu-dropdown button {
            background: none;
            border: none;
            padding: 10px 20px;
            cursor: pointer;
            display: block;
            width: 100%;
            text-align: left;
            border-bottom: 1px solid #ccc;
          }
          
          .menu-dropdown button:last-child {
            border-bottom: none;
          }
          
          .blurred-backdrop {
            backdrop-filter: blur(5px);
          }          
          
        `}
      </style>
    </Container>
  );
}

export default UploadFile;
