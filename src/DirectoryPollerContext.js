import React, { createContext, useState, useContext } from "react";

// Create a Context
export const DirectoryPollerContext = createContext();

// Create a Provider component
export const DirectoryPollerProvider = ({ children }) => {
  const [isPollerRunning, setIsPollerRunning] = useState(false);
  const [isPollerMinimized, setIsPollerMinimized] = useState(false);
  const [currentEventId, setCurrentEventId] = useState(null);
  const [url, setUrl] = useState("");
  const [newImages, setNewImages] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showMonitorImages, setShowMonitorImages] = useState(false);

  return (
    <DirectoryPollerContext.Provider
      value={{
        isPollerRunning,
        setIsPollerRunning,
        isPollerMinimized,
        setIsPollerMinimized,
        currentEventId,
        setCurrentEventId,
        url,
        setUrl,
        newImages,
        setNewImages,
        uploadedImages,
        setUploadedImages,
        isUploading,
        setIsUploading,
        showMonitorImages,
        setShowMonitorImages,
      }}
    >
      {children}
    </DirectoryPollerContext.Provider>
  );
};

// Custom hook to use this context
export const useDirectoryPoller = () => {
  return useContext(DirectoryPollerContext);
};
