import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "../types/user";
import { AuthContext } from "./authContext";
import axios from "../../common/axios";
import type { ApiResponse } from "../../common/types/api";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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

  // 새로고침 시 서버에서 유저 정보 가져오기
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get<ApiResponse<User>>("/api/users/me");
        if (res.data.success && res.data.data) {
          setUser(res.data.data);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error(err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
