import React, { useState, useEffect, useCallback, useRef } from "react";
import { Container, Card } from "react-bootstrap";
import NotificationBox from "./NotificationBox";
import axios from "axios";
import { useUserAuth } from "../UserContextProvider";
import Logger from '../logger';
import { io } from "socket.io-client";

function Dashboard() {
  const [events, setEvents] = useState([]);
  const { user } = useUserAuth();
  const userId = user?.uid;
  const socket = useRef(null);

  const fetchEvents = useCallback(() => {
    if (!userId) return; // Guard clause: if no userId, don't attempt to fetch

    axios
      .get(`${process.env.REACT_APP_API}/events/all/${userId}`)
      .then((response) => {
        Logger.log("Fetched events:", response.data);
        setEvents(response.data);
      })
      .catch((error) => {
        Logger.error("Error fetching events:", error);
      });
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchEvents();
    }
  }, [fetchEvents, userId]);

  useEffect(() => {
    if (!userId) return; // Guard clause: if no userId, don't attempt to connect

    socket.current = io(process.env.REACT_APP_API);

    socket.current.on('event-created', (newEvent) => {
      setEvents(prevEvents => [...prevEvents, newEvent]);
    });

    socket.current.on('event-deleted', (deletedEventId) => {
      setEvents(prevEvents => prevEvents.filter(event => event.id !== deletedEventId));
    });

    // More socket event listeners can be added here as needed
    socket.current.on('eventsData', (data) => {
      // Check if the update is for the current user
      if (data.userId === userId) {
        setEvents(data.events);
      }
    });

    return () => {
      socket.current.disconnect();
    };
  }, [userId]); // Depend on userId so this effect runs when userId is available

  const deleteEvent = useCallback(
    (eventId) => {
      axios
        .delete(`${process.env.REACT_APP_API}/events/event/${eventId}`)
        .then((response) => {
          Logger.log("Event deleted successfully:", response.data);
          fetchEvents();  // refetch the events after deleting
        })
        .catch((error) => {
          Logger.error("Error deleting event:", error);
        });
    },
    [fetchEvents]
  );

  const containerStyle = {
    maxWidth: '90%', // allows the container to expand fully on all screen sizes
    padding: '0 15px', // maintains a small padding on the sides
  };

  return (
    <Container style={containerStyle}>
      <h1 className="mt-4">Dashboard</h1>
      <Card className="mt-4">
        <Card.Body>
          <h5>You are all checked in!</h5>
          <p>You'll get a text when photos from your event are uploaded.</p>
          <div style={{ display: "grid" }}>
            {events.map((event) => (
              <NotificationBox key={event.id} event={event} onDelete={deleteEvent} />
            ))}
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Dashboard;
