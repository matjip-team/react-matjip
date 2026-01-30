import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Homepage from "../pages/Home/Homepage";
import AIRecommendPage from "../pages/AIRecommendPage";

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Homepage />} />
          {/* 아래는 나중에 추가 */}
          {/* <Route path="/map" element={<MapPage />} /> */}
          <Route path="/ai" element={<AIRecommendPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
