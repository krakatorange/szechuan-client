import React, { createContext, useContext, useState, useEffect } from "react";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { auth, db } from "./firebase";
import { saveEventUrlInCookie } from "./eventCookieHandler";
import { doc, setDoc, getDoc } from "firebase/firestore";
import Logger from "./logger";

const UserAuthContext = createContext();

export function useUserAuth() {
  return useContext(UserAuthContext);
}

export function UserAuthContextProvider({ children }) {
  const [user, setUser] = useState(null); // Store user information
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (window.location.pathname.includes("/event/")) {
      Logger.log("Event URL detected:", window.location.pathname);
      saveEventUrlInCookie(window.location.pathname);
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Logger.log("Auth", currentUser);
        const userDocRef = doc(db, "users", currentUser.uid);
        const userSnapshot = await getDoc(userDocRef);

        if (!userSnapshot.exists()) {
          // User document does not exist - it's a new user
          await setDoc(userDocRef, {
            phoneNumber: currentUser.phoneNumber,
            isAdmin: false,
            // add other relevant user details
          });
          Logger.log("New user document created.");
        }
        else {
          setIsAdmin(userSnapshot.data().isAdmin);
        }
        localStorage.setItem("currentUser", JSON.stringify(currentUser));
        setUser(currentUser);
      } else {
        // when the user is signed out
        // Logger.log('user logged out')
        localStorage.removeItem("currentUser");
        setIsAdmin(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  function recaptchaVerify(phone) {
    try {
      const recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {}
      );
      recaptchaVerifier.render();

      // Perform phone number verification
      return signInWithPhoneNumber(auth, phone, recaptchaVerifier);
    } catch (error) {
      Logger.error("Error in recaptchaVerify:", error);
      throw error; // Propagate the error so you can handle it in the calling code
    }
  }

  function verifyCode(verificationCode) {
    try {
      // Implement your verification logic using Firebase's signInWithPhoneNumber and verificationCode
    } catch (error) {
      Logger.error("Error verifying code:", error);
    }
  }

  function logOut() {
    try {
      // Implement your sign-out logic using Firebase's signOut
      localStorage.removeItem("currentUser");
      return signOut(auth);
    } catch (error) {
      Logger.error("Error signing out:", error);
    }
  }

  const value = {
    user,
    isAdmin,
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
