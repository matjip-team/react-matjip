import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
<<<<<<< HEAD
import Homepage from "../pages/Home/Homepage";
<<<<<<< HEAD
import BoardPage from "../pages/Board/BoardPage";
import BoardWrite from "../pages/Board/BoardWrite";
import BoardDetail from "../pages/Board/BoardDetail";
=======
<<<<<<< HEAD
import AIRecommendPage from "../pages/AI/AIRecommendPage";
=======
import MapPage from "../pages/map/MapPage";
>>>>>>> 76f4ce4e862fcc4766460afd28b80dfa9284573f
import AIRecommendPage from "../pages/AIRecommendPage";
>>>>>>> 053f79f777e4d2a8804499cc08c934cbc41c8ada
=======
import Homepage from "../pages/home/Homepage";
import AIRecommendPage from "../pages/ai/AIRecommendPage";
import MapPage from "../pages/map/MapPage";
>>>>>>> d5a255f9a538adfe1dda949e635969ac9916ad24
import SignupPage from "../pages/auth/SignupPage";
import LoginPage from "../pages/auth/LoginPage";
import Me from "../pages/auth/Me";
import MyPage from "../pages/mypage/MyPage";
import Sample2 from "../pages/Sample2";

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Homepage />} />
          <Route path="/board" element={<BoardPage />} />
          <Route path="/board/write" element={<BoardWrite />} />
          <Route path="/board/:id" element={<BoardDetail />} />
          {/* 아래는 나중에 추가 */}
          {<Route path="/map" element={<MapPage />} />}
          {/* <Route path="/map" element={<MapPage />} /> */}
          <Route path="/ai" element={<AIRecommendPage />} />
          <Route path="/auth/signup" element={<SignupPage />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/me" element={<Me />} />
          <Route path="/auth/mypage" element={<MyPage />} />
          <Route path="/sample" element={<Sample2 />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
