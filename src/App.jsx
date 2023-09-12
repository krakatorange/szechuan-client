import './App.css';
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import SignUp from './Components/Sign_up';
import UploadFile from './Components/Upload_File';
import Dashboard from './Components/Dashboard';
import Events from './Components/Events';
import { UserAuthContextProvider } from './UserContextProvider'; // Update the path accordingly

function App() {
  return (
    <Router>
      <UserAuthContextProvider>
        <Routes>
          <Route path='/dashboard' element={<Dashboard />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path='/uploadfile/:eventId' element={<UploadFile/>}/>
          <Route path='/events' element={<Events/>}/>
        </Routes>
      </UserAuthContextProvider>
    </Router>
  );
}

export default App;
