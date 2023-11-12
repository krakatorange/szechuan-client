import React, { useState, useEffect, useCallback } from "react";
import { parseISO, formatDistanceToNow, format } from "date-fns";
import { Link } from "react-router-dom";
import Logger from "../logger";
import "./css/notificationBox.css";
import EditEvent from "./UpdateEvent";
import { Modal, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useUserAuth } from "../UserContextProvider";

function EventNotification({ event, onDelete, onEventUpdated }) {
  const { id, eventName, eventDateTime, coverPhotoUrl, eventLocation } = event;
  const eventTime = parseISO(eventDateTime);
  const [timeRemaining, setTimeRemaining] = useState("");
  const [alertShown, setAlertShown] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const navigate = useNavigate();
  const { isAdmin } = useUserAuth(); 

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  const handleEdit = () => {
    setShowEditModal(true);
    toggleMenu();
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
  };

  const handleOutsideClick = (e) => {
    if (!e.target.closest(".menu-button") && !e.target.closest(".card-menu")) {
      setMenuVisible(false);
    }
  };

  useEffect(() => {
    if (menuVisible) {
      document.addEventListener("mousedown", handleOutsideClick);
    } else {
      document.removeEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [menuVisible]);

  const deleteEvent = useCallback(() => {
    // Call the onDelete prop with the event's ID
    onDelete(id);
  }, [onDelete, id]);

  const handleEventUpdated = (updatedEvent) => {
    onEventUpdated(updatedEvent); // Call the function passed from Dashboard
    setShowEditModal(false); // Close the modal
    navigate("/dashboard"); // Navigate to the dashboard
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const distance = formatDistanceToNow(eventTime, { addSuffix: true });
      setTimeRemaining(distance);

      if (!alertShown && new Date() > eventTime) {
        Logger.log(`Event "${eventName}" is happening now!`);
        setAlertShown(true);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [eventTime, eventName, alertShown]);

  const formattedEventDateTime = format(eventTime, "MMMM d, yyyy h:mm a");

  return (
    <div className="event-notification-col">
      <div className="event-notification-card">
        <div className="card-img-container">
          <img src={coverPhotoUrl} alt={eventName} />
          <div className="event-details-overlay">
            <h5 className="card-title">{eventName}</h5>
            <p className="card-text">
              Event Date/Time: {formattedEventDateTime}
            </p>
            <p className="card-text">Location: {eventLocation}</p>
            <p className="card-text">Time remaining: {timeRemaining}</p>
          </div>
          {isAdmin && ( // Conditionally render menu if isAdmin
          <span className="menu-button" onClick={toggleMenu}>
            ...
          </span>
        )}
          {menuVisible && (
            <div className="card-menu">
              <button className="edit-button" onClick={handleEdit}>
                Edit
              </button>
              <button className="delete-button" onClick={deleteEvent}>
                Delete
              </button>
            </div>
          )}
        </div>
        <Link to={`/event/${id}`} className="go-gallery-button">
          Go to Gallery
        </Link>
      </div>
      {/* Edit Event Modal */}
      <Modal
        show={showEditModal}
        onHide={handleCloseEditModal}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Event</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <EditEvent
            eventId={event.id} // pass the event ID to EditEvent
            onEventUpdated={handleEventUpdated} // Pass the local function that handles event update
          />
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default EventNotification;
