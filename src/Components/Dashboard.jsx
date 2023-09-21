import React, { useState, useEffect } from 'react';
import { Container, Card } from 'react-bootstrap';
import CustomNavbar from './CustomNavbar';
import NotificationBox from './NotificationBox';
import GalleryLink from './galleryUrl'; // Import the GalleryLink component
import axios from 'axios';
import { useUserAuth } from "../UserContextProvider";

function Dashboard() {
  const [events, setEvents] = useState([]);
  const { user } = useUserAuth();
  const userId = user?.uid;

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API}/events/all/${userId}`)
      .then(response => {
        setEvents(response.data);
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
          <div style={{ display: 'grid' }}>
            {events.map(event => (
              <div key={event.id}>
                <NotificationBox event={event} />
                <GalleryLink eventId={event.id} /> {/* Pass the eventId as a prop */}
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Dashboard;
