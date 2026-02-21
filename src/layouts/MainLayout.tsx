import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Avatar, Badge, Snackbar, Tooltip } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import "./mainLayout.css";
import { useAuth } from "../pages/common/context/useAuth.ts";
import { useState, useRef, useEffect } from "react";
import { API_BASE_URL } from "../pages/common/config/config";

const toAvatarUrl = (url?: string) => {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_BASE_URL}/images/${url}`;
};

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const { user, logout } = useAuth();
  const [toast, setToast] = useState("");
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const adminMenuRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.role === "ROLE_ADMIN" || user?.role === "ADMIN";

  useEffect(() => {
    const handleShowToast = (e: Event) => {
      const message = (e as CustomEvent<{ message: string }>).detail?.message;
      if (message) setToast(message);
    };
    window.addEventListener("show-toast", handleShowToast);
    return () => window.removeEventListener("show-toast", handleShowToast);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        adminMenuRef.current &&
        !adminMenuRef.current.contains(e.target as Node)
      ) {
        setAdminMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const myHandleClick = () => {
    navigate("/auth/mypage");
  };

  return (
    <div className="layout">
      {/* ===== 헤더 ===== */}
      <header className="header">
        <div className="header-inner">
          <div className="logo" onClick={() => navigate("/")}>
           <img
            src="/images/logo.png"
            alt="MATJIB"
            style={{
         height: 80,
        cursor: "pointer",
       }}
      />
  </div>

          <nav className="nav">
            <span
              className={location.pathname === "/" ? "active" : ""}
              onClick={() => navigate("/")}
            >
              맛집 소개
            </span>

            <span
              className={location.pathname === "/map" ? "active" : ""}
              onClick={() => navigate("/map")}
            >
              맛집 지도
            </span>

            <span
              className={location.pathname === "/board" ? "active" : ""}
              onClick={() => navigate("/board")}
            >
              커뮤니티
            </span>

            <span
              className={location.pathname.startsWith("/blog") ? "active" : ""}
              onClick={() => navigate("/blog")}
            >
              블로그
            </span>

            <span
              className={location.pathname === "/ai" ? "active" : ""}
              onClick={() => navigate("/ai")}
            >
              AI 서비스
            </span>

            {user && (
              <>
                <span
                  className={location.pathname === "/register" ? "active" : ""}
                  onClick={() => navigate("/register")}
                >
                  맛집 등록
                </span>

                <span
                  className={
                    location.pathname === "/register/requests" ? "active" : ""
                  }
                  onClick={() => navigate("/register/requests")}
                >
                  내 신청내역
                </span>
              </>
            )}

            {isAdmin && (
              <div className="nav-dropdown" ref={adminMenuRef}>
                <span
                  className={
                    location.pathname.startsWith("/admin") ? "active" : ""
                  }
                  onClick={() => setAdminMenuOpen((prev) => !prev)}
                >
                  관리자 페이지
                  <ExpandMoreIcon
                    sx={{
                      fontSize: 18,
                      verticalAlign: "middle",
                      ml: 0.5,
                      transform: adminMenuOpen ? "rotate(180deg)" : "none",
                      transition: "transform 0.2s",
                    }}
                  />
                </span>

                {adminMenuOpen && (
                  <div className="nav-submenu">
                    <span
                      onClick={() => {
                        navigate("/admin/restaurant-requests");
                        setAdminMenuOpen(false);
                      }}
                    >
                      신청 접수
                    </span>

                    <span
                      onClick={() => {
                        navigate("/admin/board");
                        setAdminMenuOpen(false);
                      }}
                    >
                      커뮤니티 관리
                    </span>

                    <span
                      onClick={() => {
                        navigate("/admin/blog");
                        setAdminMenuOpen(false);
                      }}
                    >
                      블로그 관리
                    </span>
                    <span
                      className={
                        location.pathname.startsWith("/admin/user") ? "active" : ""
                      }
                      onClick={() => {
                        navigate("/admin/user");
                        setAdminMenuOpen(false);
                      }}
                    >
                      회원관리
                    </span>
                  </div>
                )}
              </div>
            )}
          </nav>

          {user ? (
            <div className="auth" style={{ display: "flex", alignItems: "center" }}>
              <span>안녕하세요, {user?.name ?? ""}님</span>

              <span onClick={logout} style={{ marginLeft: 10 }}>
                로그아웃
              </span>

              <Tooltip title="My 페이지 클릭">
                <div
                  onClick={myHandleClick}
                  style={{
                    display: "inline-block",
                    cursor: "pointer",
                    marginLeft: 10,
                  }}
                >
                  <Badge badgeContent={1} color="primary" overlap="circular">
                    <Avatar
                      src={toAvatarUrl(user?.profileImageUrl)}
                      alt={user?.name}
                    >
                      {!user?.profileImageUrl && <PersonIcon />}
                    </Avatar>
                  </Badge>
                </div>
              </Tooltip>
            </div>
          ) : (
            <div className="auth" onClick={() => navigate("/auth/login")}>
              로그인
            </div>
          )}
        </div>
      </header>

      {/* 🔥 Hero 완전 삭제됨 */}

      {/* ===== 페이지 영역 ===== */}
      <main className="content">
        <Outlet />
      </main>

      {/* ===== 푸터 ===== */}
      <footer className="footer">
        Copyright © MATJIB
      </footer>

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={1500}
        message={toast}
        onClose={() => setToast("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </div>
  );
}