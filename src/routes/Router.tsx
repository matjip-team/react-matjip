import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";

import Homepage from "../pages/home/Homepage";
import BoardPage from "../pages/board/BoardPage";
import BoardWrite from "../pages/board/BoardWrite";
import BoardDetail from "../pages/board/BoardDetail";
import BoardEdit from "../pages/board/BoardEdit";
import BlogPage from "../pages/blog/BlogPage";
import BlogWrite from "../pages/blog/BlogWrite";
import BlogDetail from "../pages/blog/BlogDetail";
import BlogEdit from "../pages/blog/BlogEdit";
import MapPage from "../pages/map/MapPage";
import AIRecommendPage from "../pages/ai/AIRecommendPage";
import SignupPage from "../pages/auth/SignupPage";
import LoginPage from "../pages/auth/LoginPage";
import Me from "../pages/auth/Me";
import MyPage from "../pages/mypage/MyPage";
import Sample2 from "../pages/Sample2";
import Restaurant from "../pages/restaurant/Restaurant";
import Sample3 from "../pages/Sample3";
import Register from "../pages/register/RegisterPage.tsx";
import RestaurantRequestPage from "../pages/admin/RestaurantRequestPage";
import RestaurantMyRequestsPage from "../pages/register/RestaurantMyRequestsPage";

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Homepage />} />
          <Route path="/board" element={<BoardPage />} />
          <Route path="/board/write" element={<BoardWrite />} />
          <Route path="/board/:id" element={<BoardDetail />} />
          <Route path="/board/edit/:id" element={<BoardEdit />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/write" element={<BlogWrite />} />
          <Route path="/blog/:id" element={<BlogDetail />} />
          <Route path="/blog/edit/:id" element={<BlogEdit />} />

          {/* 아래는 나중에 추가 */}
          {<Route path="/map" element={<MapPage />} />}
          {/* <Route path="/map" element={<MapPage />} /> */}
          <Route path="/ai" element={<AIRecommendPage />} />
          <Route path="/auth/signup" element={<SignupPage />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/me" element={<Me />} />
          <Route path="/auth/mypage" element={<MyPage />} />
          <Route path="/sample" element={<Sample2 />} />
          <Route path="/restaurant/:id" element={<Restaurant />} />
          <Route path="/sample3" element={<Sample3 />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register/requests" element={<RestaurantMyRequestsPage />} />
          <Route path="/admin/restaurant-requests" element={<RestaurantRequestPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
