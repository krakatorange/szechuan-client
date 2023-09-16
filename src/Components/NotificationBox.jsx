import React, { useState, useEffect } from 'react';
import { parseISO, formatDistanceToNow, format } from 'date-fns';
import { Link } from 'react-router-dom';

function EventNotification({ event }) {
  const { id, eventName, eventDateTime, coverPhotoUrl, eventLocation } = event; // Assuming you have eventLocation in your event object
  const eventTime = parseISO(eventDateTime);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [alertShown, setAlertShown] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const distance = formatDistanceToNow(eventTime, { addSuffix: true });
      setTimeRemaining(distance);

      if (!alertShown && new Date() > eventTime) {
        console.log(`Event "${eventName}" is happening now!`);
        setAlertShown(true);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [eventTime, eventName, alertShown]);

  const formattedEventDateTime = format(eventTime, 'MMMM d, yyyy h:mm a'); // Format event date and time

  return (
    <div className="col-lg-4 col-md-6 mb-4">
      <div className="card">
        <img src={coverPhotoUrl} className="card-img-top" alt={eventName} />
        <div className="card-body">
          <h5 className="card-title">{eventName}</h5>
          <p className="card-text">Event Date/Time: {formattedEventDateTime}</p>
          <p className="card-text">Location: {eventLocation}</p>
          <p className="card-text">Time remaining: {timeRemaining}</p>
          <Link to={`/uploadfile/${id}`} className="btn btn-primary">Go to Gallery</Link>
        </div>
      </div>
    </div>
  );
}

export default EventNotification;
