import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { AdminRouteGuard } from "./AdminRouteGuard";
import { AuthRouteGuard } from "./AuthRouteGuard";

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
import Register from "../pages/register/RegisterPage";
import RestaurantRequestPage from "../pages/admin/RestaurantRequestPage";
import RestaurantRequestDetailPage from "../pages/admin/RestaurantRequestDetailPage";
import AdminBoardPage from "../pages/admin/board/AdminBoardPage";
import AdminBoardWritePage from "../pages/admin/board/BoardWrite";
import AdminBoardDetailPage from "../pages/admin/board/BoardDetail";
import AdminBoardEditPage from "../pages/admin/board/BoardEdit";
import AdminBoardReportPage from "../pages/admin/board/BoardReportPage";
import AdminBlogPage from "../pages/admin/blog/AdminBlogPage";
import AdminBlogWrite from "../pages/admin/blog/AdminBlogWrite";
import AdminBlogDetail from "../pages/admin/blog/AdminBlogDetail";
import AdminBlogEdit from "../pages/admin/blog/AdminBlogEdit";
import MyRestaurantRequestListPage from "../pages/register/MyRestaurantRequestListPage";
import MyRestaurantRequestDetailPage from "../pages/register/MyRestaurantRequestDetailPage";
import { AuthProvider } from "../pages/common/context/AuthProvider";

export default function Router() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
          <Route path="/sample" element={<Sample2 />} />
          <Route path="/restaurant/:id" element={<Restaurant />} />
          <Route path="/sample3" element={<Sample3 />} />
          {/* ROLE_USER, ROLE_ADMIN만 접근 가능 */}
          <Route element={<AuthRouteGuard />}>
            <Route path="/register" element={<Register />} />
            <Route
              path="/register/requests"
              element={<MyRestaurantRequestListPage />}
            />
            <Route
              path="/register/requests/:id"
              element={<MyRestaurantRequestDetailPage />}
            />
            <Route path="/auth/mypage" element={<MyPage />} />
          </Route>
          {/* ROLE_ADMIN만 접근 가능 */}
          <Route element={<AdminRouteGuard />}>
            <Route
              path="/admin/restaurant-requests"
              element={<RestaurantRequestPage />}
            />
            <Route
              path="/admin/restaurant-requests/:id"
              element={<RestaurantRequestDetailPage />}
            />
            <Route path="/admin/board" element={<AdminBoardPage />} />
            <Route path="/admin/board/reports" element={<AdminBoardReportPage />} />
            <Route path="/admin/board/write" element={<AdminBoardWritePage />} />
            <Route path="/admin/board/edit/:id" element={<AdminBoardEditPage />} />
            <Route path="/admin/board/:id" element={<AdminBoardDetailPage />} />
            <Route path="/admin/blog" element={<AdminBlogPage />} />
            <Route path="/admin/blog/write" element={<AdminBlogWrite />} />
            <Route path="/admin/blog/edit/:id" element={<AdminBlogEdit />} />
            <Route path="/admin/blog/:id" element={<AdminBlogDetail />} />
          </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
