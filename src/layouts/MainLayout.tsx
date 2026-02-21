import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Avatar, Snackbar, Tooltip } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FavoriteIcon from "@mui/icons-material/Favorite";
import PreviewIcon from "@mui/icons-material/Preview";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import ContentPasteSearchIcon from "@mui/icons-material/ContentPasteSearch";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import BlogFeaturedCarousel from "../components/BlogFeaturedCarousel/BlogFeaturedCarousel";
import "./mainLayout.css";
import { useAuth } from "../pages/common/context/useAuth.ts";
import { useState, useEffect } from "react";
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

  const isAdmin = user?.role === "ROLE_ADMIN" || user?.role === "ADMIN";

  useEffect(() => {
    const handleShowToast = (e: Event) => {
      const message = (e as CustomEvent<{ message: string }>).detail?.message;
      if (message) setToast(message);
    };
    window.addEventListener("show-toast", handleShowToast);
    return () => window.removeEventListener("show-toast", handleShowToast);
  }, []);

  const mypageTabs = [
    { label: "찜한 식당", path: "/auth/mypage?tab=0", icon: FavoriteIcon },
    { label: "내가 쓴 리뷰", path: "/auth/mypage?tab=1", icon: PreviewIcon },
    { label: "맛집 등록", path: "/auth/mypage?tab=2", icon: RestaurantIcon },
    { label: "내 신청 내역", path: "/auth/mypage?tab=3", icon: ContentPasteSearchIcon },
    { label: "내 정보", path: "/auth/mypage?tab=4", icon: PersonOutlineIcon },
  ];

  return (
    <div className="layout">
      {/* ===== 헤더 ===== */}
      <header className="header">
        <div className="header-inner">
          <div className="header-logo" onClick={() => navigate("/")}>
            <img src="/images/logo2.png" alt="MATJIB" />
          </div>

          <nav className="nav">
            <Tooltip
              title="등록된 맛집 목록을 둘러보세요"
              arrow
              placement="bottom"
            >
              <span
                className={location.pathname === "/" ? "active" : ""}
                onClick={() => navigate("/")}
              >
                맛집 소개
              </span>
            </Tooltip>
            <Tooltip
              title="지도에서 맛집 위치를 확인하세요"
              arrow
              placement="bottom"
            >
              <span
                className={location.pathname === "/map" ? "active" : ""}
                onClick={() => navigate("/map")}
              >
                맛집 지도
              </span>
            </Tooltip>
            <Tooltip
              title="자유롭게 이야기를 나눠보세요"
              arrow
              placement="bottom"
            >
              <span
                className={location.pathname === "/board" ? "active" : ""}
                onClick={() => navigate("/board")}
              >
                커뮤니티
              </span>
            </Tooltip>
            <Tooltip
              title="맛집 관련 블로그 글을 읽어보세요"
              arrow
              placement="bottom"
            >
              <span
                className={
                  location.pathname.startsWith("/blog") ? "active" : ""
                }
                onClick={() => navigate("/blog")}
              >
                맛집 이야기
              </span>
            </Tooltip>
            <Tooltip
              title="AI가 추천하는 맛집을 확인해보세요"
              arrow
              placement="bottom"
            >
              <span
                className={location.pathname === "/ai" ? "active" : ""}
                onClick={() => navigate("/ai")}
              >
                AI 서비스
              </span>
            </Tooltip>
            {isAdmin && (
              <div className="nav-dropdown admin-dropdown">
                <Tooltip title="관리자 전용 메뉴" arrow placement="bottom">
                  <span
                    className={
                      location.pathname.startsWith("/admin") ? "active" : ""
                    }
                  >
                    관리자
                    <ExpandMoreIcon
                      sx={{
                        fontSize: 18,
                        verticalAlign: "middle",
                        ml: 0.5,
                        transition: "transform 0.2s",
                      }}
                      className="admin-chevron"
                    />
                  </span>
                </Tooltip>
                <div className="nav-submenu admin-submenu">
                  <Tooltip
                    title="맛집 등록 신청을 검토합니다"
                    arrow
                    placement="right"
                  >
                    <span onClick={() => navigate("/admin/restaurant-requests")}>
                      신청 접수
                    </span>
                  </Tooltip>
                  <Tooltip
                    title="커뮤니티 게시글을 관리합니다"
                    arrow
                    placement="right"
                  >
                    <span onClick={() => navigate("/admin/board")}>
                      커뮤니티 관리
                    </span>
                  </Tooltip>
                  <Tooltip
                    title="블로그 글을 관리합니다"
                    arrow
                    placement="right"
                  >
                    <span onClick={() => navigate("/admin/blog")}>
                      블로그 관리
                    </span>
                  </Tooltip>
                  <Tooltip
                    title="회원 정보를 관리합니다"
                    arrow
                    placement="right"
                  >
                    <span
                      className={
                        location.pathname.startsWith("/admin/user")
                          ? "active"
                          : ""
                      }
                      onClick={() => navigate("/admin/user")}
                    >
                      회원관리
                    </span>
                  </Tooltip>
                </div>
              </div>
            )}
          </nav>

          <div className="header-auth">
            {user ? (
              <>
                <span className="header-greeting">
                  안녕하세요, {user?.name ?? ""}님
                </span>
                <span className="header-logout" onClick={logout}>
                  로그아웃
                </span>
                <div className="mypage-dropdown">
                  <div className="mypage-dropdown-trigger" title="마이페이지">
                    <Avatar
                      src={toAvatarUrl(user?.profileImageUrl)}
                      alt={user?.name}
                      sx={{ width: 36, height: 36 }}
                    >
                      {!user?.profileImageUrl && <PersonIcon />}
                    </Avatar>
                  </div>
                  <div className="mypage-submenu">
                    {mypageTabs.map((item) => {
                      const tabId = item.path.split("tab=")[1];
                      const isActive =
                        location.pathname === "/auth/mypage" &&
                        (location.search === `?tab=${tabId}` || (!location.search && tabId === "0"));
                      const Icon = item.icon;
                      return (
                        <span
                          key={item.path}
                          className={`mypage-submenu-item ${isActive ? "active" : ""}`}
                          onClick={() => navigate(item.path)}
                        >
                          <Icon sx={{ fontSize: 18, mr: 1.5, flexShrink: 0 }} />
                          {item.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <button
                type="button"
                className="header-login-btn"
                onClick={() => navigate("/auth/login")}
              >
                로그인
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 블로그 featured 롤링 섹션 */}
      <BlogFeaturedCarousel />

      {/* ===== 페이지 영역 ===== */}
      <main className="content">
        <Outlet />
      </main>

      {/* ===== 푸터 ===== */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <img src="/images/logo2.png" alt="MATJIB" className="footer-logo" />
            <p className="footer-tagline">오늘 뭐 먹지? 맛집을 찾아보세요</p>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h4>맛집 둘러보기</h4>
              <span onClick={() => navigate("/")}>맛집 소개</span>
              <span onClick={() => navigate("/map")}>맛집 지도</span>
            </div>
            <div className="footer-column">
              <h4>커뮤니티</h4>
              <span onClick={() => navigate("/board")}>커뮤니티</span>
              <span onClick={() => navigate("/blog")}>블로그</span>
            </div>
            <div className="footer-column">
              <h4>서비스</h4>
              <span onClick={() => navigate("/ai")}>AI 서비스</span>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} MATJIB. All rights reserved.</span>
        </div>
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
