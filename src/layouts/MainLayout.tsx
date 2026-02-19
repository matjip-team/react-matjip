import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Avatar, Badge, Snackbar, Tooltip } from "@mui/material";
import { useState } from "react";
import PersonIcon from "@mui/icons-material/Person";
import "./mainLayout.css";
import { useAuth } from "../pages/common/context/useAuth.ts";

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  const [toast, setToast] = useState("");

  const { user, logout } = useAuth();
  const isAdmin = user?.role === "ROLE_ADMIN" || user?.role === "ADMIN";

  const myHandleClick = () => {
    navigate("/auth/mypage");
  };

  const handleRegisterClick = () => {
    if (!user) {
      setToast("로그인이 필요합니다.");
      return;
    }
    navigate("/register");
  };

  const handleMyRequestClick = () => {
    if (!user) {
      setToast("로그인이 필요합니다.");
      return;
    }
    navigate("/register/requests");
  };

  return (
    <div className="layout">
      <header className="header">
        <div className="header-inner">
          <div className="logo">PROJECT MATJIB</div>

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
              className={location.pathname.startsWith("/board") ? "active" : ""}
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

            <span
              className={location.pathname === "/register" ? "active" : ""}
              onClick={handleRegisterClick}
            >
              맛집 등록
            </span>

            <span
              className={location.pathname === "/register/requests" ? "active" : ""}
              onClick={handleMyRequestClick}
            >
              내 신청내역
            </span>

            {isAdmin && (
              <span
                className={location.pathname === "/admin/restaurant-requests" ? "active" : ""}
                onClick={() => navigate("/admin/restaurant-requests")}
              >
                신청 접수
              </span>
            )}
          </nav>

          {user ? (
            <div className="auth" style={{ display: "flex", alignItems: "center" }}>
              <span>안녕하세요 {user?.name ?? ""}님</span>
              <span onClick={logout} style={{ marginLeft: 10 }}>
                로그아웃
              </span>
              <Tooltip title="마이페이지 이동">
                <div
                  onClick={myHandleClick}
                  style={{
                    display: "inline-block",
                    cursor: "pointer",
                    marginLeft: 10,
                  }}
                >
                  <Badge badgeContent={1} color="primary" overlap="circular">
                    <Avatar>
                      <PersonIcon />
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

      {isHome && (
        <section className="hero">
          <div className="hero-bg" />
          <div className="hero-content">
            <h1>오늘 뭐 먹지?</h1>
            <p>지역과 취향에 맞는 맛집을 찾아보세요</p>
            <div className="hero-search">
              <input placeholder="맛집명, 지역명으로 검색해보세요" />
            </div>
          </div>
        </section>
      )}

      <main className="content">
        <Outlet />
      </main>

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={1500}
        message={toast}
        onClose={() => setToast("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />

      <footer className="footer">Copyright MATJIB</footer>
    </div>
  );
}
