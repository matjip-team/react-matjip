import { NavLink, Outlet, useLocation } from "react-router-dom";
import "./mainLayout.css";

export default function MainLayout() {
  const location = useLocation();
  const isHome = location.pathname === "/"; // 홈인지 체크

  return (
    <div className="layout">
      {/* 헤더 */}
      <header className="header">
       <div className="header-inner">
         <div className="logo">PROJECT MATJIB</div>
          <nav className="nav">
            <NavLink to="/" end>
                맛집 소개
              </NavLink>

              <NavLink to="/map">
                맛집 지도
              </NavLink>

              <NavLink to="/board">
                커뮤니티
              </NavLink>

              <NavLink to="/ai">
                AI 서비스
              </NavLink>
          </nav>
    <div className="auth">로그인</div>
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
