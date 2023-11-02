import React, { useState, useEffect } from "react";
import { Container, Form, Button } from "react-bootstrap";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { useUserAuth } from "../UserContextProvider";
import Logger from "../logger";
import { io } from "socket.io-client";

const socket = io(process.env.REACT_APP_API);

function EditEvent({eventId, onEventUpdated}) {
  const [currentEvent, setCurrentEvent] = useState(null);
  const [eventName, setEventName] = useState("");
  const [eventDateTime, setEventDateTime] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUserAuth();
  const navigate = useNavigate();
  

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append("eventName", eventName);
      formData.append("eventDateTime", eventDateTime);
      formData.append("eventLocation", eventLocation);
      if (coverPhoto) {
        formData.append("coverPhoto", coverPhoto);
      }

      const response = await axios.patch(
        `${process.env.REACT_APP_API}/events/${eventId}/edit`,
        formData
      );
      Logger.log("Event updated successfully:", response.data);

      // Emit an event-updated event to the server
      socket.emit("event-updated", response.data);

      // If you want to navigate back to the dashboard after the update
      // navigate("/dashboard");
      onEventUpdated(response.data);
    } catch (error) {
      Logger.error("Error updating event: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExit = () => {
    navigate("/dashboard");
  };

  const handleCoverPhotoChange = (e) => {
    setCoverPhoto(e.target.files[0]);
  };

  const containerStyle = {
    maxWidth: "90%",
    padding: "0 15px",
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Container style={containerStyle}>
      <div className="d-flex justify-content-center align-items-center form-container">
        <div className="vertical-form">
          <h2>Edit Event Information</h2>
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
              Update Event
            </Button>
          </Form>
        </div>
      </div>
    </Container>
  );
}

export default EditEvent;
