import './App.css';
import React from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import CustomNavbar from './Components/CustomNavbar'; // adjust path if necessary
import SignUp from './Components/Sign_up';
import UploadFile from './Components/Upload_File';
import Dashboard from './Components/Dashboard';
import Selfie_Upload from './Components/Selfie_Upload';
import Events from './Components/Events';
import { UserAuthContextProvider } from './UserContextProvider'; // Update the path accordingly
import { DirectoryPollerProvider } from './DirectoryPollerContext'; // Update the path accordingly
import ProtectedRoute from "./Protected-Route";

function App() {
  return (
    <Router>
      <UserAuthContextProvider>
        <DirectoryPollerProvider> {/* <-- Wrap your Routes with DirectoryPollerContextProvider */}
          <RoutesWithNavbar />
        </DirectoryPollerProvider>
      </UserAuthContextProvider>
    </Router>
  );
}

function RoutesWithNavbar() {
  const location = useLocation();
  const isSignUpPage = location.pathname === '/signup'; // Add any other paths where you want to hide the navbar

  return (
    <>
      {!isSignUpPage && <CustomNavbar />} {/* Hide navbar for signup page */}
      <Routes>
        <Route path='/dashboard' element={<ProtectedRoute ><Dashboard /></ProtectedRoute>} />
        <Route path="/" element={<ProtectedRoute ><Dashboard /></ProtectedRoute>} />
        <Route path="/signup" element={<SignUp />} />
        <Route path='/event/:eventId' element={<ProtectedRoute><UploadFile/></ProtectedRoute>}/>
        <Route path='/selfie/:userId' element={<ProtectedRoute><Selfie_Upload/></ProtectedRoute>}/>
        <Route path='/events' element={<ProtectedRoute><Events/></ProtectedRoute>}/>
      </Routes>
    </>
  );
}

export default App;
