import React, { useState, useEffect, useCallback, useRef } from "react";
import { Container, Card } from "react-bootstrap";
import CustomNavbar from "./CustomNavbar";
import NotificationBox from "./NotificationBox";
import axios from "axios";
import { useUserAuth } from "../UserContextProvider";
import Logger from '../logger';
import { io } from "socket.io-client";

function Dashboard() {
  const [events, setEvents] = useState([]);
  const [accessedEvents, setAccessedEvents] = useState([]);
  const { user } = useUserAuth();
  const userId = user?.uid;
  const socket = useRef(null);

  const fetchEvents = useCallback(() => {
    axios
      .get(`${process.env.REACT_APP_API}/events/all/${userId}`)
      .then((response) => {
        Logger.log("Fetched main events:", response.data);
        setEvents(response.data);
      })
      .catch((error) => {
        Logger.error("Error fetching main events:", error);
      });

    axios
      .get(`${process.env.REACT_APP_API}/events/getgallery/${userId}`)
      .then((response) => {
        Logger.log("Fetched accessed events:", response.data);
        setAccessedEvents(response.data);
      })
      .catch((error) => {
        Logger.error("Error fetching accessed events:", error);
      });
  }, [userId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    socket.current = io(process.env.REACT_APP_API);

    socket.current.on('event-created', (newEvent) => {
      setEvents(prevEvents => [...prevEvents, newEvent]);
    });

    socket.current.on('event-deleted', (deletedEventId) => {
      setEvents(prevEvents => prevEvents.filter(event => event.id !== deletedEventId));
      setAccessedEvents(prevEvents => prevEvents.filter(event => event.id !== deletedEventId));
    });

    // More socket event listeners can be added here as needed

    return () => {
      socket.current.disconnect();
    };
  }, []); // Empty dependency array ensures this effect runs only once

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

  return (
    <Container>
      <CustomNavbar />
      <h1 className="mt-4">Dashboard</h1>
      <Card className="mt-4">
        <Card.Body>
          <h5>You are all checked in!</h5>
          <p>You'll get a text when photos from your event are uploaded.</p>
          <div style={{ display: "grid" }}>
            {events.map((event) => (
              <NotificationBox key={event.id} event={event} onDelete={deleteEvent} />
            ))}
            {accessedEvents.map((accessedEvent) => (
              <NotificationBox key={accessedEvent.id} event={accessedEvent} onDelete={deleteEvent} />
            ))}
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Dashboard;
