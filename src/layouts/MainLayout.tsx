import { Outlet, useLocation, useNavigate } from "react-router-dom";
import "./mainLayout.css";

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";

  return (
    <div className="layout">
      {/* 헤더 */}
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
              className={location.pathname === "/community" ? "active" : ""}
              onClick={() => navigate("/community")}
            >
              커뮤니티
            </span>

            <span
              className={location.pathname === "/ai" ? "active" : ""}
              onClick={() => navigate("/ai")}
            >
              AI 서비스
            </span>
          </nav>

          <div className="auth">로그인</div>
        </div>
      </header>

      {/* 홈일 때만 Hero */}
      {isHome && (
        <section className="hero">
          <div className="hero-bg" />
          <div className="hero-content">
            <h1>오늘 뭐 먹지?</h1>
            <p>지역과 취향에 맞는 맛집을 찾아보세요</p>
            <div className="hero-search">
              <input placeholder="맛집명, 지역명을 검색해보세요" />
            </div>
          </div>
        </section>
      )}

      {/* 페이지 영역 */}
      <main className="content">
        <Outlet />
      </main>

      <footer className="footer">Copyright © MATJIB</footer>
    </div>
  );
}
