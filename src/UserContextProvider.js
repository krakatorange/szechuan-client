import React, { createContext, useContext, useState, useEffect } from "react";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  onAuthStateChanged,
  signOut
} from "firebase/auth";
import { auth } from "./firebase";

const UserAuthContext = createContext();

export function useUserAuth() {
  return useContext(UserAuthContext);
}

export function UserAuthContextProvider({children}) {
  const [user, setUser] = useState(null); // Store user information

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if(currentUser){
        // console.log("Auth", currentUser);
        localStorage.setItem("currentUser", JSON.stringify(currentUser))
        setUser(currentUser);
      }
      else {
        // when the user is signed out
        // console.log('user logged out')
        localStorage.removeItem('currentUser')
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  function recaptchaVerify(phone) {
    const recaptchaVerifier = new RecaptchaVerifier(
      auth,
      "recaptcha-container",
      {}
    );
    recaptchaVerifier.render();

    // Perform phone number verification
    return signInWithPhoneNumber(auth, phone, recaptchaVerifier)
  }

  function verifyCode(verificationCode) {
    try {
      // Implement your verification logic using Firebase's signInWithPhoneNumber and verificationCode
    } catch (error) {
      console.error("Error verifying code:", error);
    }
  }

  function logOut() {
    try {
      // Implement your sign-out logic using Firebase's signOut
        localStorage.removeItem("currentUser")
        return signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }

  const value = {
    user,
    recaptchaVerify,
    verifyCode,
    logOut,
  };

  return (
    <UserAuthContext.Provider value={value}>
      {children}
    </UserAuthContext.Provider>
  );
}