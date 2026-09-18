import React from "react";
import { useOutletContext } from "react-router-dom";
import AccountSettings from "./AccountSettings";

export default function AccountSettingsRoute() {
  const { updateUser } = useOutletContext();
  return <AccountSettings onUpdateUser={updateUser} />;
}