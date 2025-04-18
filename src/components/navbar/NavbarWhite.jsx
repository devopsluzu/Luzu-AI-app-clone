"use client";

import React, { useState, useEffect, useRef } from "react";
import styles from "@/styles/navbar/Navbar.module.css";
import Image from "next/image";
import whiteLogo from "@/public/navbar/logo-white.png";
import blackLogo from "@/public/navbar/logo-black.png";
import { useTheme } from "next-themes";

import Hamburger from "@/public/navbar/hamburger.png";
import Close from "@/public/navbar/close.png";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { CgProfile } from "react-icons/cg";
import { RiMenu4Fill } from "react-icons/ri";
import AiDashboard from "@/components/global/Dashboard";
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs";

export const NavbarWhite = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const [themeClick, setThemeClick] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const menuRef = useRef(null);
  const settingsRef = useRef(null);
  const { theme, systemTheme } = useTheme();
  const dashboardRef = useRef(null);

  useEffect(() => {
    setMenuOpen(false);
    setHover(false);
    setThemeClick(false);
  }, [pathname]);

  const handleMenuClick = () => setMenuOpen(!menuOpen);
  const handleDropDown = () => setHover(!hover);
  const handleThemeClick = () => setThemeClick(!themeClick);

  const handleNavigation = (path) => {
    setMenuOpen(false);
    setHover(false);
    setThemeClick(false);
    router.push(path);
  };

  const handleMenuOpen = () => {
    setMenuOpen(!menuOpen);
  };

  const currentTheme = theme === "system" ? systemTheme : theme;
  const Logo = currentTheme === "dark" ? whiteLogo : blackLogo;

  // const Logo = theme === "dark" ? whiteLogo : blackLogo;

  return (
    <div className={styles.navbar}>
      <div className={styles.navbarContainer}>
        <div
          className={styles.navbarLogo}
          onClick={() => handleNavigation("/")}
        >
          <Image
            className={styles.luzuLogo}
            src={Logo}
            alt="Logo"
            height={20}
          />
        </div>

        <div className={styles.navbarContents}>
          <Link href="https://business.luzu.ai/">Services</Link>
          <Link href="https://blog.luzu.ai/">Resources</Link>
          {/* <Link href="/pricing">Pricing</Link> */}

          <div className={styles.navbarContentsImage} onClick={handleDropDown}>
            {/* <Image src={profile} width={16} height={16} alt="profile" /><Image src={drop} width={12} alt="dropdown" /> */}
            <CgProfile
              style={{
                color: "var(--dashboard-h-color)",
                width: "22px",
                height: "22px",
              }}
            />
          </div>

          {hover && (
            <div className={styles.navbarProfileDropdown} ref={menuRef}>
              <Link className={styles.settings} href="/settings/profile">
                Settings
              </Link>
              <LogoutLink postLogoutRedirectURL="https://app.luzu.ai">
                Logout
              </LogoutLink>
            </div>
          )}
        </div>

        <div className={styles.navbarMenuIcons}>
          {!menuOpen && (
            <Image src={Hamburger} alt="Menu" onClick={handleMenuClick} />
          )}
          {menuOpen && (
            <Image src={Close} alt="Close" onClick={handleMenuClick} />
          )}
        </div>

        {menuOpen && (
          <div ref={menuRef} className={styles.navbarMenu}>
            <p>Tools</p>
            <Link href="/">Content Generation</Link>
            <Link href="/keyword">Keyword Research</Link>
            <Link href="/competitor">Competitor Analysis</Link>

            <div className={styles.navbarMenuContents}>
              <div
                className={styles.settings}
                onClick={() => handleNavigation("/settings/profile")}
              >
                Settings
              </div>
              <LogoutLink postLogoutRedirectURL="https://app.luzu.ai">
                Logout
              </LogoutLink>
            </div>
          </div>
        )}
      </div>

      <div className={styles.luzuChatDashboardHamburger}>
        <RiMenu4Fill
          className={styles.luzuChatDashboardMenuIcon}
          onClick={handleMenuOpen}
          style={{ color: "var(--p-color)", width: "24px", height: "24px" }}
        />
        <Link href="/settings/profile">
          <CgProfile
            style={{
              color: "var(--dashboard-h-color)",
              width: "22px",
              height: "22px",
            }}
          />
        </Link>

        {menuOpen && (
          <div className={styles.luzuChatDashboardMobile} ref={dashboardRef}>
            <AiDashboard menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
          </div>
        )}
      </div>
    </div>
  );
};
