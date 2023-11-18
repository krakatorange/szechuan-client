import React, { useState, useRef, useEffect } from "react";
import { Navbar, Button } from "react-bootstrap";
import { FaUserCircle, FaFolder } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useUserAuth } from "../UserContextProvider";
import { useDirectoryPoller } from "../DirectoryPollerContext";

function CustomNavbar() {
  const [showDrawer, setShowDrawer] = useState(false);
  const navigate = useNavigate();
  const { user, logOut, isAdmin } = useUserAuth();
  const userId = user?.uid;
  const { isPollerRunning,  eventName, currentEventId, setShowMonitorImages } = useDirectoryPoller();
  const userIconRef = useRef(null); // Ref for the user icon
  const [drawerStyle, setDrawerStyle] = useState({});

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
      setShowMonitorImages(true);
    }
  };

  // Function to update the drawer position
  const updateDrawerPosition = () => {
    if (userIconRef.current) {
      const rect = userIconRef.current.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const top = rect.top + scrollTop + rect.height; // position below the icon
      const right = window.innerWidth - rect.right; // position aligned to the right of the icon

      // Update drawer style
      setDrawerStyle({
        top: `${top}px`,
        right: `${right}px`, // align to the right side of the icon
        width: '300px', // increased width for the drawer
        padding: '15px', // added padding for the drawer content
      });
    }
  };

  const drawerRef = useRef(null);

  // Function to close the drawer
  const closeDrawer = () => {
    setShowDrawer(false);
  };

  // Effect to handle clicks outside of the user icon and the drawer
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userIconRef.current && !userIconRef.current.contains(event.target) && 
          drawerRef.current && !drawerRef.current.contains(event.target)) {
        closeDrawer();
      }
    };

    // Add event listener when the drawer is open
    if (showDrawer) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // Cleanup function to remove event listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDrawer]);

  // Update drawer position when it's opened
  useEffect(() => {
    if (showDrawer) {
      updateDrawerPosition();
    }
  }, [showDrawer]);

  const styles = {
    navbarContainer: {
      width: '100%', 
      paddingLeft: 0, 
      paddingRight: 0, 
      backgroundColor: '#f4f4f4',
    },
    navbar: {
      width: '100%', 
      backgroundColor: '#f4f4f4',
      borderBottom: '1px solid #ddd', 
      padding: '0.5rem 1rem', 
    },
    brand: {
      color: '#40a5f3',
      fontWeight: 'bold',
      fontSize: '1.5rem',
    },
    navItems: {
      display: 'flex',
      alignItems: 'center',
    },
    directory: {
      cursor: 'pointer',
      marginRight: '15px',
    },
    eventId: {
      marginLeft: '8px',
      color: '#40a5f3',
    },
    button: {
      backgroundColor: '#40a5f3',
      color: '#f4f4f4',
      borderColor: '#40a5f3',
      padding: '5px',
    },
    userIcon: {
      cursor: 'pointer',
      marginLeft: '10px',
      color: '#40a5f3', 
      position: 'relative', 
    },
    customDrawer: {
      position: 'absolute',
      backgroundColor: 'white',
      boxShadow: '0px 8px 16px 0px rgba(0,0,0,0.2)',
      zIndex: 1,
      transition: 'transform 0.3s ease-out', // Add this line for transition animation
      transform: showDrawer ? 'translateX(0)' : 'translateX(100%)', // Add this line for sliding effect
      borderRadius: '10px', // Add border radius here
    },
    drawerContent: {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px', // space between items
    },
    drawerButton: {
      marginTop: '10px', // increased top margin for more space
      backgroundColor: '#40a5f3',
    },
    userInfo: {
      marginBottom: '15px', // space below user info section
    },
  };

  return (
    <div style={styles.navbarContainer}>
      <Navbar expand="lg" style={styles.navbar} className="justify-content-between">
        <Link to="/" style={styles.brand} className="navbar-brand">Events</Link>
        <div style={styles.navItems}>
        {isPollerRunning && eventName && (
            <div onClick={handleDirectoryPollerClick} style={styles.directory}>
              <FaFolder color="green" size={24} />
              <span style={styles.eventId}>{eventName}</span>
            </div>
          )}
         {isAdmin && (
            <Link to="/events" className="mr-3">
              <Button variant="primary" size="sm" style={styles.button}>
                Create Event
              </Button>
            </Link>
          )}
          <div style={styles.userIcon} onClick={toggleDrawer} ref={userIconRef}>
            <FaUserCircle size={24} color="#40a5f3" />
          </div>
        </div>
      </Navbar>

      {showDrawer && (
         <div style={{ ...styles.customDrawer, ...drawerStyle }} ref={drawerRef}>
          <div style={styles.drawerContent}>
            <h5>User Information</h5>
            {user && (
              <div style={styles.userInfo}>
                <div>Phone:</div>
                <div>{user.phoneNumber}</div>
              </div>
            )}
            <Button style={styles.drawerButton} onClick={handleSelfie}>Take Selfie</Button>
            <Button style={styles.drawerButton} onClick={handleLogOut}>Sign Out</Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomNavbar;