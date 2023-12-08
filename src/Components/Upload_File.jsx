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
import * as Dialog from "@radix-ui/react-dialog";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrashAlt,
  faDownload,
  faClose,
  faSort,
  faTasks,
} from "@fortawesome/free-solid-svg-icons";
import PQueue from 'p-queue';

function UploadFile() {
  const { eventId } = useParams();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [event, setEvent] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [showAllPhotos, setShowAllPhotos] = useState(true); // Add state for toggling between all photos and personal photos
  const [loading, setLoading] = useState(true); // Add loading state for fetching matched images
  const [matchedImages, setMatchedImages] = useState([]); // Add state to store matched images
  const { user, isAdmin } = useUserAuth();
  const userId = user?.uid;
  const fileInputRef = useRef(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
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
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const galleryUrl = `${window.location.origin}/event/${eventId}`;
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50;
  const [sortOrder, setSortOrder] = useState("none"); // 'asc', 'desc', or 'none'
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const uploadQueue = useRef(new PQueue({ concurrency: 5 })); // Adjust concurrency as needed

  useEffect(() => {
    // When the component mounts, set the currentEventId in your global state
    setCurrentEventId(eventId);
  }, [eventId, setCurrentEventId]);

  const handleFileInputChange = (event) => {
    const files = Array.from(event.target.files);
    uploadFiles(files);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
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

  const onTouchStart = (e) => {
    setTouchEnd(null); // reset touchEnd to null
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext(); // your next image function
    } else if (isRightSwipe) {
      handlePrevious(); // your previous image function
    }
  };

  const sortImages = (images) => {
    let sorted = [...images]; // Create a new array to sort
    if (sortOrder === "asc") {
      sorted.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    } else if (sortOrder === "desc") {
      sorted.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
    return sorted;
  };

  useEffect(() => {
    const sortedImages = sortImages(galleryImages);
    setGalleryImages(sortedImages);
  }, [sortOrder]);

  const getImageUrlForDownload = (index) => {
    const image =
      selectedImageType === "uploaded"
        ? galleryImages[index]
        : matchedImages[index];
    return image.imageUrl || image.matchedImageUrl;
  };

  const downloadImage = async (url) => {
    try {
      const response = await axios.get(url, { responseType: "blob" });
      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", "image.jpg"); // Use a specific filename or derive it
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(downloadUrl);
      link.remove();
    } catch (error) {
      console.error("Error downloading the image:", error);
    }
  };

  const enterMultiSelectMode = () => {
    setIsMultiSelectMode(true);
    setSelectedImages([]);
  };

  const toggleImageSelection = (index, imageType) => {
    const isSelected = selectedImages.some(
      (img) => img.index === index && img.imageType === imageType
    );
    if (isSelected) {
      setSelectedImages(
        selectedImages.filter(
          (img) => img.index !== index || img.imageType !== imageType
        )
      );
    } else {
      setSelectedImages([...selectedImages, { index, imageType }]);
    }
  };

  const downloadSelectedImages = () => {
    selectedImages.forEach((img) => {
      const imageUrl =
        img.imageType === "uploaded"
          ? galleryImages[img.index].imageUrl
          : matchedImages[img.index].matchedImageUrl;
      downloadImage(imageUrl);
    });
  };

  const exitMultiSelectMode = () => {
    setIsMultiSelectMode(false);
    setSelectedImages([]);
  };

  const handleImageClick = (imageUrl, index, imageType) => {
    if (isMultiSelectMode) {
      toggleImageSelection(index, imageType);
    } else {
      // Your existing logic for opening the image viewer
      setSelectedImageIndex(index);
      setSelectedImageType(imageType); // 'uploaded' or 'matched'
      setShowImageViewer(true);
    }
  };

  const renderGallery = (images, imageType) => {
    const sortedImages = sortImages(images);
    return sortedImages.map((item, index) => {
      const imageUrl = item.imageUrl || item.matchedImageUrl;
      const isSelected =
        isMultiSelectMode &&
        selectedImages.some(
          (img) => img.index === index && img.imageType === imageType
        );
      const imageClass = isSelected ? "gallery-img selected" : "gallery-img";

      return (
        <div key={index} className="gallery-item">
          <img
            src={imageUrl}
            alt={`Gallery item ${index}`}
            className={imageClass}
            onClick={() => handleImageClick(imageUrl, index, imageType)}
          />
        </div>
      );
    });
  };

  const handleDeleteImage = () => {
    if (selectedImageIndex !== null) {
      let apiUrl = "";
      let imageKey = "";
      let updatedImages = [];

      if (selectedImageType === "uploaded") {
        const imageToDelete = galleryImages[selectedImageIndex];
        const imageUrlSegments = imageToDelete.imageUrl.split("/");
        imageKey = imageUrlSegments[imageUrlSegments.length - 1];
        apiUrl = `${process.env.REACT_APP_API}/events/${eventId}/gallery/${imageKey}`;

        updatedImages = galleryImages.filter(
          (_, index) => index !== selectedImageIndex
        );
      } else if (selectedImageType === "matched") {
        const imageToDelete = matchedImages[selectedImageIndex];
        const imageUrlSegments = imageToDelete.matchedImageUrl.split("/");
        imageKey = imageUrlSegments[imageUrlSegments.length - 1];
        const renderGallery = (images) => {
          return images.map((item, index) => {
            const imageUrl = item.imageUrl || item.matchedImageUrl;
            return (
              <div key={index} className="gallery-item">
                <img
                  src={imageUrl}
                  alt={`Gallery item ${index}`}
                  className="gallery-img"
                  onClick={() => handleImageClick(imageUrl, index)}
                />
              </div>
            );
          });
        };
        apiUrl = `${process.env.REACT_APP_API}/events/${eventId}/matchdelete`;

        updatedImages = matchedImages.filter(
          (_, index) => index !== selectedImageIndex
        );
      }

      axios
        .delete(apiUrl, {
          data: {
            userId: userId,
            imageKey: imageKey,
          },
        })
        .then(() => {
          // Update the state by removing the deleted image
          if (selectedImageType === "uploaded") {
            setGalleryImages(updatedImages);
          } else {
            setMatchedImages(updatedImages);
          }

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

  const confirmDeleteImage = () => {
    setShowDeleteConfirmation(true);
  };

  const proceedWithDelete = () => {
    setShowDeleteConfirmation(false);
    handleDeleteImage(); // Your existing delete function
  };

  const cancelDelete = () => {
    setShowDeleteConfirmation(false);
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
      Logger.log("No files to upload.");
      return;
    }
  
    const YOUR_MAX_SIZE = 15 * 1024 * 1024; // 15 MB size limit
    setUploadingStatus({ uploading: true, success: false, error: null });
  
    filesToUpload.forEach((file, index) => {
      if (file.size > YOUR_MAX_SIZE) {
        Logger.error("File size too big:", file.name);
        setUploadingStatus({
          uploading: false,
          success: false,
          error: `File size too big: ${file.name}`,
        });
        return;
      }
      uploadQueue.current.add(() => uploadFile(file, index, filesToUpload.length));
    });
  };
  
  const uploadFile = async (file, index, totalFiles) => {
    const formData = new FormData();
    formData.append("galleryImage", file);
  
    try {
      await axios.post(
        `${process.env.REACT_APP_API}/events/${eventId}/upload`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
  
      // Fetch updated gallery images after each upload
      await axios.get(`${process.env.REACT_APP_API}/events/${eventId}/gallery`)
        .then((response) => {
          const formattedImages = response.data.map((img) => ({
            imageUrl: img.imageUrl,
            timestamp: img.timestamp,
          }));
          setGalleryImages(formattedImages);
        })
        .catch((error) => {
          Logger.error("Error fetching gallery images: ", error);
        });
  
      if (index === totalFiles - 1) {
        setSelectedFiles([]);
        setUploadingStatus({ uploading: false, success: true, error: null });
      }
    } catch (error) {
      Logger.error("Error uploading file:", error);
      setUploadingStatus({ uploading: false, success: false, error: error.message });
    }
  };
  
  // Make sure to update your useEffect hook to trigger the upload
  useEffect(() => {
    if (selectedFiles.length > 0) {
      uploadFiles(selectedFiles);
    }
  }, [selectedFiles]);
  

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
          const formattedImages = response.data.map((img) => ({
            imageUrl: img.imageUrl, // or simply img.imageUrl if the API sends it as imageUrl
            timestamp: img.timestamp,
          }));
          setGalleryImages(formattedImages);
        })
        .catch((error) => {
          Logger.error("Error fetching gallery images: ", error);
        });
    });

    axios
      .get(`${process.env.REACT_APP_API}/events/${eventId}/gallery`)
      .then((response) => {
        const formattedImages = response.data.map((img) => ({
          imageUrl: img.imageUrl, // or simply img.imageUrl if the API sends it as imageUrl
          timestamp: img.timestamp,
        }));
        setGalleryImages(formattedImages);
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

  const handleNext = () => {
    setSelectedImageIndex((prevIndex) =>
      prevIndex === galleryImages.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handlePrevious = () => {
    setSelectedImageIndex((prevIndex) =>
      prevIndex === 0 ? galleryImages.length - 1 : prevIndex - 1
    );
  };

  const handleClickOutside = (event) => {
    if (!event.target.closest(".sorting-dropdown")) {
      setIsDropdownOpen(false);
    }
  };

  useEffect(() => {
    if (isDropdownOpen) {
      // Attach the event listener
      document.addEventListener("click", handleClickOutside);
    } else {
      // Remove the event listener
      document.removeEventListener("click", handleClickOutside);
    }

    return () => {
      // Clean up
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const containerStyle = {
    maxWidth: "100%", // allows the container to expand fully on all screen sizes
    padding: "0", // maintains a small padding on the sides
    margin: "0",
  };

  const coverPhotoStyle = {
    width: "100%",
    objectFit: "cover",
    borderRadius: "10px",
  };

  return (
    <Container style={containerStyle}>
      {event ? (
        <Card
          className="mt-0"
          style={{
            width: "100%",
            maxWidth: "100vw",
            padding: "20px",
            boxSizing: "border-box",
          }}
        >
          {/* The Card.Img component is for the cover photo */}
          <Card.Img
            variant="top"
            src={event.coverPhotoUrl}
            className="cover-photo"
            style={coverPhotoStyle}
          />

          {/* The Card.Body component holds the event information and is displayed below the image */}
          <Card.Body className="text-center" style={{ padding: 10 }}>
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
        <div className="sorting-dropdown">
          {/* Sorting Dropdown */}
          <Button
            variant="primary"
            className="dropdown-toggle"
            id="dropdown-basic-button"
            title="Sort Images"
            onClick={toggleDropdown}
            style={{marginRight: "10px"}}
          >
            <FontAwesomeIcon icon={faSort} />
          </Button>
          <div
            className={`dropdown-menu ${isDropdownOpen ? "show" : ""}`}
            aria-labelledby="dropdown-basic-button"
          >
            <Button
              className="dropdown-item"
              onClick={() => setSortOrder("asc")}
            >
              Sort Ascending
            </Button>
            <Button
              className="dropdown-item"
              onClick={() => setSortOrder("desc")}
            >
              Sort Descending
            </Button>
          </div>

          {/* Multi-Select Dropdown */}
          <Button
            variant="primary"
            className="dropdown-toggle ml-3" // Added margin-left for spacing
            id="multi-select-dropdown-button"
            title="Multi Select Options"
            onClick={() => setIsMultiSelectMode(!isMultiSelectMode)}
          >
            <FontAwesomeIcon icon={faTasks} />
          </Button>
          {isMultiSelectMode && (
            <div
              className="dropdown-menu show"
              aria-labelledby="multi-select-dropdown-button"
            >
              <Button
                className="dropdown-item"
                onClick={downloadSelectedImages}
              >
                <FontAwesomeIcon icon={faDownload} /> Download Selected
              </Button>
              <Button className="dropdown-item" onClick={exitMultiSelectMode}>
                <FontAwesomeIcon icon={faClose} /> Exit Multi-Select
              </Button>
            </div>
          )}
        </div>
        {isAdmin && (
          <Button
            variant="primary"
            className="btn-md"
            onClick={handleUploadButtonClick}
            style={{ borderRadius: "10px", backgroundColor: " #40a5f3" }}
          >
            Upload Image
          </Button>
        )}

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

        {isAdmin && (
          <Button
            variant="primary"
            className="btn-md"
            onClick={toggleDirectoryPoller}
            style={{
              marginLeft: "5px",
              borderRadius: "10px",
              backgroundColor: " #40a5f3",
              marginRight: "25px",
            }}
          >
            Directory Polling
          </Button>
        )}
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
          ? renderGallery(galleryImages, "uploaded")
          : renderGallery(matchedImages, "matched")}
      </div>

      {/* Image Viewer Modal as Lightbox */}
      {selectedImageIndex !== null && (
        <Dialog.Root open={showImageViewer} onOpenChange={setShowImageViewer}>
          <Dialog.Portal>
            <Dialog.Overlay
              className="dialog-overlay"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <Dialog.Content className="dialog-content">
                <img
                  src={
                    selectedImageType === "uploaded"
                      ? galleryImages[selectedImageIndex]?.imageUrl
                      : matchedImages[selectedImageIndex]?.matchedImageUrl
                  }
                  alt={`Image ${selectedImageIndex}`}
                  className="lightbox-image"
                />
                <div className="dialog-controls">
                  <Dialog.Close className="icon-button close-icon">
                    <FontAwesomeIcon icon={faClose} />
                  </Dialog.Close>
                  <button
                    className="icon-button delete-icon"
                    onClick={confirmDeleteImage}
                  >
                    <FontAwesomeIcon icon={faTrashAlt} />
                  </button>

                  <button
                    className="icon-button download-icon"
                    onClick={() =>
                      downloadImage(getImageUrlForDownload(selectedImageIndex))
                    }
                  >
                    <FontAwesomeIcon icon={faDownload} />
                  </button>
                </div>
                <button
                  className="icon-button left-arrow"
                  onClick={handlePrevious}
                >
                  ←
                </button>
                <button
                  className="icon-button right-arrow"
                  onClick={handleNext}
                >
                  →
                </button>
              </Dialog.Content>
            </Dialog.Overlay>
          </Dialog.Portal>
        </Dialog.Root>
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
      {showDeleteConfirmation && (
        <Toast
          onClose={cancelDelete}
          show={showDeleteConfirmation}
          delay={10000}
          autohide={false}
          style={{
            position: "fixed",
            top: "50%", // Center vertically
            left: "50%", // Center horizontally
            transform: "translate(-50%, -50%)", // Adjust for exact centering
            zIndex: 1050, // Ensure it's above other elements
            minWidth: "300px", // Optional: Set a minimum width
          }}
        >
          <Toast.Header>
            <strong className="mr-auto">Confirm Delete</strong>
          </Toast.Header>
          <Toast.Body>
            Are you sure you want to delete this image?
            <div className="mt-2 text-center">
              <Button variant="danger" onClick={proceedWithDelete}>
                Yes
              </Button>
              <Button
                variant="secondary"
                onClick={cancelDelete}
                style={{ marginLeft: "10px" }}
              >
                No
              </Button>
            </div>
          </Toast.Body>
        </Toast>
      )}
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

          .lightbox-download-menu {
            position: absolute;
            top: 80px;
            right: 25px;
            z-index: 1050; // Higher z-index to ensure it's above other elements
          }
  
          .download-btn {
            background: none;
            border: none;
            color: #fff; // White color for visibility
            font-size: 1.2rem; // Adjust as needed
            cursor: pointer;
            text-decoration: none; // Removes underline from links
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
            padding: 10px;
            column-count: 6;
            column-gap: 5px;
          }
          
          .gallery-item {
            position: relative;
            overflow: hidden;
            cursor: pointer;
            border-radius: 1%;
            break-inside: avoid; /* Prevents items from splitting across columns */
            margin-bottom: 5px; 
          }

          @media (max-width: 767px) {
            .gallery {
              column-count: 1; /* fewer columns for smaller screens */
            }
          }
          
          .gallery-img {
            width: 100%;
            height: auto;
            transition: transform 0.3s ease;
            display: block; 
          }
          
          .gallery-item:hover .gallery-img {
            transform: scale(1.1);
          }
          
          .dialog-overlay {
            background-color: rgba(0, 0, 0, 0.8);
            position: fixed;
            inset: 0;
          }
          
          .dialog-content {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            max-width: 90vw;
            max-height: 90vh;
            background-color: transparent;
            border: none;
          }
          
          .lightbox-image {
            max-width: 100%;
            max-height: 80vh;
            display: block;
          }
          
          .dialog-controls {
            position: absolute;
            top: 10px;
            right: 10px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
          }
          
          .icon-button {
            background: rgba(0, 0, 0, 0.5);
            color: white;
            border: none;
            padding: 10px;
            cursor: pointer;
            border-radius: 20%;
            font-size: 15px;
          }
          
          .left-arrow, .right-arrow {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            border: none;
            padding: 10px;
            cursor: pointer;
            font-size: 14px;
            border-radius: 20%;
          }
          
          /* Adjust the arrow size and position */
          .left-arrow { left: 20px; }
          .right-arrow { right: 20px; }
          
          /* Style adjustments for mobile devices */
          @media (max-width: 767px) {
            .dialog-content {
              width: 100%; /* Use 'auto' to fit the image width */
              height: auto; /* Use 'auto' to fit the image height */
            }
          
            /* Adjust max height for mobile */
            .lightbox-image {
              max-width: 100%; /* Adjust max width for mobile */
              max-height: 80vh; /* Adjust max height for mobile */
              margin: 0 auto; /* Center the image horizontally */
            }
          
            /* Hide the left and right arrows for mobile */
            .left-arrow, .right-arrow {
              display: none;
            }
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
          .sorting-dropdown {
            position: relative;
            margin-right: auto; /* Aligns the dropdown to the far left of the flex container */
            margin-left: 20px; /* Adds a margin to the left */
          }
          
          .dropdown-toggle {
            background-color: #40a5f3;
            color: white;
            border: none;
            border-radius: 20px;
            padding: 10px 20px;
            cursor: pointer;
            font-size: 1rem;
          }
          
          .dropdown-menu {
            position: absolute;
            top: 100%;
            left: 0;
            z-index: 1000;
            display: none;
            min-width: 160px;
            padding: 5px 0;
            margin: 2px 0 0;
            font-size: 1rem;
            color: #333;
            text-align: left;
            list-style: none;
            background-color: #fff;
            border: 1px solid rgba(0,0,0,.15);
            border-radius: 5px;
            box-shadow: 0 6px 12px rgba(0,0,0,.175);
          }
          
          
          .dropdown-item {
            padding: 10px 20px;
            cursor: pointer;
            border: none;
            background-color: transparent;
          }
          
          .dropdown-item:hover {
            background-color: #f8f9fa;
          }
          
          @media (max-width: 767px) {
            .btn-md, .dropdown-toggle, .dropdown-item {
              padding: 5px 10px;
              font-size: 0.6rem;
              border-radius: 15px;
            }
          
            .dropdown-menu.show {
              display: block;
            }
          }

          .selected {
            border: 3px solid #40a5f3; /* Change as per your design */
          }

          .multi-select-dropdown {
            position: relative;
            margin-left: 20px;
          }
          
          .multi-select-dropdown .dropdown-menu {
            position: absolute;
            top: 100%;
            left: 0;
            z-index: 1000;
            display: none;
            min-width: 160px;
            padding: 5px 0;
            margin: 2px 0 0;
            font-size: 1rem;
            color: #333;
            text-align: left;
            list-style: none;
            background-color: #fff;
            border: 1px solid rgba(0,0,0,.15);
            border-radius: 5px;
            box-shadow: 0 6px 12px rgba(0,0,0,.175);
          }
          
          .multi-select-dropdown .dropdown-menu.show {
            display: block;
          }
          
          .multi-select-dropdown .dropdown-item {
            padding: 10px 20px;
            cursor: pointer;
            border: none;
            background-color: transparent;
          }
          
          .multi-select-dropdown .dropdown-item:hover {
            background-color: #f8f9fa;
          }

          .controls-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
    
          .sorting-dropdown {
            display: flex;
            align-items: center;
          }

          .gallery-img.selected, 
          .gallery-item:hover .gallery-img.selected {
            border: 3px solid #40a5f3; /* Highlight color for selected images */
            transform: none; /* Prevent scale transform on hover for selected images */
          }

          
        `}
      </style>
    </Container>
  );
}

export default UploadFile;
