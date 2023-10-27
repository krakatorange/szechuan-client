import React, { useState, useEffect, useCallback } from "react";
import { parseISO, formatDistanceToNow, format } from "date-fns";
import { Link } from "react-router-dom";
import Logger from "../logger";
import './css/notificationBox.css';

function EventNotification({ event, onDelete }) {
  const { id, eventName, eventDateTime, coverPhotoUrl, eventLocation } = event;
  const eventTime = parseISO(eventDateTime);
  const [timeRemaining, setTimeRemaining] = useState("");
  const [alertShown, setAlertShown] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  const deleteEvent = useCallback(() => {
    // Call the onDelete prop with the event's ID
    onDelete(id);
  }, [onDelete, id]);

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
            <p className="card-text">Event Date/Time: {formattedEventDateTime}</p>
            <p className="card-text">Location: {eventLocation}</p>
            <p className="card-text">Time remaining: {timeRemaining}</p>
          </div>
          <span className="menu-button" onClick={toggleMenu}>...</span>
          {menuVisible && (
            <div className="card-menu">
              <button className="delete-button" onClick={deleteEvent}>Delete</button>
            </div>
          )}
        </div>
        <Link to={`/event/${id}`} className="go-gallery-button">Go to Gallery</Link>
      </div>
    </div>
  );
}

export default EventNotification;
