import React, { useState } from "react";
import { Navbar, Button } from "react-bootstrap";
import { FaUserCircle } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useUserAuth } from "../UserContextProvider";

function CustomNavbar() {
  const [showDrawer, setShowDrawer] = useState(false);
  const navigate = useNavigate();
  const { user, logOut } = useUserAuth();
  const userId = user?.uid;

  const toggleDrawer = () => {
    setShowDrawer(!showDrawer);
  };

  const handleLogOut = () => {
    // Perform sign-out logic here (e.g., clearing authentication state)
    // Then navigate to the signup component
    // Example: clearAuthenticationState();
    logOut();
    navigate("/signup");
  };

  const handleSelfie = () => {

    navigate(`/selfie/${userId}`);

  };

  const navItemsStyle = {
    display: "flex",
    alignItems: "center",
  };

  const userIconStyle = {
    cursor: "pointer",
    marginLeft: "10px", // Adjust the margin as needed
  };

  return (
    <div>
      <Navbar bg="light" expand="lg" className="justify-content-between">
        <Navbar.Brand href="/">Events</Navbar.Brand>
        <div style={navItemsStyle}>
          <Link to="/events" className="mr-3">
            <Button variant="primary" size="sm">
              Create Event
            </Button>
          </Link>
          <div style={userIconStyle} onClick={toggleDrawer}>
            <FaUserCircle size={24} />
          </div>
        </div>
      </Navbar>

      {showDrawer && (
        <div className="custom-drawer">
          {/* Drawer content */}
          <div className="drawer-content">
            <h5>User Information</h5>
            {user && (
              <p>Phone: {user.phoneNumber}</p>
            )}
            {/* Display user information here */}
            <Button onClick={handleSelfie}>Take Selfie</Button>
            <Button onClick={handleLogOut}>Sign Out</Button>
          </div>
          {/* Overlay for closing the drawer */}
          <div className="drawer-overlay" onClick={toggleDrawer}></div>
        </div>
      )}
    </div>
  );
}

export default CustomNavbar;