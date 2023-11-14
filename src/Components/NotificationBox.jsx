import React, { useState, useEffect, useCallback } from "react";
import { parseISO, formatDistanceToNow, format } from "date-fns";
import { Link } from "react-router-dom";
import Logger from "../logger";
//import "./css/notificationBox.css";
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
    <>
      <style>
        {`
          .card {
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            position: relative;
          }

          .img-container {
            position: relative;
            height: 400px;
            overflow: hidden;
          }

          .img-container img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .event-name-overlay {
            position: absolute;
            top: 0;
            bottom: 0;
            left: 0;
            right: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: rgba(0, 0, 0, 0.6);
            color: white;
            font-size: 1.0em;
          }

          .menu-button {
            position: absolute;
            top: 10px;
            right: 10px;
            cursor: pointer;
            background-color: rgba(0, 0, 0, 0.4); /* Semi-transparent black */
            color: white;
            border-radius: 4px; /* Slightly rounded corners */
            padding: 6px 10px;
            font-size: 18px; /* Larger font size for visibility */
            display: flex;
            justify-content: center;
            align-items: center;
            width: 30px; /* Fixed width */
            height: 30px; /* Fixed height */
          }

          .menu-button:before, .menu-button:after {
            content: '';
            display: block;
            width: 20px; /* Width of the bars */
            height: 2px; /* Height of the bars */
            background-color: white; /* Color of the bars */
            margin: 4px 0; /* Spacing between the bars */
          }

          .card-menu {
            position: absolute;
            top: 40px;
            right: 10px;
            background-color: white;
            box-shadow: 0px 4px 8px 0px rgba(0, 0, 0, 0.1);
            padding: 8px 12px;
            z-index: 3;
          }

          .btn {
            background-color: #40a5f3;
            color: white;
            padding: 10px 16px;
            text-align: center;
            display: block;
            font-size: 1em;
            border-radius: 10px;
            width: 100%;
            text-decoration: none;
            margin-top: 10px;
            border-color: #40a5f3;
          }

          .btn:hover {
            border-color: #40a5f3; /* Border color on hover */
          }

          @media (max-width: 768px) {
            .img-container {
              height: 250px;
            }
          }
        `}
      </style>

      <div className="col-lg-5 col-md-12 mb-4">
        <div className="card h-100">
          <div className="img-container">
            <img src={event.coverPhotoUrl} alt={event.eventName} />
            <div className="event-name-overlay">
              {event.eventName}
            </div>
            {isAdmin && (
              <button className="menu-button" onClick={toggleMenu}>
                ...
              </button>
            )}
            {menuVisible && (
              <div className="card-menu">
                <button className="edit-button btn" onClick={handleEdit}>
                  Edit
                </button>
                <button className="delete-button btn" onClick={deleteEvent}>
                  Delete
                </button>
              </div>
            )}
          </div>
          <div className="card-footer">
            <Link to={`/event/${event.id}`} className="btn">
              Go to Gallery
            </Link>
          </div>
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
              eventId={event.id}
              onEventUpdated={handleEventUpdated}
            />
          </Modal.Body>
        </Modal>
      </div>
    </>
  );
}

export default EventNotification;
