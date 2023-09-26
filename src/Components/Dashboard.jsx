import React, { useState, useEffect } from 'react';
import { Container, Card } from 'react-bootstrap';
import CustomNavbar from './CustomNavbar';
import NotificationBox from './NotificationBox';
import axios from 'axios';
import { useUserAuth } from "../UserContextProvider";

function Dashboard() {
  const [events, setEvents] = useState([]);
  const [accessedEvents, setAccessedEvents] = useState([]);
  const { user } = useUserAuth();
  const userId = user?.uid;

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API}/events/all/${userId}`)
      .then(response => {
        console.log('Fetched main events:', response.data);
        setEvents(response.data);

        // Fetch accessed events for each event
        const accessedEventsPromises = response.data.map(event => 
          axios.get(`${process.env.REACT_APP_API}/events/getgallery/${userId}/${event.id}`)
        );

        return Promise.all(accessedEventsPromises);
      })
      .then(accessedEventsResponses => {
        console.log('Fetched accessed events responses:', accessedEventsResponses);
        // Extract data from axios responses and set to state
        const accessedEventsData = accessedEventsResponses.map(response => response.data);
        console.log('Extracted accessed events data:', accessedEventsData);
        setAccessedEvents(accessedEventsData);
      })
      .catch(error => {
        console.error('Error fetching events or accessed events: ', error);
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
          <div style={{ display: 'grid' }}>
            {events.map((event, index) => (
              <div key={event.id}>
                <NotificationBox event={event} accessedEvent={accessedEvents[index]} />
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Dashboard;
