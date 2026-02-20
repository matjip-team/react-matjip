import { Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../pages/common/context/useAuth";

/** 로그인한 사용자만 접근 가능. 비로그인 시 홈(/)으로 리다이렉트 */
export function AuthRouteGuard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user === null) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  if (user === null) {
    return null; // 리다이렉트 중
  }

  return <Outlet />;
}
