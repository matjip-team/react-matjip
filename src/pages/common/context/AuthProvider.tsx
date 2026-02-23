import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "../types/user";
import { AuthContext } from "./authContext";
import axios from "../../common/axios";
import type { ApiResponse } from "../../common/types/api";
import { useNavigate } from "react-router-dom";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const setUser = (user: User | null) => {
    setUserState(user);
  };

  const logout = async () => {
    try {
      await axios.post<ApiResponse<null>>("/api/spring/auth/logout");
      setUser(null);
      window.dispatchEvent(new CustomEvent("show-toast", { detail: { message: "로그아웃 되었습니다." } }));
      navigate("/auth/login");
    } catch (err) {
      console.error("Logout error:", err);
      setUser(null);
      window.dispatchEvent(new CustomEvent("show-toast", { detail: { message: "로그아웃 되었습니다." } }));
      navigate("/auth/login");
    }
  };

  // 새로고침 시 서버에서 유저 정보 가져오기 (roles → role, profileImageUrl 정규화)
  const toUser = (data: {
    id: number;
    email: string;
    name: string;
    nickname: string;
    role?: string;
    roles?: string[];
    profileImageUrl?: string;
  }): User => {
    const role =
      data.role ??
      (Array.isArray(data.roles) ? data.roles[0] : undefined) ??
      "ROLE_USER";
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      nickname: data.nickname,
      role,
      profileImageUrl: data.profileImageUrl,
    };
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res =
          await axios.get<ApiResponse<User & { roles?: string[] }>>(
            "/api/spring/users/me",
          );
        if (res.data.success && res.data.data) {
          setUser(toUser(res.data.data));
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

  // accessToken 없음/만료(401 + refresh 실패) 시 로그아웃 처리
  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
      window.dispatchEvent(new CustomEvent("show-toast", { detail: { message: "로그아웃 되었습니다." } }));
      navigate("/auth/login");
    };
    window.addEventListener("auth:session-expired", handleSessionExpired);
    return () => window.removeEventListener("auth:session-expired", handleSessionExpired);
  }, [navigate]);

  if (loading) return <div>Loading...</div>;

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
