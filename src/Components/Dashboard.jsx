import React, { useState, useEffect } from "react";
import { Container, Card } from "react-bootstrap";
import CustomNavbar from "./CustomNavbar";
import NotificationBox from "./NotificationBox";
import axios from "axios";
import { useUserAuth } from "../UserContextProvider";

function Dashboard() {
  const [events, setEvents] = useState([]);
  const [accessedEvents, setAccessedEvents] = useState([]); // Changed to a single object, not an array
  const { user } = useUserAuth(); // Retrieve user from context
  const userId = user?.uid;

  useEffect(() => {
    // Fetch the events created by the user
    axios
      .get(`${process.env.REACT_APP_API}/events/all/${userId}`)
      .then((response) => {
        console.log("Fetched main events:", response.data);
        setEvents(response.data);
      })
      .catch((error) => {
        console.log("Error fetching main events: ");
      });

    // Fetch the accessed event's details
    axios
      .get(`${process.env.REACT_APP_API}/events/getgallery/${userId}`)
      .then((response) => {
        console.log("Fetched accessed event response:", response.data);
        setAccessedEvents(response.data); // Set as an array of accessed events
      })
      .catch((error) => {
        console.log("Error fetching accessed event: ");
      });
  }, [userId]); // Dependency array with userId

  return (
    <Container>
      <CustomNavbar />
      <h1 className="mt-4">Dashboard</h1>
      <Card className="mt-4">
        <Card.Body>
          <h5>You are all checked in!</h5>
          <p>You'll get a text when photos from your event are uploaded.</p>
          <div style={{ display: "grid" }}>
            {/* Display the events created by the user */}
            {events.map((event, index) => (
              <div key={event.id}>
                <NotificationBox event={event} />
              </div>
            ))}
            {/* Display the event the user has accessed, if available */}
            {accessedEvents.map((accessedEvent, index) => (
              <div key={accessedEvent.id}>
                <NotificationBox event={accessedEvent} />
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Dashboard;
