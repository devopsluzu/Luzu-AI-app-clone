"use client";
import { PiChatCircleDotsLight } from "react-icons/pi";
import { IoSettingsOutline } from "react-icons/io5";
import styles from "@/styles/ai/Dashboard.module.css";
import { usePathname } from "next/navigation";
import { getDatabase, ref, get, onValue, off } from "firebase/database";
import { useEffect, useState, useRef } from "react";
import { useTheme } from "next-themes";
import whiteLogo from "@/public/navbar/logo-white.png";
import blackLogo from "@/public/navbar/logo-black.png";
import {
  LogoutLink,
  useKindeBrowserClient,
} from "@kinde-oss/kinde-auth-nextjs";
import Link from "next/link";
import Image from "next/image";
const INITIAL_VISIBLE_CHATS = 5;

const AiDashboard = ({ menuOpen, setMenuOpen }) => {
  const pathname = usePathname();
  const { user } = useKindeBrowserClient();
  const [recentPrompts, setRecentPrompts] = useState([]);
  const [recentKeywords, setRecentKeywords] = useState([]);
  const [recentCompetitor, setRecentCompetitor] = useState([]);
  const [allRecentSearches, setAllRecentSearches] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [visibleChats, setVisibleChats] = useState(INITIAL_VISIBLE_CHATS);
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [planType, setPlanType] = useState(null);
  const [planCount, setPlanCount] = useState(3);
  const [promptCount, setPromptCount] = useState();
  const [visiblePrompts, setVisiblePrompts] = useState(INITIAL_VISIBLE_CHATS);
  const [visibleKeywords, setVisibleKeywords] = useState(INITIAL_VISIBLE_CHATS);
  const [visibleCompetitor, setVisibleCompetitor] = useState(
    INITIAL_VISIBLE_CHATS
  );
  const [visibleSearches, setVisibleSearches] = useState(INITIAL_VISIBLE_CHATS);
  const [openSetting, setOpenSetting] = useState(false);
  const { theme, setTheme, systemTheme } = useTheme();
  const [dashboardHeight, setDashboardHeight] = useState(null);
  const currentChatId = pathname.split("/").pop();
  const dashboardRef = useRef(null);

  useEffect(() => {
    //for full height of the dashboard
    const updateHeight = () => {
      if (window.innerWidth <= 800) {
        setDashboardHeight(window.innerHeight + "px");
      } else {
        setDashboardHeight(null); // Reset when above 800px
      }
    };

    updateHeight(); // Set initial height
    window.addEventListener("resize", updateHeight);

    return () => {
      window.removeEventListener("resize", updateHeight);
    };
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = ""; // Cleanup on unmount
    };
  }, [menuOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only run if menu is open and we have a dashboard reference
      if (menuOpen && dashboardRef.current) {
        // Check if click target is outside the dashboard
        if (!dashboardRef.current.contains(event.target)) {
          // Click is outside, close the menu
          setMenuOpen(false);
        }
      }
    };

    // Add event listener with capture phase to handle it before other listeners
    document.addEventListener("mousedown", handleClickOutside, true);

    // Cleanup event listener on unmount
    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
    };
  }, [menuOpen, setMenuOpen]);

  useEffect(() => {
    const fetchPrompts = async () => {
      if (!user) return;

      const db = getDatabase();
      const userId = user.id;

      // If URL starts with /content-generation, fetch content-generation-prompts
      if (pathname.startsWith("/content-generation")) {
        try {
          const promptsRef = ref(db, `content-generation-prompts/${userId}/`);
          const snapshot = await get(promptsRef);

          if (snapshot.exists()) {
            const data = snapshot.val();
            const userPrompts = [];

            Object.keys(data).forEach((chatId) => {
              const messages = data[chatId].messages;

              if (messages) {
                // Get only messages sent by the user
                const userMessage = Object.values(messages).find(
                  (msg) => msg.sender === "You"
                );

                if (userMessage) {
                  userPrompts.push({
                    chatId,
                    message: userMessage.text, // Store only user-sent messages
                  });
                }
              }
            });

            setRecentPrompts(userPrompts);
          }
        } catch (error) {
          console.error("Error fetching user messages:", error);
        }
      }

      if (pathname.startsWith("/keyword")) {
        try {
          const keywordsRef = ref(db, `keyword-research-prompts/${userId}/`);
          const snapshot = await get(keywordsRef);

          if (snapshot.exists()) {
            const data = snapshot.val();
            const keywordsList = [];

            Object.keys(data).forEach((keywordId) => {
              const { id, country, timestamp } = data[keywordId]; // Extract data

              if (id) {
                keywordsList.push({
                  keywordId,
                  id,
                  country,
                  timestamp,
                });
              }
            });
            setRecentKeywords(keywordsList);
          }
        } catch (error) {
          console.error("Error fetching keyword data:", error);
        }
      }
    };

    fetchPrompts();
  }, [pathname, user]);

  useEffect(() => {
    if (user && user.email) {
      setUserEmail(user.email);
    } else {
      setUserEmail("");
    }

    if (!user) {
      setLoading(false);
      return;
    }

    const database = getDatabase();
    const chatRef = ref(database, `chats/${user.id}`);

    onValue(
      chatRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const chatData = snapshot.val();
          const chatsArray = Object.entries(chatData).map(([id, chat]) => ({
            id,
            title: chat.title || "Untitled Chat",
            lastUpdated: chat.lastUpdated || 0,
          }));

          chatsArray.sort((a, b) => b.lastUpdated - a.lastUpdated);
          setRecentChats(chatsArray);
        } else {
          setRecentChats([]);
        }
        setLoading(false);
      },
      (error) => {
        setError("Failed to load chats");
        setLoading(false);
      }
    );
  }, []);
  useEffect(() => {
    const fetchCompetitorData = async () => {
      if (!user) return; // Ensure user is available before fetching

      const db = getDatabase();
      const userId = user.id;
      const competitorRef = ref(db, `competitor-analysis-prompts/${userId}/`);

      try {
        const snapshot = await get(competitorRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          const competitorList = Object.keys(data).map((competitorId) => ({
            competitorId,
            id: data[competitorId].id,
            timestamp: data[competitorId].timestamp,
          }));

          setRecentCompetitor(competitorList); // ✅ Update state properly
        } else {
          setRecentCompetitor([]); // ✅ Clear if no data
        }
      } catch (error) {
        console.error("Error fetching competitor data:", error);
      }
    };

    fetchCompetitorData(); // ✅ Call the function inside useEffect
  }, [pathname, user]); // ✅ Dependency array

  useEffect(() => {
    if (!user) return;
    const db = getDatabase();
    const userId = user.id;
    let promptPath = null;
    let promptKey = "promptCount"; // Default key

    if (pathname.startsWith("/content-generation")) {
      promptPath = `/contentPromptCount/${userId}`;
      promptKey = "promptCount";
    } else if (pathname.startsWith("/keyword")) {
      promptPath = `/keywordPromptCount/${userId}`;
      promptKey = "keywordPromptCount";
    } else if (pathname.startsWith("/competitor")) {
      promptPath = `/competitorPromptCount/${userId}`;
      promptKey = "competitorPromptCount";
    } else if (pathname === "/" || pathname.startsWith("/chat")) {
      promptPath = `/ChatPromptCount/${userId}`;
      promptKey = "chatPromptCount";
    }

    if (!promptPath) return;

    const promptRef = ref(db, promptPath);
    onValue(
      promptRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setPromptCount(data[promptKey] ?? 0); // Dynamically select the correct key
        } else {
          setPromptCount(0);
        }
      },
      (error) => {
        console.error("Error fetching prompt count:", error);
        setPromptCount(0);
      }
    );

    return () => off(promptRef); // Clean up listener when component unmounts
  }, [pathname, user]);

  useEffect(() => {
    if (planType === "starter") {
      setPlanCount(50);
    } else if (planType === "pro") {
      setPlanCount(150);
    } else {
      setPlanCount(3); // Default value
    }
  }, [planType]);

  const toggleTheme = () => {
    const currentTheme = theme === "system" ? systemTheme : theme;
    setTheme(currentTheme === "dark" ? "light" : "dark");
  };
  const currentTheme = theme === "system" ? systemTheme : theme;
  const Logo = currentTheme === "dark" ? whiteLogo : blackLogo;

  // const Logo = theme === "dark" ? whiteLogo : blackLogo;
  const promptLeft = planCount - promptCount;

  return (
    <div
      className={styles.aiLeftDashboard}
      ref={dashboardRef}
      style={dashboardHeight ? { height: dashboardHeight } : {}}
    >
      <div className={styles.aiLeftDashboardContainer}>
        <Link href="/" className={styles.aiDashboardLogo}>
          <Image className={styles.aiLuzuLogo} src={Logo} alt="Logo" />
        </Link>

        <div className={styles.chatDashboardNewChat}>
          <Link href="/">
            <PiChatCircleDotsLight
              style={{ fontSize: "16px", color: "var(--p-color)" }}
            />
            New Chat
          </Link>
        </div>

        <div className={styles.aiLeftDashboardAgents}>
          <h2>Agents</h2>
          <Link
            href="/content-generation"
            className={`${styles.aiLeftDashboardContents} ${
              pathname.startsWith("/content-generation") ? styles.active : ""
            }`}
          >
            Content Generation
          </Link>
          <Link
            href="/keyword"
            className={`${styles.aiLeftDashboardContents} ${
              pathname.startsWith("/keyword") ? styles.active : ""
            }`}
          >
            Keyword Research
          </Link>
          <Link
            href="/competitor"
            className={`${styles.aiLeftDashboardContents} ${
              pathname.startsWith("/competitor") ? styles.active : ""
            }`}
          >
            Competitor Analysis
          </Link>
        </div>

        <div className={styles.chatDashboardRecents}>
          <h2>Recent Searches</h2>
          <div className={styles.chatDashboardRecentsContents}>
            {pathname.startsWith("/content-generation") &&
              recentPrompts.length > 0 && (
                <>
                  {recentPrompts.slice(0, visiblePrompts).map((prompt) => (
                    <Link
                      href={`/content-generation/${prompt.chatId}`}
                      key={prompt.chatId}
                      className={`${styles.contentGenerationRecentSearch} ${
                        pathname.startsWith(
                          `/content-generation/${prompt.chatId}`
                        )
                          ? styles.active
                          : ""
                      }`}
                    >
                      {prompt.message.replace(/^blog about\s*/i, "")}
                    </Link>
                  ))}
                  {visiblePrompts < recentPrompts.length && (
                    <div
                      className={styles.chatDashboardViewMoreBtn}
                      onClick={() =>
                        setVisiblePrompts(
                          (prev) => prev + INITIAL_VISIBLE_CHATS
                        )
                      }
                    >
                      View More
                    </div>
                  )}
                </>
              )}

            {pathname.startsWith("/keyword") && recentKeywords.length > 0 && (
              <>
                {recentKeywords.slice(0, visibleKeywords).map((keyword) => (
                  <Link
                    href={`/keyword/${keyword.keywordId}`}
                    key={keyword.keywordId}
                    className={`${styles.contentGenerationRecentSearch} ${
                      pathname.startsWith(`/keyword/${keyword.keywordId}`)
                        ? styles.active
                        : ""
                    }`}
                  >
                    {keyword.id}
                  </Link>
                ))}
                {visibleKeywords < recentKeywords.length && (
                  <div
                    className={styles.chatDashboardViewMoreBtn}
                    onClick={() =>
                      setVisibleKeywords((prev) => prev + INITIAL_VISIBLE_CHATS)
                    }
                  >
                    View More
                  </div>
                )}
              </>
            )}

            {pathname.startsWith("/competitor") &&
              recentCompetitor.length > 0 && (
                <>
                  {recentCompetitor
                    .slice(0, visibleCompetitor)
                    .map((competitor) => (
                      <Link
                        href={`/competitor/${competitor.competitorId}`}
                        key={competitor.competitorId}
                        className={`${styles.contentGenerationRecentSearch} ${
                          pathname.startsWith(
                            `/competitor/${competitor.competitorId}`
                          )
                            ? styles.active
                            : ""
                        }`}
                      >
                        {competitor.id.replace(/_/g, ".")}
                      </Link>
                    ))}
                  {visibleCompetitor < recentCompetitor.length && (
                    <div
                      className={styles.chatDashboardViewMoreBtn}
                      onClick={() =>
                        setVisibleCompetitor(
                          (prev) => prev + INITIAL_VISIBLE_CHATS
                        )
                      }
                    >
                      View More
                    </div>
                  )}
                </>
              )}

            {(pathname === "/" || pathname.startsWith("/chat")) &&
              recentChats.length > 0 && (
                <>
                  {recentChats.slice(0, visibleChats).map((chat) => (
                    <Link
                      key={chat.id}
                      href={`/chat/${chat.id}`}
                      className={chat.id === currentChatId ? styles.active : ""}
                    >
                      {chat.title}
                    </Link>
                  ))}
                  {visibleChats < recentChats.length && (
                    <div
                      className={styles.chatDashboardViewMoreBtn}
                      onClick={() =>
                        setVisibleChats((prev) => prev + INITIAL_VISIBLE_CHATS)
                      }
                    >
                      View More
                    </div>
                  )}
                </>
              )}
          </div>
        </div>

        <div className={styles.chatDashboardAccount}>
          {openSetting && (
            <div className={styles.chatDashboardSettings}>
              <div className={styles.chatDashboardSettingsContainer}>
                <div
                  className={styles.chatDashboardSettingsTheme}
                  onClick={toggleTheme}
                >
                  <p>Theme</p>
                  <div className={styles.settingsThemeIndicator}>
                    <span
                      className={`${styles.settingsThemeIndicatorLight} ${
                        currentTheme === "light" ? styles.active : ""
                      }`}
                    ></span>
                    <span
                      className={`${styles.settingsThemeIndicatorDark} ${
                        currentTheme === "dark" ? styles.active : ""
                      }`}
                    ></span>
                  </div>
                </div>
                <LogoutLink
                  postLogoutRedirectURL="https://app.luzu.ai/api/auth/register"
                  className={styles.chatDashboardSettingsLogout}
                >
                  Logout
                </LogoutLink>
              </div>
            </div>
          )}
          <div
            className={styles.chatDashboardAccountContainer}
            onClick={() => setOpenSetting(!openSetting)}
          >
            <div className={styles.chatDashboardAccountContents}>
              <div className={styles.chatDashboardAccountEmail}>Settings</div>
              <IoSettingsOutline
                style={{ fontSize: "16px", color: "var(--p-color)" }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiDashboard;
