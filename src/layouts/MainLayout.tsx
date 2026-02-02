import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Avatar, Badge, Tooltip } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import "./mainLayout.css";
import { useAuth } from "../pages/common/context/useAuth.ts";

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/"; // 홈인지 체크

  const { user, logout } = useAuth();

  const myHandleClick = () => {
    navigate("/auth/mypage");
  };

  return (
    <div className="layout">
      {/* 헤더 */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">PROJECT MATJIB</div>
          <nav className="nav">
            <span className="active">맛집 소개</span>
            <span>맛집 지도</span>
            <span>커뮤니티</span>
            <span>AI 서비스</span>
          </nav>
          {user ? (
            <>
              <div
                className="auth"
                
                style={{ display: "flex", alignItems: "center" }}
              >
                <span>안녕하세요, {user?.name ?? ""}님</span>
                <span onClick={logout} style={{ marginLeft: 10 }}>로그아웃</span>
                <Tooltip title="My 페이지 클릭">
                  <div
                    onClick={myHandleClick}
                    style={{
                      display: "inline-block",
                      cursor: "pointer",
                      marginLeft: 10,
                    }}
                  >
                    <Badge
                      badgeContent={1} // 표시할 숫자
                      color="primary"
                      overlap="circular"
                    >
                      <Avatar>
                        <PersonIcon />
                      </Avatar>
                    </Badge>
                  </div>
                </Tooltip>
              </div>
            </>
          ) : (
            <>
              <div className="auth" onClick={() => navigate("/auth/login")}>
                로그인
              </div>
            </>
          )}
        </div>
      </header>

      {/* 홈일 때만 Hero 보여주기 */}
      {isHome && (
        <section className="hero">
          {/* 배경 이미지 */}
          <div className="hero-bg" />

          {/* 텍스트 & 검색 (이미지 위) */}
          <div className="hero-content">
            <h1>오늘 뭐 먹지?</h1>
            <p>지역과 취향에 맞는 맛집을 찾아보세요</p>

            <div className="hero-search">
              <input placeholder="맛집명, 지역명을 검색해보세요" />
            </div>
          </div>
        </section>
      )}

      {/* 페이지 내용 */}
      <main className="content">
        <Outlet />
      </main>

      {/* 푸터 */}
      <footer className="footer">Copyright © MATJIB</footer>
    </div>
  );
}
