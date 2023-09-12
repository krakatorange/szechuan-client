import React, { useState, useEffect } from 'react';
import { Container, Card } from 'react-bootstrap';
import CustomNavbar from './CustomNavbar';
import NotificationBox from './NotificationBox';
import axios from 'axios';
import { useUserAuth } from "../UserContextProvider";

function Dashboard() {
  const [events, setEvents] = useState([]); // Use 'events' instead of 'eventInfo'
  const {user} = useUserAuth();
  const userId = user?.uid

  useEffect(() => {
    // Fetch event information from the server
    // Using an API call to get the event data from the backend
    axios.get(`${process.env.REACT_APP_API}/events/all/${userId}`)
      .then(response => {
        setEvents(response.data); // Update state variable name to 'events'
      })
      .catch(error => {
        console.error('Error fetching events: ', error);
      });
  }, [userId]);

  return (
    <Container>
      <CustomNavbar />
      <h1 className="mt-4">Dashboard</h1>
      <Card className="mt-4">
        <Card.Body>
          <h5>You are all checked in!</h5>
          <p>You'll get a text when photos from your event are uploaded.</p>
          <div style={{display: 'grid'}}>
          {events.map(event => (
            <NotificationBox key={event.id} event={event} /> 
          ))}
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Dashboard;