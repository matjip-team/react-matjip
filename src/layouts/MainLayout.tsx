import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Avatar, Badge, Snackbar, Tooltip } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import "./mainLayout.css";
import { useAuth } from "../pages/common/context/useAuth";
import { useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "../pages/common/config/config";
import axios from "../pages/common/axios";

const toAvatarUrl = (url?: string) => {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_BASE_URL}/images/${url}`;
};

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";

  const { user, logout } = useAuth();
  const [toast, setToast] = useState("");
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const adminMenuRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.role === "ROLE_ADMIN" || user?.role === "ADMIN";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (adminMenuRef.current && !adminMenuRef.current.contains(e.target as Node)) {
        setAdminMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      setPendingRequestCount(0);
      return;
    }

    let mounted = true;

    const fetchPendingRequestCount = async () => {
      try {
        const res = await axios.get("/api/admin/restaurants", {
          params: { status: "PENDING" },
        });
        const items = Array.isArray(res.data?.data) ? res.data.data : [];
        if (mounted) {
          setPendingRequestCount(items.length);
        }
      } catch {
        if (mounted) {
          setPendingRequestCount(0);
        }
      }
    };

    void fetchPendingRequestCount();
    const intervalId = window.setInterval(fetchPendingRequestCount, 30000);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, [isAdmin, adminMenuOpen]);

  return (
    <div className="layout">
      <header className="header">
        <div className="header-inner">
          <div className="logo">PROJECT MATJIB</div>

          <nav className="nav">
            <span className={location.pathname === "/" ? "active" : ""} onClick={() => navigate("/")}>
              맛집 탐색
            </span>

            <span className={location.pathname === "/map" ? "active" : ""} onClick={() => navigate("/map")}>
              맛집 지도
            </span>

            <span className={location.pathname === "/board" ? "active" : ""} onClick={() => navigate("/board")}>
              커뮤니티
            </span>

            <span className={location.pathname.startsWith("/blog") ? "active" : ""} onClick={() => navigate("/blog")}>
              블로그
            </span>

            <span className={location.pathname === "/ai" ? "active" : ""} onClick={() => navigate("/ai")}>
              AI 서비스
            </span>

            {isAdmin && (
              <div className="nav-dropdown" ref={adminMenuRef}>
                <span
                  className={location.pathname.startsWith("/admin") ? "active" : ""}
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
                      className={location.pathname.startsWith("/admin/restaurant-requests") ? "active" : ""}
                      onClick={() => {
                        navigate("/admin/restaurant-requests");
                        setAdminMenuOpen(false);
                      }}
                    >
                      맛집신청 관리
                      {pendingRequestCount > 0 && (
                        <span
                          style={{
                            marginLeft: 6,
                            minWidth: 18,
                            height: 18,
                            padding: "0 6px",
                            borderRadius: 9,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#fff",
                            backgroundColor: "#ff6b00",
                            lineHeight: 1,
                          }}
                        >
                          {pendingRequestCount > 99 ? "99+" : pendingRequestCount}
                        </span>
                      )}
                    </span>

                    <span
                      className={location.pathname.startsWith("/admin/board") ? "active" : ""}
                      onClick={() => {
                        navigate("/admin/board");
                        setAdminMenuOpen(false);
                      }}
                    >
                      커뮤니티 관리
                    </span>

                    <span
                      className={location.pathname.startsWith("/admin/board/reports") ? "active" : ""}
                      onClick={() => {
                        navigate("/admin/board/reports");
                        setAdminMenuOpen(false);
                      }}
                    >
                      신고 관리
                    </span>

                    <span
                      className={location.pathname.startsWith("/admin/blog") ? "active" : ""}
                      onClick={() => {
                        navigate("/admin/blog");
                        setAdminMenuOpen(false);
                      }}
                    >
                      블로그 관리
                    </span>
                  </div>
                )}
              </div>
            )}
          </nav>

          {user ? (
            <div className="auth" style={{ display: "flex", alignItems: "center" }}>
              <span>안녕하세요 {user.name ?? ""}님</span>
              <span onClick={logout} style={{ marginLeft: 10 }}>
                로그아웃
              </span>
              <Tooltip title="My 페이지 클릭">
                <div
                  onClick={() => navigate("/auth/mypage")}
                  style={{ display: "inline-block", cursor: "pointer", marginLeft: 10 }}
                >
                  <Badge badgeContent={1} color="primary" overlap="circular">
                    <Avatar src={toAvatarUrl(user.profileImageUrl)} alt={user.name}>
                      {!user.profileImageUrl && <PersonIcon />}
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
            <p>지역과 취향에 맞는 맛집을 찾아보세요.</p>
            <div className="hero-search">
              <input placeholder="맛집명 / 지역명 검색" />
            </div>
          </div>
        </section>
      )}

      <main className="content">
        <Outlet />
      </main>

      <footer className="footer">Copyright MATJIB</footer>

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
