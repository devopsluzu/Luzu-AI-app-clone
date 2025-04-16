"use client";
import React, { createContext, useState, useEffect } from "react";
import { ref, set, get } from "firebase/database";
import { database } from "@/firebase";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";

const PromptContext = createContext();

const getNextMinute = () => {
  const now = Date.now();
  // return now + 60 * 1000; // Add 1 minute in milliseconds
  return now + 24 * 60 * 60 * 1000;
};

export const PromptProvider = ({ children }) => {
  const [promptCount, setPromptCount] = useState(0);
  const [resetTime, setResetTime] = useState(null);
  const { user } = useKindeBrowserClient();

  useEffect(() => {
    const initializeData = async () => {
      if (user?.id) {
        const userRef = ref(database, `contentPromptCount/${user.id}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          setPromptCount(data.promptCount || 0);
          setResetTime(data.resetTime || getNextMinute());
        } else {
          const initialResetTime = getNextMinute();
          setResetTime(initialResetTime);
          await set(userRef, {
            promptCount: 0,
            resetTime: initialResetTime,
            userId: user.id,
            email: user.email,
          });
        }
      }
    };

    initializeData();
  }, [user]);

  useEffect(() => {
    const checkResetTime = () => {
      if (resetTime && Date.now() >= resetTime) {
        // Reset promptCount if current time >= resetTime
        setPromptCount(0);
        const nextReset = getNextMinute();
        setResetTime(nextReset);
        if (user?.id) {
          const userRef = ref(database, `contentPromptCount/${user.id}`);
          set(userRef, {
            promptCount: 0,
            resetTime: nextReset,
            userId: user.id,
            email: user.email,
          });
        }
      }
    };

    const interval = setInterval(checkResetTime, 1000); // Check every second

    return () => clearInterval(interval); // Clean up on component unmount
  }, [resetTime, user]);

  useEffect(() => {
    if (user?.id) {
      const userRef = ref(database, `contentPromptCount/${user.id}`);
      set(userRef, {
        promptCount,
        resetTime,
        userId: user.id,
        email: user.email,
      });
    }
  }, [promptCount, resetTime, user]);

  return (
    <PromptContext.Provider value={{ promptCount, setPromptCount }}>
      {children}
    </PromptContext.Provider>
  );
};

export const usePrompt = () => React.useContext(PromptContext);
