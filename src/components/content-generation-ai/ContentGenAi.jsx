"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { usePrompt } from "@/context/prompt-context";
import styles from "@/styles/ai/ContentAi.module.css";
import AiDashboard from "@/components/global/Dashboard";
import ChatInput from "@/components/global/ChatInput";
import ChatActionButtons from "@/components/global/ChatActionButtons";
import LoadingSkeleton from "@/components/global/LoadingSkeleton";
import { Marked } from "marked";
import html2pdf from "html2pdf.js";
import { getDatabase, ref, set, get } from "firebase/database";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";

export default function PuterChat({ currentPath, contentId }) {
  const { promptCount, setPromptCount } = usePrompt();
  const markdown = new Marked();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [lastInput, setLastInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [buttonHl, setButtonHl] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [copyHover, setCopyHover] = useState(false);
  const [formattedTitle, setFormattedTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [formattedContent, setFormattedContent] = useState("");
  const [category, setCategory] = useState("");
  const [keyword, setKeyword] = useState("");
  const [categoryBadges, setCategoryBadges] = useState([]); // State for category badges
  const [keywordBadges, setKeywordBadges] = useState([]);
  const [isDashboardActive, setIsDashboardActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const dashboardRef = useRef(null); // Create a ref for the dashboard
  const router = useRouter();
  const chatContainerRef = useRef(null);
  const { user } = useKindeBrowserClient();

  const fetchChatData = useCallback(async () => {
    if (!contentId || !user) return;
    const db = getDatabase();
    const chatRef = ref(
      db,
      `content-generation-prompts/${user.id}/${contentId}/messages`
    );
    const snapshot = await get(chatRef);
    if (snapshot.exists()) {
      let chatData = Object.values(snapshot.val()).sort(
        (a, b) => a.timestamp - b.timestamp
      );
      setMessages(chatData);
    }
    // else {
    //   console.log('No messages found in chatData');
    // }
  }, [contentId, user]);

  useEffect(() => {
    fetchChatData();
  }, [fetchChatData]);

  useEffect(() => {
    if (contentId) {
      router.push(`/content-generation/${contentId}`);
    }
  }, [contentId, router]);

  useEffect(() => {
    if (isDashboardActive) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDashboardActive]);

  // useEffect(() => {
  //   const latestAIMessage = messages.find((msg) => msg.sender === 'AI');
  //   if (latestAIMessage) {
  //     const formattedHtml = markdown.parse(latestAIMessage.text);
  //     parseContent(formattedHtml);
  //   }
  // }, [messages]);
  useEffect(() => {
    const latestAIMessage = messages.find((msg) => msg.sender === "AI");
    if (latestAIMessage && latestAIMessage.text) {
      // Ensure text exists before parsing
      const formattedHtml = markdown.parse(latestAIMessage.text);
      parseContent(formattedHtml);
    }
  }, [messages]);

  const parseContent = (content) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = content;
    setFormattedTitle(tempDiv.querySelector("h1, h2, h3")?.innerHTML || "");
    setMetaDescription(tempDiv.querySelector("p")?.innerHTML || "");
    tempDiv.querySelector("h1, h2, h3")?.remove();
    tempDiv.querySelector("p")?.remove();
    setFormattedContent(tempDiv.innerHTML);
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    setLoading(true);

    try {
      const userId = user.id;
      const db = getDatabase();
      const chatId = uuidv4();

      const prefixedInput = input.trim().startsWith("blog about")
        ? input.trim()
        : `blog about ${input.trim()}`;

      const userMessage = {
        id: uuidv4(),
        sender: "You",
        text: prefixedInput,
        timestamp: Date.now(),
      };

      setMessages([userMessage]); // Start fresh chat with new message
      setInput("");
      setIsTyping(true);

      // Store user message in Firebase
      const chatRef = ref(
        db,
        `content-generation-prompts/${userId}/${chatId}/messages`
      );
      await set(chatRef, { [userMessage.id]: userMessage });

      // Call API to get AI response
      const response = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prefixedInput }),
      });

      const data = await response.json();

      if (response.ok && data.response) {
        const botMessage = {
          id: uuidv4(),
          sender: "AI",
          text: data.response,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, botMessage]);

        // Store AI response in Firebase
        await set(
          ref(
            db,
            `content-generation-prompts/${userId}/${chatId}/messages/${botMessage.id}`
          ),
          botMessage
        );
      } else {
        // If AI response is empty or invalid, remove the user's message
        setMessages([]);
      }

      // Redirect only if AI responded successfully
      if (data.response) {
        router.push(`/content-generation/${chatId}`);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages([]);
    } finally {
      setIsTyping(false);
      setLoading(false);
    }
  };

  function stripHtmlTags(html) {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  }

  const handleRefreshContent = async () => {
    if (!messages.length) return;

    let refreshedInput = messages
      .filter((msg) => msg.sender === "You") // Get user input only
      .map((msg) => msg.text)
      .join("\n\n");

    if (categoryBadges.length > 0) {
      refreshedInput += `\nCategories: ${categoryBadges.join(", ")}`;
    }

    if (keywordBadges.length > 0) {
      refreshedInput += `\nKeywords: ${keywordBadges.join(", ")}`;
    }

    setMessages((prev) => prev.filter((msg) => msg.sender !== "AI")); // Remove old AI message
    setFormattedTitle("");
    setMetaDescription("");
    setFormattedContent("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: refreshedInput }),
      });

      const data = await response.json();

      if (response.ok) {
        const botMessage = {
          id: messages.find((msg) => msg.sender === "AI")?.id || uuidv4(), // Keep same AI message ID
          sender: "AI",
          text: data.response,
          timestamp: Date.now(),
        };

        setMessages((prev) => [
          ...prev.filter((msg) => msg.sender !== "AI"),
          botMessage,
        ]);

        // ✅ Update AI response in Firebase under the same chat ID
        if (contentId && user) {
          const db = getDatabase();
          const chatRef = ref(
            db,
            `content-generation-prompts/${user.id}/${contentId}/messages/${botMessage.id}`
          );
          await set(chatRef, botMessage);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: uuidv4(),
            sender: "AI",
            text: data.error || "Something went wrong.",
          },
        ]);
      }
    } catch (error) {
      console.error("Error refreshing content:", error);
      setMessages((prev) => [
        ...prev,
        { id: uuidv4(), sender: "AI", text: "An unexpected error occurred." },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleRestructureClick = async (type) => {
    const sentence = type === "title" ? formattedTitle : metaDescription;
    const category = Array.isArray(categoryBadges)
      ? categoryBadges.join(", ")
      : "";
    const keyword = Array.isArray(keywordBadges)
      ? keywordBadges.join(", ")
      : "";

    try {
      const response = await fetch("/api/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sentence }),
      });

      const data = await response.json();

      if (response.ok) {
        const newSentence = data.regeneratedSentence;

        setMessages((prevMessages) => {
          const updatedMessages = [...prevMessages];
          const lastAiIndex = updatedMessages.findLastIndex(
            (msg) => msg.sender === "AI"
          );

          if (lastAiIndex !== -1) {
            const lastMessage = updatedMessages[lastAiIndex];
            let updatedText = lastMessage.text;

            if (type === "title") {
              updatedText = updatedText.replace(
                /^##\s*(.*?)\s*$/m,
                `## ${newSentence}`
              );
              setFormattedTitle(newSentence);
            } else if (type === "description") {
              const match = formattedTitle.match(
                /<h1 class="heading1">(.*?)<\/h1>/
              );
              let headingText = "";
              if (match) {
                headingText = `## ${match[1]}`; // Captures the content between the tags
              }
              updatedText = updatedText.replace(
                /^([\s\S]*?)(?=\s*\*\*|\n\*\*|$)/,
                `${headingText}\n${newSentence}`
              );

              setMetaDescription(newSentence);
            }
            updatedMessages[lastAiIndex] = {
              ...lastMessage,
              text: updatedText,
            };
          }

          return updatedMessages;
        });
      } else {
        console.error("Error refreshing:", data.error);
      }
    } catch (error) {
      console.error("Error refreshing:", error);
    }
  };
  const handleCopyChat = () => {
    const chatContent = chatContainerRef.current?.innerText;
    if (chatContent) {
      navigator.clipboard
        .writeText(chatContent)
        .then(() => setIsCopied(true))
        .catch((err) => console.error("Failed to copy: ", err));
    }

    setCopyHover(false);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadChat = () => {
    const chatContents = document.querySelector(".chat-contents");
    if (!chatContents) return;

    const cleanedTitle = formattedTitle
      ? stripHtmlTags(formattedTitle)
      : "chat-contents";
    const fileName = `${cleanedTitle}.pdf`;

    html2pdf()
      .set({
        margin: 10,
        filename: fileName,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 }, // Higher scale for better resolution
        jsPDF: { format: "a4", orientation: "portrait" },
      })
      .from(chatContents)
      .save();
  };
  const handleFilterButtonClick = () => {
    setIsDashboardActive((prevState) => !prevState);
  };
  const handleClickOutside = (event) => {
    if (dashboardRef.current && !dashboardRef.current.contains(event.target)) {
      setIsDashboardActive(false);
    }
  };
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
        document.querySelector(".luzu-ai").style.height = `${viewportHeight}px`;
      } else {
        document.querySelector(".luzu-ai").style.height = "auto";
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
    <>
      <div className={`${styles.luzuAi} luzu-ai`}>
        <div className={styles.luzuAiContainer}>
          {/* <AiDashboard currentPath={currentPath} /> */}
          {isDesktop && <AiDashboard />}

          <div className={styles.contentGenSpace}>
            <div
              className={`${styles.chatSpace} ${
                !messages.some((msg) => msg.sender === "AI") && !isTyping
                  ? styles.centerContent
                  : ""
              }`}
            >
              {!messages.some((msg) => msg.sender === "AI") && !isTyping && (
                <h2 className={styles.emptyStateTitle}>
                  Generate SEO Ready Blogs
                </h2>
              )}
              <div className={styles.chatContainer} ref={chatContainerRef}>
                <div className={`${styles.chatContents} chat-contents}`}>
                  {messages
                    .filter((msg) => msg.sender === "You") // Only user messages
                    .map((msg, index) => {
                      let cleanedText = msg.text.replace(/^blog about\s+/i, "");
                      return (
                        <div key={index} className={styles.userMessage}>
                          <div
                            dangerouslySetInnerHTML={{
                              __html: markdown.parse(cleanedText),
                            }}
                            className={styles.userMessageText}
                          />
                        </div>
                      );
                    })}

                  {messages
                    .filter((msg) => msg.sender === "AI")
                    .map((msg, index) => (
                      <div key={index} className={styles.aiMessage}>
                        {formattedTitle && (
                          <h1
                            className={styles.heading1}
                            dangerouslySetInnerHTML={{ __html: formattedTitle }}
                          />
                        )}
                        {metaDescription && (
                          <p
                            className={styles.metaDescription}
                            dangerouslySetInnerHTML={{
                              __html: metaDescription,
                            }}
                          />
                        )}
                        {formattedContent && (
                          <div
                            className={styles.content}
                            dangerouslySetInnerHTML={{
                              __html: formattedContent,
                            }}
                          />
                        )}
                      </div>
                    ))}

                  {isTyping && <LoadingSkeleton />}
                </div>
              </div>
              <ChatActionButtons
                isCopied={isCopied}
                setIsCopied={setIsCopied}
                handleCopyChat={handleCopyChat}
                copyHover={copyHover}
                setCopyHover={setCopyHover}
                handleRefreshContent={handleRefreshContent}
                formattedContent={formattedContent}
                formattedTitle={formattedTitle}
                handleDownloadChat={handleDownloadChat}
                handleFilterButtonClick={handleFilterButtonClick}
                setIsDashboardActive={setIsDashboardActive}
              />
            </div>

            <ChatInput
              input={input}
              setInput={setInput}
              handleSendMessage={handleSendMessage}
              buttonHl={buttonHl}
              setButtonHl={setButtonHl}
              isTyping={isTyping}
            />
          </div>
        </div>
      </div>
    </>
  );
}
