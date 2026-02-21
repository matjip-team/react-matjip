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
  imageUrl?: string | null;
  hasBusinessLicenseFile: boolean;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  createdAt: string;
};

const STATUS_META: Record<
  RestaurantRequestItem["approvalStatus"],
  { label: string; color: "warning" | "success" | "error" | "default" }
> = {
  PENDING: { label: "승인 대기", color: "warning" },
  APPROVED: { label: "승인 완료", color: "success" },
  REJECTED: { label: "반려", color: "error" },
  CANCELLED: { label: "철회", color: "default" },
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
      const statuses: RestaurantRequestItem["approvalStatus"][] = [
        "PENDING",
        "APPROVED",
        "REJECTED",
        "CANCELLED",
      ];

      const responses = await Promise.all(
        statuses.map((status) =>
          axios.get("/api/admin/restaurants", { params: { status } }),
        ),
      );

      const merged = responses.flatMap(
        (res) => (res.data?.data as RestaurantRequestItem[] | undefined) ?? [],
      );

      const deduped = Array.from(
        new Map(merged.map((item) => [item.id, item])).values(),
      );

      deduped.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      setItems(deduped);
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

      {!loading && items.length === 0 && <Alert severity="info">신청 내역이 없습니다.</Alert>}

      <Stack spacing={2}>
        {items.map((item) => (
          <Card key={item.id} sx={{ border: "1px solid #eee" }}>
            <CardContent>
              <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ flex: 1 }}>
                  <Box
                    sx={{
                      width: 120,
                      minWidth: 120,
                      height: 90,
                      borderRadius: 1,
                      overflow: "hidden",
                      border: "1px solid #eee",
                      bgcolor: "#f7f7f7",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {item.imageUrl ? (
                      <Box
                        component="img"
                        src={item.imageUrl}
                        alt={`${item.name} 대표사진`}
                        sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <Typography sx={{ fontSize: 12, color: "#999" }}>대표사진 없음</Typography>
                    )}
                  </Box>
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
                </Stack>

                <Stack direction={{ xs: "row", md: "column" }} spacing={1}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate(`/admin/restaurant-requests/${item.id}`)}
                  >
                    상세보기
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
