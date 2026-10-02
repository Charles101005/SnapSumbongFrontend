import { createContext, useContext } from "react";

export const AuthContext = createContext(null);

export function homePathFor(user) {
  return user?.is_staff === true ? "/dashboard" : "/home";
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
