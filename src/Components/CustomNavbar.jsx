import React, { useState } from "react";
import { Navbar, Button } from "react-bootstrap";
import { FaUserCircle, FaFolder } from "react-icons/fa"; // Importing Folder icon
import { Link, useNavigate } from "react-router-dom";
import { useUserAuth } from "../UserContextProvider";
import { useDirectoryPoller } from "../DirectoryPollerContext"; // Assuming you have this hook from your context

function CustomNavbar() {
  const [showDrawer, setShowDrawer] = useState(false);
  const navigate = useNavigate();
  const { user, logOut } = useUserAuth();
  const userId = user?.uid;

  // Directory Poller state and functions from context
  const {
    isPollerRunning,
    setIsPollerMinimized,
    currentEventId,
    isPollerMinimized,
  } = useDirectoryPoller();

  const toggleDrawer = () => {
    setShowDrawer(!showDrawer);
  };

  const handleLogOut = () => {
    logOut();
    navigate("/signup");
  };

  const handleSelfie = () => {
    navigate(`/selfie/${userId}`);
  };

  const handleDirectoryPollerClick = () => {
    if (currentEventId) {
      navigate(`/event/${currentEventId}`);
    }
  };

  const navItemsStyle = {
    display: "flex",
    alignItems: "center",
  };

  const userIconStyle = {
    cursor: "pointer",
    marginLeft: "10px",
  };

  return (
    <div>
      <Navbar bg="light" expand="lg" className="justify-content-between">
        <Navbar.Brand href="/">Events</Navbar.Brand>
        <div style={navItemsStyle}>
          {/* other navbar items */}
          {currentEventId && ( // Only show the DirectoryPoller icon if there's an active event
            <div
              onClick={handleDirectoryPollerClick}
              style={{ cursor: "pointer", marginRight: "15px" }}
            >
              <FaFolder color={isPollerRunning ? "green" : "grey"} size={24} />
              {/* Display event name next to the icon */}
              <span style={{ marginLeft: "8px" }}>{currentEventId}</span>
            </div>
          )}
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
            {user && <p>Phone: {user.phoneNumber}</p>}
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
