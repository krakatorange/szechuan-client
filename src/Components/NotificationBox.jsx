import React, { useState, useEffect, useCallback } from "react";
import { parseISO, formatDistanceToNow, format } from "date-fns";
import { Link } from "react-router-dom";
import Logger from "../logger";

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
    <div className="col-lg-3 col-md-6 mb-4">
      <div className="card h-100 me-3 mb-3">
        <div className="card-img-container">
          <img src={coverPhotoUrl} className="card-img-top" alt={eventName} />
          <span className="menu-button" onClick={toggleMenu}>☰</span>
          {menuVisible && (
            <div className="card-menu">
              <button className="delete-button" onClick={deleteEvent}>Delete</button>
            </div>
          )}
        </div>
        <div className="card-body d-flex flex-column">
          <div className="mb-auto">
            <h5 className="card-title text-truncate">
              {eventName}
            </h5>
            <p className="card-text text-truncate">Event Date/Time: {formattedEventDateTime}</p>
            <p className="card-text text-truncate">Location: {eventLocation}</p>
            <p className="card-text">Time remaining: {timeRemaining}</p>
          </div>
          <Link to={`/event/${id}`} className="btn btn-primary mt-auto go-gallery-button">
            Go to Gallery
          </Link>
        </div>
      </div>
      <style jsx>{`
        .card-img-container {
          position: relative;
          height: 200px;
          overflow: hidden;
        }

        .card-img-top {
          width: 100%;
          height: 100%;
          object-fit: contain;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        .menu-button {
          position: absolute;
          top: 10px;
          right: 10px;
          cursor: pointer;
          z-index: 1;
          background-color: #ffffff;
          border-radius: 50%;
          padding: 5px;
        }

        .card-menu {
          position: absolute;
          top: 40px;
          right: 10px;
          z-index: 2;
          background-color: white;
          box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
          padding: 12px 16px;
        }

        .delete-button, .go-gallery-button {
          background-color: #40a5f3;
          color: white;
          border: none;
          padding: 10px 20px;
          text-align: center;
          text-decoration: none;
          display: inline-block;
          font-size: 16px;
          margin: 4px 2px;
          transition-duration: 0.4s;
          cursor: pointer;
          border-radius: 10px;
        }

        .delete-button:hover, .go-gallery-button:hover {
          background-color: white;
          color: #40a5f3;
          border: 2px solid #40a5f3;
        }

        .card {
          width: 100%;
          box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2);
          transition: 0.3s;
        }

        .card:hover {
          box-shadow: 0 8px 16px 0 rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
}

export default EventNotification;
