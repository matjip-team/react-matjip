import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import axios from "../common/axios";
import { useAuth } from "../common/context/useAuth";

type RestaurantRequestItem = {
  id: number;
  name: string;
  address: string;
  hasBusinessLicenseFile: boolean;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
};

const STATUS_META: Record<
  RestaurantRequestItem["approvalStatus"],
  { label: string; color: "warning" | "success" | "error" }
> = {
  PENDING: { label: "승인 대기", color: "warning" },
  APPROVED: { label: "승인 완료", color: "success" },
  REJECTED: { label: "반려", color: "error" },
};

export default function RestaurantRequestPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<RestaurantRequestItem[]>([]);
  const [toast, setToast] = useState("");

  const isAdmin = useMemo(() => {
    const role = user?.role ?? "";
    return role === "ROLE_ADMIN" || role === "ADMIN";
  }, [user]);

  const fetchRequests = useCallback(async () => {
    if (!isAdmin) return;

    try {
      setLoading(true);
      const res = await axios.get("/api/admin/restaurants", {
        params: { status: "PENDING" },
      });
      setItems(res.data?.data ?? []);
    } catch (error) {
      console.error(error);
      setToast("신청 목록 조회에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  const handleViewLicense = async (id: number) => {
    try {
      const res = await axios.get(`/api/admin/restaurants/${id}/license-view-url`);
      const viewUrl = res.data?.data;
      if (!viewUrl) {
        setToast("서류 보기 URL 발급에 실패했습니다.");
        return;
      }
      window.open(viewUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error(error);
      setToast("서류 보기 URL 발급에 실패했습니다.");
    }
  };

  if (!user) {
    return (
      <Box sx={{ maxWidth: 980, mx: "auto", mt: 5 }}>
        <Alert severity="warning">로그인이 필요합니다.</Alert>
      </Box>
    );
  }

  if (!isAdmin) {
    return (
      <Box sx={{ maxWidth: 980, mx: "auto", mt: 5 }}>
        <Alert severity="error">관리자만 접근 가능합니다.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 980, mx: "auto", mt: 5 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        맛집 등록 신청 접수
      </Typography>

      {loading && <Typography sx={{ color: "#666", mb: 2 }}>목록 불러오는 중...</Typography>}

      {!loading && items.length === 0 && <Alert severity="info">승인 대기 신청이 없습니다.</Alert>}

      <Stack spacing={2}>
        {items.map((item) => (
          <Card key={item.id} sx={{ border: "1px solid #eee" }}>
            <CardContent>
              <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.6 }}>
                    <Typography sx={{ fontSize: 18, fontWeight: 700 }}>{item.name}</Typography>
                    <Chip
                      size="small"
                      label={STATUS_META[item.approvalStatus].label}
                      color={STATUS_META[item.approvalStatus].color}
                    />
                  </Stack>

                  <Typography sx={{ color: "#666" }}>{item.address}</Typography>
                  <Typography sx={{ color: "#999", mt: 0.5, fontSize: 13 }}>
                    신청일: {new Date(item.createdAt).toLocaleString()}
                  </Typography>
                </Box>

                <Stack direction={{ xs: "row", md: "column" }} spacing={1}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate(`/admin/restaurant-requests/${item.id}`)}
                  >
                    상세보기
                  </Button>

                  <Button
                    variant="outlined"
                    disabled={!item.hasBusinessLicenseFile}
                    onClick={() => void handleViewLicense(item.id)}
                  >
                    서류 보기
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={1800}
        message={toast}
        onClose={() => setToast("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
}
