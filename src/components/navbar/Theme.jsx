import React from "react";
import Image from "next/image";
import system from "@/public/ai/settings/system.svg";
import light from "@/public/ai/settings/light.svg";
import dark from "@/public/ai/settings/dark.svg";

const Theme = () => {
  const handleThemeSelection = (theme) => {
    console.log(`Theme selected: ${theme}`);
  };

  return (
    <>
      <style jsx>{`
        .theme-change-contents {
          position: absolute;
          top: 0px;
          right: 136px;
          padding: 8px 6px;
          border: 1px solid var(--box-border);
          border-radius: 6px;
          background-color: var(--luzu-white);
          display: flex;
          flex-direction: column;
          z-index: 1;
        }

        .theme-change-contents .system,
        .theme-change-contents .light,
        .theme-change-contents .dark {
          font-size: 12px;
          font-family: var(--p-font);
          color: #4a4a4a;
          font-weight: 400;
          padding: 6px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .theme-change-contents .system:hover,
        .theme-change-contents .light:hover,
        .theme-change-contents .dark:hover {
          background-color: #f8f8f8;
        }
      `}</style>

      <div className="theme-change-contents">
        <div className="system" onClick={() => handleThemeSelection("System")}>
          <Image src={system} width={16} height={16} alt="system" />
          System
        </div>
        <div className="light" onClick={() => handleThemeSelection("Light")}>
          <Image src={light} width={16} height={16} alt="light mode" />
          Light
        </div>
        <div className="dark" onClick={() => handleThemeSelection("Dark")}>
          <Image src={dark} width={16} height={16} alt="dark mode" />
          Dark
        </div>
      </div>
    </>
  );
};

export default Theme;
