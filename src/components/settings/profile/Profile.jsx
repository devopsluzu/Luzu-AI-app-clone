"use client";
import React, { useState, useRef, useEffect } from "react";
import styles from "@/styles/ai/settings/Profile.module.css";

import Image from "next/image";
import edit from "@/public/ai/settings/edit.svg";
import linkedin from "@/public/ai/settings/linkedin.svg";
import x from "@/public/ai/settings/x.svg";
import { ref, set, get, getDatabase } from "firebase/database";
import { database } from "@/firebase";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";

const Profile = () => {
  const [linkOpen, setLinkOpen] = useState({ linkedin: false, x: false });
  const [links, setLinks] = useState({ linkedin: "", x: "" });
  const [editingLinks, setEditingLinks] = useState({
    linkedin: false,
    x: false,
  }); // Track editing state
  const [editState, setEditState] = useState({ name: false, phone: false });
  const [profileData, setProfileData] = useState({ name: "", phone: "" });
  const [inputValue, setInputValue] = useState({ name: "", phone: "" });
  const linkedinRef = useRef(null);
  const xRef = useRef(null);
  const { user } = useKindeBrowserClient();
  console.log(user?.given_name + " " + user?.family_name);

  useEffect(() => {
    const fetchData = async () => {
      if (user?.id) {
        const userRef = ref(database, `usersData/${user.id}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          const emailName = user.given_name + " " + user.family_name;
          const name = emailName; // Use email name as default
          setProfileData({
            name,
            phone: data.phone || "",
          });
          setLinks({
            linkedin: data.linkedin || "",
            x: data.x || "",
          });

          // Save the default name to Firebase if it wasn't already set
          if (!data.name && emailName) {
            await set(userRef, { ...data, name: emailName });
          }
        }
      }
    };

    fetchData();
  }, [user]);

  const handleEditToggle = (field) => {
    setEditState((prevState) => ({
      ...prevState,
      [field]: !prevState[field],
    }));
    setInputValue((prevInput) => ({
      ...prevInput,
      [field]: profileData[field],
    }));
  };

  const handleCancel = (field) => {
    setEditState((prevState) => ({
      ...prevState,
      [field]: false,
    }));
  };

  const handleAddOrEditLinkClick = (field) => {
    setLinkOpen((prevState) => ({
      ...prevState,
      [field]: true,
    }));
    setEditingLinks((prevState) => ({
      ...prevState,
      [field]: !!links[field], // Set editing state if the link exists
    }));
  };

  const handleCancelLink = (field) => {
    setLinkOpen((prevState) => ({
      ...prevState,
      [field]: false,
    }));
    setEditingLinks((prevState) => ({
      ...prevState,
      [field]: false,
    }));
  };

  const saveToDatabase = async (data) => {
    if (user?.id) {
      const userRef = ref(database, `usersData/${user.id}`);
      const dataWithUserInfo = {
        ...data,
        userId: user.id,
        email: user.email || "", // Include email if available
      };
      await set(userRef, dataWithUserInfo);
      console.log("Data saved to Firebase:", dataWithUserInfo);
    }
  };

  const handleSave = (field) => {
    const updatedData = { ...profileData, [field]: inputValue[field] };
    setProfileData(updatedData);
    saveToDatabase({ ...updatedData, ...links });
    setEditState((prevState) => ({ ...prevState, [field]: false }));
  };

  const handleSaveLink = (field, ref) => {
    const updatedLinks = { ...links, [field]: ref.current.value };
    setLinks(updatedLinks);
    saveToDatabase({ ...profileData, ...updatedLinks });
    setLinkOpen((prevState) => ({ ...prevState, [field]: false }));
    setEditingLinks((prevState) => ({ ...prevState, [field]: false }));
  };

  return (
    <div className={styles.settingsProfile}>
      <div className={styles.settingsProfileContainer}>
        <div className={styles.settingsProfileCredentials}>
          <div className={styles.settingsProfileCredentialsContents}>
            <div className={styles.profileCredentialsTitle}>Name</div>
            <div className={styles.profileCredentialsEdit}>
              {!editState.name && (
                <div className={styles.profileCredentialsEditing}>
                  <p>{profileData.name || ""}</p>
                  <Image
                    src={edit}
                    onClick={() => setEditState({ ...editState, name: true })}
                    height={14}
                    alt="Edit"
                  />
                </div>
              )}
              {editState.name && (
                <div className={styles.profileCredentialsSave}>
                  <input
                    className={styles.profileCredentialsSaveInput}
                    value={inputValue.name}
                    onChange={(e) =>
                      setInputValue({ ...inputValue, name: e.target.value })
                    }
                  />
                  <div className={styles.profileCredentialsSaveButton}>
                    <button
                      className={styles.profileSaveBtn}
                      onClick={() => handleSave("name")}
                    >
                      Save
                    </button>
                    <button
                      className={styles.profileCancelBtn}
                      onClick={() =>
                        setEditState({ ...editState, name: false })
                      }
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={styles.settingsProfileCredentialsContents}>
            <div className={styles.profileCredentialsTitle}>Email</div>
            <div className={styles.profileCredentialsEdit}>
              <div className={styles.profileCredentialsEditing}>
                <p>{user?.email || ""}</p>
              </div>
            </div>
          </div>

          {/* Phone Number Field */}
          <div
            className={styles.settingsProfileCredentialsContents}
            id="profilePhoneNumber"
          >
            <div className={styles.profileCredentialsTitle}>Phone Number</div>
            <div className={styles.profileCredentialsEdit}>
              {!editState.phone && (
                <div className={styles.profileCredentialsEditing}>
                  <p>{profileData.phone || ""}</p>
                  <Image
                    src={edit}
                    onClick={() => setEditState({ ...editState, phone: true })}
                    height={14}
                    alt="Edit"
                  />
                </div>
              )}
              {editState.phone && (
                <div className={styles.profileCredentialsSave}>
                  <input
                    className={styles.profileCredentialsSaveInput}
                    value={inputValue.phone}
                    onChange={(e) =>
                      setInputValue({ ...inputValue, phone: e.target.value })
                    }
                  />
                  <div className={styles.profileCredentialsSaveButton}>
                    <button
                      className={styles.profileSaveBtn}
                      onClick={() => handleSave("phone")}
                    >
                      Save
                    </button>
                    <button
                      className={styles.profileCancelBtn}
                      onClick={() =>
                        setEditState({ ...editState, phone: false })
                      }
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Links Section */}
        <div className={styles.settingsProfileLinks}>
          <div className={styles.settingsProfileLinksTitle}>
            <p>Links</p>
          </div>
          <div className={styles.settingsProfileLinksSocial}>
            {/* LinkedIn */}
            <div className={styles.settingsProfileLinksSocialContainer}>
              <div className={styles.settingsProfileLinksSocialTitle}>
                <Image src={linkedin} alt="Social Icon" height={14} />
                <p>LinkedIn</p>
              </div>
              {links.linkedin && !linkOpen.linkedin ? (
                <div className={styles.profileCredentialsEditing}>
                  <p>{links.linkedin}</p>
                  <Image
                    src={edit}
                    onClick={() => handleAddOrEditLinkClick("linkedin")}
                    height={14}
                    alt="Edit"
                  />
                </div>
              ) : (
                !linkOpen.linkedin && (
                  <button
                    className={styles.socialLinksAdd}
                    onClick={() => handleAddOrEditLinkClick("linkedin")}
                  >
                    Add
                  </button>
                )
              )}
              {linkOpen.linkedin && (
                <div className={styles.profileCredentialsSave}>
                  <input
                    ref={linkedinRef}
                    className={styles.profileCredentialsSaveInput}
                    defaultValue={editingLinks.linkedin ? links.linkedin : ""}
                    placeholder="Enter LinkedIn link"
                  />
                  <div className={styles.profileCredentialsSaveButton}>
                    <button
                      className={styles.profileSaveBtn}
                      onClick={() => handleSaveLink("linkedin", linkedinRef)}
                    >
                      Save
                    </button>
                    <button
                      className={styles.profileCancelBtn}
                      onClick={() => handleCancelLink("linkedin")}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* X */}
            <div className={styles.settingsProfileLinksSocialContainer}>
              <div className={styles.settingsProfileLinksSocialTitle}>
                <Image src={x} alt="Social Icon" height={14} />
                <p>X</p>
              </div>
              {links.x && !linkOpen.x ? (
                <div className={styles.profileCredentialsEditing}>
                  <p>{links.x}</p>
                  <Image
                    src={edit}
                    onClick={() => handleAddOrEditLinkClick("x")}
                    height={14}
                    alt="Edit"
                  />
                </div>
              ) : (
                !linkOpen.x && (
                  <button
                    className={styles.socialLinksAdd}
                    onClick={() => handleAddOrEditLinkClick("x")}
                  >
                    Add
                  </button>
                )
              )}
              {linkOpen.x && (
                <div className={styles.profileCredentialsSave}>
                  <input
                    ref={xRef}
                    className={styles.profileCredentialsSaveInput}
                    defaultValue={editingLinks.x ? links.x : ""}
                    placeholder="Enter X link"
                  />
                  <div className={styles.profileCredentialsSaveButton}>
                    <button
                      className={styles.profileSaveBtn}
                      onClick={() => handleSaveLink("x", xRef)}
                    >
                      Save
                    </button>
                    <button
                      className={styles.profileCancelBtn}
                      onClick={() => handleCancelLink("x")}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
