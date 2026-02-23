import { Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../pages/common/context/useAuth";

/** ROLE_ADMIN만 접근 가능. 아니면 홈(/)으로 리다이렉트 */
export function AdminRouteGuard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user?.role === "ROLE_ADMIN" || user?.role === "ADMIN";

  useEffect(() => {
    if (!user || !isAdmin) {
      navigate("/", { replace: true });
    }
  }, [user, isAdmin, navigate]);

  if (!user || !isAdmin) {
    return null; // 리다이렉트 중
  }

  return <Outlet />;
}
