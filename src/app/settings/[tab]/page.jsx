"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "@/styles/ai/settings/Settings.module.css";
import General from "@/components/settings/general/General";
import Billing from "@/components/settings/billing/Billing";
import Profile from "@/components/settings/profile/Profile";
import Data from "@/components/settings/data/Data";
import Activity from "@/components/settings/activity/Activity";
import Updates from "@/components/settings/updates/Updates";

const Settings = () => {
  const router = useRouter();
  const { tab } = useParams(); // Capture the 'tab' from the URL
  const [activeTab, setActiveTab] = useState(tab || "general"); // Default to 'general' tab

  // Update URL when a tab is clicked
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    router.push(`/settings/${newTab}`); // Update the URL dynamically
  };

  // Sync activeTab with URL changes
  useEffect(() => {
    if (tab) {
      setActiveTab(tab);
    } else {
      setActiveTab("general"); // Fallback to 'general' if no tab is present in the URL
    }
  }, [tab]);

  return (
    <div className={styles.aiSettings}>
      <div className={styles.aiSettingsContainer}>
        {/* Dashboard Navigation */}
        <div className={styles.aiSettingsDashboard}>
          {[
            // 'general',
            "profile",
            // 'data',
            // 'billing',
            // 'activity', 'updates'
          ].map((item) => (
            <div
              key={item}
              className={`${
                styles[
                  `aiSettingsDashboard${
                    item.charAt(0).toUpperCase() + item.slice(1)
                  }`
                ]
              } ${activeTab === item ? styles.active : ""}`}
              onClick={() => handleTabChange(item)}
            >
              {item.charAt(0).toUpperCase() + item.slice(1)} {/* Capitalize */}
            </div>
          ))}
        </div>

        {/* Display Content Based on Active Tab */}
        <div className={styles.aiSettingsContents}>
          {/* {activeTab === 'general' && <General />} */}
          {activeTab === "profile" && <Profile />}
          {/* {activeTab === 'data' && <Data />}
      {activeTab === 'billing' && <Billing />} */}
          {/* {activeTab === 'activity' && <Activity />}
      {activeTab === 'updates' && <Updates />} */}

          {/* Add more tabs as needed */}
        </div>
      </div>
    </div>
  );
};

export default Settings;
