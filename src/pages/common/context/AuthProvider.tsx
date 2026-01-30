import { useState } from "react";
import type { ReactNode } from "react";
import type { User } from "../types/user";
import { AuthContext } from "./authContext";
import axios from "../../common/axios";
import type { ApiResponse } from "../../common/types/api";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);

  const setUser = (user: User | null) => {
    setUserState(user);
  };

  const logout = async () => {
    try {
      await axios.post<ApiResponse<null>>("/api/auth/logout");
      setUser(null);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
