import React, { useState, useEffect, useCallback, useRef } from "react";
import { Container, Card } from "react-bootstrap";
import NotificationBox from "./NotificationBox";
import axios from "axios";
import { useUserAuth } from "../UserContextProvider";
import Logger from "../logger";
import { io } from "socket.io-client";
import "./css/dashboard.css";

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
        localStorage.setItem('events', JSON.stringify(response.data));
      })
      .catch((error) => {
        Logger.error("Error fetching events:", error);
      });
  }, [userId]);

  useEffect(() => {
    const cachedEvents = localStorage.getItem('events');
  
    if (userId) {
      if (cachedEvents) {
        setEvents(JSON.parse(cachedEvents));
        fetchEvents();
      } else {
        fetchEvents();
      }
    }
  }, [fetchEvents, userId]);

  useEffect(() => {
    if (!userId) return; // Guard clause: if no userId, don't attempt to connect

    socket.current = io(process.env.REACT_APP_API);

    socket.current.on("event-created", (newEvent) => {
      setEvents((prevEvents) => {
        const updatedEvents = [...prevEvents, newEvent];
        localStorage.setItem('events', JSON.stringify(updatedEvents));
        return updatedEvents;
      });
    });
    

    socket.current.on("event-deleted", (deletedEventId) => {
      setEvents((prevEvents) =>
        prevEvents.filter((event) => event.id !== deletedEventId)
      );
    });

    // More socket event listeners can be added here as needed
    socket.current.on("eventsData", (data) => {
      // Check if the update is for the current user
      if (data.userId === userId) {
        setEvents(data.events);
      }
    });

    return () => {
      socket.current.disconnect();
    };
  }, [userId]);

  const onEventUpdated = useCallback(() => {
    // Instead of trying to update the state directly,
    // call fetchEvents to refresh the event list from the server.
    fetchEvents();
  }, [fetchEvents]);
  

  const deleteEvent = useCallback(
    (eventId) => {
      axios
        .delete(`${process.env.REACT_APP_API}/events/event/${eventId}`)
        .then((response) => {
          Logger.log("Event deleted successfully:", response.data);
          fetchEvents(); // refetch the events after deleting
        })
        .catch((error) => {
          Logger.error("Error deleting event:", error);
        });
    },
    [fetchEvents]
  );

  return (
    <Container className="dashboard-container">
      <h1 className="mt-4">Events Dashboard</h1>
      <Card className="dashboard-card mt-4">
        <Card.Body>
          <div className="notification-container">
            {events.map((event) => (
              <NotificationBox
                key={event.id}
                event={event}
                onDelete={deleteEvent}
                onEventUpdated={onEventUpdated}
              />
            ))}
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Dashboard;
