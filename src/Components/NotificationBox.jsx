import React, { useState, useEffect, useCallback } from 'react';
import { parseISO, formatDistanceToNow, format } from 'date-fns';
import { Link } from 'react-router-dom';
import Logger from '../logger';

function EventNotification({ event, onDelete }) {
  const { id, eventName, eventDateTime, coverPhotoUrl, eventLocation } = event;
  const eventTime = parseISO(eventDateTime);
  const [timeRemaining, setTimeRemaining] = useState('');
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

  const formattedEventDateTime = format(eventTime, 'MMMM d, yyyy h:mm a');

  return (
    <div className="col-lg-4 col-md-6 mb-4">
      <div className="card">
        <img src={coverPhotoUrl} className="card-img-top" alt={eventName} />
        <div className="card-body">
          <h5 className="card-title">
            {eventName}
            <span className="float-right menu-button" onClick={toggleMenu}>
              {/* Replace with your own three-dots icon */}
              ☰
            </span>
            {menuVisible && (
              <div className="card-menu">
                <button onClick={deleteEvent}>Delete</button>
              </div>
            )}
          </h5>
          <p className="card-text">Event Date/Time: {formattedEventDateTime}</p>
          <p className="card-text">Location: {eventLocation}</p>
          <p className="card-text">Time remaining: {timeRemaining}</p>
          <Link to={`/event/${id}`} className="btn btn-primary">Go to Gallery</Link>
        </div>
      </div>
    </div>
  );
}

export default EventNotification;
