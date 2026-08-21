import { createContext } from "react";

export type CurrentUser = {
  userId: string;
  name: string;
  username: string;
  role: "admin" | "employee";
  linkedEmployeeId?: string;
};

export type AuthState = {
  status: "loading" | "anon" | "authed";
  user: CurrentUser | null;
  token: string | null;
  setToken: (token: string) => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthState | null>(null);
