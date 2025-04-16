"use client";
import React, { useState } from "react";
import styles from "@/styles/ai/settings/Settings.module.css";
import Image from "next/image";
import drop from "@/public/ai/settings/drop.svg";
import system from "@/public/ai/settings/system.svg";
import light from "@/public/ai/settings/light.svg";
import dark from "@/public/ai/settings/dark.svg";
import key from "@/public/ai/settings/key.svg";

const General = () => {
  const [themeClick, setThemeClick] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState("System"); // Default theme

  const handleThemeChangeClick = () => {
    setThemeClick(!themeClick);
  };

  const handleThemeSelection = (theme) => {
    setSelectedTheme(theme); // Update selected theme
    setThemeClick(false); // Close dropdown after selection
  };

  return (
    <div className={styles.settingsGeneralContents}>
      <div className={styles.settingsGeneralTheme}>
        <p>Theme</p>
        <div className={styles.themeChange} onClick={handleThemeChangeClick}>
          {selectedTheme} {/* Display selected theme */}
          <Image src={drop} width={16} height={16} alt="dropdown icon" />
          {themeClick && (
            <div className={styles.themeChangeContents}>
              <div
                className={styles.system}
                onClick={() => handleThemeSelection("System")}
              >
                <Image src={system} width={16} height={16} alt="system" />
                System
              </div>
              <div
                className={styles.light}
                onClick={() => handleThemeSelection("Light")}
              >
                <Image src={light} width={16} height={16} alt="light mode" />
                Light
              </div>
              <div
                className={styles.dark}
                onClick={() => handleThemeSelection("Dark")}
              >
                <Image src={dark} width={16} height={16} alt="dark mode" />
                Dark
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.settingsGeneralLanguage}>
        <p>Language</p>
        <div className={styles.languageChange}>
          English
          <Image src={drop} width={16} height={16} alt="dropdown" />
        </div>
      </div>

      <div className={styles.settingsGeneralSharedLinks}>
        <p>Shared links</p>
        <div className={styles.sharedLinks}>Manage</div>
      </div>

      <div className={styles.settingsGeneralApi}>
        <p>API access</p>
        <div className={styles.apiAccess}>
          <Image src={key} width={16} height={16} alt="api key" />
          Get API key
        </div>
      </div>
    </div>
  );
};

export default General;
