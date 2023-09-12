import React, { createContext, useContext, useState, useEffect } from "react";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "./firebase";

const UserAuthContext = createContext();

export function useUserAuth() {
  return useContext(UserAuthContext);
}

export function UserAuthContextProvider({ children }) {
  const [user, setUser] = useState(null); // Store user information

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
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
    return signInWithPhoneNumber(auth, phone, recaptchaVerifier);
  }

  function verifyCode(verificationCode) {
    try {
      // Implement your verification logic using Firebase's signInWithPhoneNumber and verificationCode
    } catch (error) {
      console.error("Error verifying code:", error);
    }
  }

  function signOut() {
    try {
      // Implement your sign-out logic using Firebase's signOut
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }

  const value = {
    user,
    recaptchaVerify,
    verifyCode,
    signOut,
  };

  return (
    <UserAuthContext.Provider value={value}>
      {children}
    </UserAuthContext.Provider>
  );
}
