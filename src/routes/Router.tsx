import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Homepage from "../pages/Home/Homepage";
import MapPage from "../pages/map/MapPage";
import AIRecommendPage from "../pages/AIRecommendPage";
import SignupPage from "../pages/auth/SignupPage";
import LoginPage from "../pages/auth/LoginPage";
import Me from "../pages/auth/Me";
<<<<<<< HEAD
import MyPage from "../pages/MyPage";

=======
import MapPage from "../pages/MyPage/index";
import Sample2 from "../pages/Sample2";
>>>>>>> 5a406a9d854b5b83a4f5ed4f68300113c1e2d82c

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Homepage />} />
          {/* 아래는 나중에 추가 */}
          { <Route path="/map" element={<MapPage />} /> }
          {/* <Route path="/map" element={<MapPage />} /> */}
          <Route path="/ai" element={<AIRecommendPage />} />
          <Route path="/auth/signup" element={<SignupPage />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/me" element={<Me />} />
<<<<<<< HEAD
          <Route path="/auth/mypage" element={<MyPage />} />
=======
          <Route path="/auth/mypage" element={<MapPage />} />
          <Route path="/sample" element={<Sample2 />} />
>>>>>>> 5a406a9d854b5b83a4f5ed4f68300113c1e2d82c
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
