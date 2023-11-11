import React, { createContext, useState, useEffect, useContext } from "react";

export const DirectoryPollerContext = createContext();

export const DirectoryPollerProvider = ({ children }) => {
  // Initialize state with values from localStorage or default values
  const initialState = JSON.parse(localStorage.getItem("directoryPollerState")) || {
    isPollerRunning: false,
    isPollerMinimized: false,
    currentEventId: null,
    eventName: "",
    url: "",
    newImages: [],
    uploadedImages: [],
    isUploading: false,
    showMonitorImages: false,
  };

  const [isPollerRunning, setIsPollerRunning] = useState(initialState.isPollerRunning);
  const [isPollerMinimized, setIsPollerMinimized] = useState(initialState.isPollerMinimized);
  const [currentEventId, setCurrentEventId] = useState(initialState.currentEventId);
  const [eventName, setEventName] = useState(initialState.eventName);
  const [url, setUrl] = useState(initialState.url);
  const [newImages, setNewImages] = useState(initialState.newImages);
  const [uploadedImages, setUploadedImages] = useState(initialState.uploadedImages);
  const [isUploading, setIsUploading] = useState(initialState.isUploading);
  const [showMonitorImages, setShowMonitorImages] = useState(initialState.showMonitorImages);

  // Function to save state to localStorage
  const saveState = () => {
    const state = {
      isPollerRunning,
      isPollerMinimized,
      currentEventId,
      eventName,
      url,
      newImages,
      uploadedImages,
      isUploading,
      showMonitorImages,
    };
    localStorage.setItem("directoryPollerState", JSON.stringify(state));
  };

  // Save state to localStorage on state changes
  useEffect(() => {
    saveState();
  }, [isPollerRunning, isPollerMinimized, currentEventId, eventName, url, newImages, uploadedImages, isUploading, showMonitorImages]);

  return (
    <DirectoryPollerContext.Provider
      value={{
        isPollerRunning,
        setIsPollerRunning,
        isPollerMinimized,
        setIsPollerMinimized,
        currentEventId,
        setCurrentEventId,
        eventName,
        setEventName,
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

export const useDirectoryPoller = () => {
  return useContext(DirectoryPollerContext);
};
