"use client";
import React, { createContext, useState, useEffect } from "react";
import { ref, set, get } from "firebase/database";
import { database } from "@/firebase";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";

const ChatPromptContext = createContext();

const getNextMinute = () => {
  const now = Date.now();
  // return now + 60 * 1000; // Add 1 minute in milliseconds
  return now + 24 * 60 * 60 * 1000;
};
export const ChatPromptProvider = ({ children }) => {
  const [chatPromptCount, setChatPromptCount] = useState(0);
  const [chatresetTime, setChatResetTime] = useState(null);
  const { user } = useKindeBrowserClient();

  useEffect(() => {
    const initializeData = async () => {
      if (user?.id) {
        const userRef = ref(database, `ChatPromptCount/${user.id}`);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
          const data = snapshot.val();
          setChatPromptCount(data.chatPromptCount || 0);
          setChatResetTime(data.chatresetTime || getNextMinute());
        } else {
          const initialChatResetTime = getNextMinute();
          setChatResetTime(initialChatResetTime);
          await set(userRef, {
            chatPromptCount: 0,
            chatresetTime: initialChatResetTime,
            userId: user.id,
            email: user.email,
          });
        }
      }
    };

    initializeData();
  }, [user]);

  useEffect(() => {
    const checkChatResetTime = () => {
      if (chatresetTime && Date.now() >= chatresetTime) {
        const nextReset = getNextMinute();
        setChatPromptCount(0);
        setChatResetTime(nextReset);

        if (user?.id) {
          const userRef = ref(database, `ChatPromptCount/${user.id}`);
          set(userRef, {
            chatPromptCount: 0,
            chatresetTime: nextReset,
            userId: user.id,
            email: user.email,
          });
        }
      }
    };

    const interval = setInterval(checkChatResetTime, 1000);

    return () => clearInterval(interval);
  }, [chatresetTime, user]);

  useEffect(() => {
    if (user?.id) {
      const userRef = ref(database, `ChatPromptCount/${user.id}`);
      set(userRef, {
        chatPromptCount,
        chatresetTime,
        userId: user.id,
        email: user.email,
      });
    }
  }, [chatPromptCount, chatresetTime, user]);

  return (
    <ChatPromptContext.Provider value={{ chatPromptCount, setChatPromptCount }}>
      {children}
    </ChatPromptContext.Provider>
  );
};
export const useChatPrompt = () => React.useContext(ChatPromptContext);
