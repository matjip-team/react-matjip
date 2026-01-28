import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Homepage from "../pages/Home/Homepage";
import BoardPage from "../pages/Board/BoardPage";
import BoardWrite from "../pages/Board/BoardWrite";
import BoardDetail from "../pages/Board/BoardDetail";

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
          {/* <Route path="/map" element={<MapPage />} /> */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
