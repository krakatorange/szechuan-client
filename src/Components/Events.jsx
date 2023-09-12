import React, { useState } from "react";
import { Container, Form, Button } from "react-bootstrap";
import axios from 'axios';
import CustomNavbar from "./CustomNavbar";
import { useNavigate } from "react-router-dom";
// import { collection, addDoc } from "firebase/firestore";
// import { db } from "../firebase"; // Assuming you have your Firebase configuration set up in a separate file named 'firebase.js'.
import { useUserAuth } from "../UserContextProvider";


function EventPage() {
  const [eventName, setEventName] = useState('');
  const [eventDateTime, setEventDateTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const {user} = useUserAuth();
  const navigate = useNavigate();
  const userId = user?.uid

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('eventName', eventName);
      formData.append('eventDateTime', eventDateTime);
      formData.append('eventLocation', eventLocation);
      formData.append('coverPhoto', coverPhoto);
      formData.append('creatorId', userId);
  
      // Use Axios to make a POST request to your API endpoint
      const response = await axios.post(`${process.env.REACT_APP_API}/events/create`, formData);
  
      console.log('Event created successfully:', response.data);
      setEventName('');
      setEventDateTime('');
      setEventLocation('');
      setCoverPhoto(null);
  
      setTimeout(() => {
        setIsLoading(false); // Set isLoading to false
        navigate("/dashboard");
      }, 2000);
    } catch (error) {
      setIsLoading(false);
      console.error('Error creating event: ', error);
    }
  };
  
  
  const handleExit = () => {
    navigate("/dashboard");
  };
  

  return (
    <Container>
      <CustomNavbar/>
      <div className="d-flex justify-content-center align-items-center form-container">
        <div className="vertical-form">
          <h2>Enter New Event Information</h2>
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="eventName">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
              />
            </Form.Group>

            <Form.Group controlId="eventDateTime">
              <Form.Label>Date/Time</Form.Label>
              <Form.Control
                type="datetime-local"
                value={eventDateTime}
                onChange={(e) => setEventDateTime(e.target.value)}
              />
            </Form.Group>

            <Form.Group controlId="eventLocation">
              <Form.Label>Location</Form.Label>
              <Form.Control
                type="text"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
              />
            </Form.Group>

            <Form.Group controlId="coverPhoto">
              <Form.Label>Cover Photo</Form.Label>
              <div className="d-flex align-items-center">
                <input
                  type="file"
                  accept="image/*"
                  name="coverPhoto" 
                  onChange={(e) => setCoverPhoto(e.target.files[0])}
                />
                {coverPhoto && (
                  <img
                    src={URL.createObjectURL(coverPhoto)}
                    alt="Cover"
                    className="ml-3"
                    style={{ maxWidth: "100px", maxHeight: "100px" }}
                  />
                )}
              </div>
            </Form.Group>

            <Button type="submit" variant="primary" className="mt-3">
              Create Event
              {isLoading && ( // Display loading overlay if isLoading is true
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      backgroundColor: "rgba(255, 255, 255, 0.8)", // Semi-transparent white background
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
              )}
            </Button>
            <Button variant="secondary" className="mt-3" style={{marginLeft: '10px'}} onClick={handleExit}>
              Exit
            </Button>
          </Form>
        </div>
      </div>
    </Container>
  );
}

export default EventPage;
