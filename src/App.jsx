import './App.css';
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import SignUp from './Components/Sign_up';
import UploadFile from './Components/Upload_File';
import Dashboard from './Components/Dashboard';
import Selfie_Upload from './Components/Selfie_Upload'
import Events from './Components/Events';
import { UserAuthContextProvider } from './UserContextProvider'; // Update the path accordingly
import ProtectedRoute from "./Protected-Route";

function App() {
  return (
    <Router>
      <UserAuthContextProvider>
        <Routes>
          <Route path='/dashboard' element={<ProtectedRoute ><Dashboard /></ProtectedRoute>} />
          <Route path="/" element={<ProtectedRoute ><Dashboard /></ProtectedRoute>} />
          <Route path="/signup" element={<SignUp />} />
          <Route path='/uploadfile/:eventId' element={<ProtectedRoute><UploadFile/></ProtectedRoute>}/>
          <Route path='/selfie/:userId' element={<ProtectedRoute><Selfie_Upload/></ProtectedRoute>}/>
          <Route path='/events' element={<ProtectedRoute><Events/></ProtectedRoute>}/>
        </Routes>
      </UserAuthContextProvider>
    </Router>
  );
}

export default App;
