"use client";
import { useState, useEffect } from "react";
import { getDatabase, ref, get } from "firebase/database";
import { RiCloseFill } from "react-icons/ri";
import Link from "next/link";
import styles from "@/styles/ai/ContentAi.module.css";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";

export default function ChatInput({
  input,
  setInput,
  handleSendMessage,
  buttonHl,
  setButtonHl,
  // promptCount, setPromptCount,
  isTyping,
}) {
  const [planType, setPlanType] = useState(null);
  const [planCount, setPlanCount] = useState(3);
  const [popupOpen, setPopupOpen] = useState(false);

  const { user } = useKindeBrowserClient();
  const userId = user?.id;
  const database = getDatabase();

  useEffect(() => {
    if (!userId) return;

    const fetchPlanType = async () => {
      try {
        const planRef = ref(database, `/subscriptions/${userId}/planType`);
        const snapshot = await get(planRef);
        if (snapshot.exists()) {
          setPlanType(snapshot.val());
        }
      } catch (error) {
        console.error("Error fetching planType:", error);
      }
    };

    fetchPlanType();
  }, [userId, database]);

  // useEffect(() => {
  //   if (planType === 'starter') {
  //     setPlanCount(50);
  //   } else if (planType === 'pro') {
  //     setPlanCount(150);
  //   } else {
  //     setPlanCount(3);
  //   }
  // }, [planType]);

  const handleInputChange = (event) => {
    setInput(event.target.value);
    setButtonHl(event.target.value.trim() !== "");
  };

  // const promptLeft = planCount - promptCount;

  // useEffect(() => {
  //   if (promptLeft === 0) {
  //     setPopupOpen(true);
  //   }
  // }, [promptLeft]);

  return (
    <div className={styles.chatInput}>
      {popupOpen && (
        <div className={styles.chatInputUpgrade}>
          <div className={styles.chatInputUpgradeContainer}>
            <p>
              There are currently no prompts left. Prompts will reset after 24
              hours.
            </p>
            <Link href="/pricing">
              <button>Upgrade</button>
            </Link>
            <RiCloseFill
              className={styles.chatInputUpgradeClose}
              onClick={() => setPopupOpen(false)}
              style={{ color: "var(--p-color)" }}
            />
          </div>
        </div>
      )}

      <div className={styles.chatInputContainer}>
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          placeholder="Type your message..."
        />
        <div
          className={`${styles.chatInputGenerateButton} ${
            isTyping ? styles.loading : ""
          }`}
          style={{
            backgroundColor: buttonHl
              ? "var(--black-white)"
              : "var(--black-white)",
            height: "100%",
          }}
          onClick={handleSendMessage}
        >
          <p>Generate</p>
        </div>
      </div>
    </div>
  );
}
