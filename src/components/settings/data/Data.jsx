import React from "react";
import { getDatabase } from "firebase/database";
import { useRouter } from "next/navigation";
import {
  LogoutLink,
  useKindeBrowserClient,
} from "@kinde-oss/kinde-auth-nextjs";

const database = getDatabase();

const Data = () => {
  const { user } = useKindeBrowserClient();
  const router = useRouter();
  const [hover, setHover] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <div className="settings-data">
      <div className="settings-data-contents">
        <p>Export Data</p>
        <div className="export-data">Export</div>
      </div>
      <div className="settings-data-contents">
        <p>Delete all memory</p>
        <div className="delete-all-memory">Delete</div>
      </div>
      <div className="settings-data-contents">
        <p>Log out </p>
        <LogoutLink
          postLogoutRedirectURL="https://app.luzu.ai/"
          className="delete-account"
        >
          Log out
        </LogoutLink>
      </div>
    </div>
  );
};

export default Data;
