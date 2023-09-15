import React from "react";
import { Navigate } from "react-router-dom";
import { useUserAuth } from "./UserContextProvider";
const ProtectedRoute = (props) => {
  const { user } = useUserAuth();
  const children = props.children;

  // console.log("Check user in Private: ", user);
  const currentUserStorage = JSON.parse(localStorage.getItem("currentUser"))
  const isUser = currentUserStorage?.uid;
  // console.log("currentuserLocal: ", currentUserStorage)
  if (!isUser) {
    return <Navigate to="/signup" />;
  }
  return children;
};

export default ProtectedRoute;