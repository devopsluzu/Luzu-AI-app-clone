"use client";
import React, { useState, useEffect } from "react";
import Chatbot from "./ChatAi";
import AiDashboard from "@/components/global/Dashboard";
import styles from "@/styles/prfec-chat-ai/GeneralChat.module.css";
const PrfecAi = ({ chatId }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 800);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth > 800);
      if (window.innerWidth > 800) {
        setMenuOpen(false); // Ensure menu closes when resizing to desktop mode
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initialize state on mount

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const adjustHeight = () => {
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      if (viewportWidth <= 600) {
        document.querySelector(
          ".luzuAiComponent"
        ).style.height = `${viewportHeight}px`;
      } else {
        document.querySelector(".luzuAiComponent").style.height = "auto";
      }
    };

    adjustHeight();
    window.addEventListener("resize", adjustHeight);

    return () => window.removeEventListener("resize", adjustHeight);
  }, []);

  const handleMenuOpen = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <div className={styles.luzuAi}>
      <div className={`${styles.luzuAiComponent} luzuAiComponent`}>
        {isDesktop && <AiDashboard />}

        <Chatbot chatId={chatId} />
      </div>
    </div>
  );
};

export default PrfecAi;
