import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Homepage from "../pages/Home/Homepage";
<<<<<<< HEAD
import MapPage from "../pages/map/MapPage";
=======
import AIRecommendPage from "../pages/AIRecommendPage";
>>>>>>> a57ce48c045d985facc2ecb0b63ad2ef6f956b09
import SignupPage from "../pages/auth/SignupPage";
import LoginPage from "../pages/auth/LoginPage";
import Me from "../pages/auth/Me";

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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
