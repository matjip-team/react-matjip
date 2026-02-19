import { useCallback, useEffect, useState } from "react";
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
import { useAuth } from "../common/context/useAuth";
import {
  cancelRestaurantRequest,
  getMyRestaurantRequests,
  type RestaurantApprovalStatus,
  type RestaurantMyRequestItem,
} from "./api/restaurantRequestApi";

const STATUS_META: Record<
  RestaurantApprovalStatus,
  { label: string; color: "warning" | "success" | "error" | "default" }
> = {
  PENDING: { label: "확인 대기", color: "warning" },
  APPROVED: { label: "확인 완료", color: "success" },
  REJECTED: { label: "반려", color: "error" },
  CANCELLED: { label: "철회", color: "default" },
};

interface HttpErrorLike {
  response?: {
    status?: number;
  };
}

export default function RestaurantMyRequestsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<RestaurantMyRequestItem[]>([]);
  const [toast, setToast] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchMyRequests = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await getMyRestaurantRequests();
      setItems(data);
    } catch (error: unknown) {
      const status = (error as HttpErrorLike)?.response?.status;
      if (status === 401 || status === 403) {
        setToast("로그인이 필요합니다.");
      } else if (status === 404) {
        setToast("내 신청내역 API가 아직 연결되지 않았습니다.");
      } else {
        setToast("신청내역 조회에 실패했습니다.");
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void fetchMyRequests();
  }, [fetchMyRequests]);

  const handleCancel = async (requestId: number) => {
    const shouldCancel = window.confirm("해당 신청을 철회하시겠습니까?");
    if (!shouldCancel) return;

    try {
      setProcessingId(requestId);
      await cancelRestaurantRequest(requestId);
      setToast("신청이 철회되었습니다.");
      await fetchMyRequests();
    } catch (error: unknown) {
      const status = (error as HttpErrorLike)?.response?.status;
      if (status === 400) {
        setToast("대기 상태 신청만 철회할 수 있습니다.");
      } else if (status === 401 || status === 403) {
        setToast("로그인이 필요합니다.");
      } else {
        setToast("신청 철회에 실패했습니다.");
      }
    } finally {
      setProcessingId(null);
    }
  };

  if (!user) {
    return (
      <Box sx={{ maxWidth: 900, mx: "auto", mt: 5 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          로그인해야 내 신청내역을 확인할 수 있습니다.
        </Alert>
        <Stack direction="row" spacing={1}>
          <Button variant="contained" onClick={() => navigate("/auth/login")}>
            로그인 하러가기
          </Button>
          <Button variant="outlined" onClick={() => navigate("/")}>
            홈
          </Button>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", mt: 5 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        spacing={1}
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            내 맛집 등록 신청내역
          </Typography>
        </Box>
      </Stack>

      {loading && (
        <Typography sx={{ color: "#666", mb: 2 }}>
          신청내역 불러오는 중...
        </Typography>
      )}

      {!loading && items.length === 0 && (
        <Alert severity="info">등록된 신청내역이 없습니다.</Alert>
      )}

      <Stack spacing={2}>
        {items.map((item) => (
          <Card key={item.id} sx={{ border: "1px solid #eee" }}>
            <CardContent>
              <Stack
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                spacing={2}
              >
                <Box>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ mb: 0.6 }}
                  >
                    <Typography sx={{ fontSize: 18, fontWeight: 700 }}>
                      {item.name}
                    </Typography>
                    <Chip
                      size="small"
                      label={STATUS_META[item.approvalStatus].label}
                      color={STATUS_META[item.approvalStatus].color}
                    />
                  </Stack>
                  <Typography sx={{ color: "#666" }}>{item.address}</Typography>
                  <Typography sx={{ color: "#999", mt: 0.5, fontSize: 13 }}>
                    신청일 {new Date(item.createdAt).toLocaleString()}
                  </Typography>
                </Box>

                {item.approvalStatus === "PENDING" && (
                  <Button
                    color="error"
                    variant="outlined"
                    disabled={processingId === item.id}
                    onClick={() => void handleCancel(item.id)}
                  >
                    신청 철회
                  </Button>
                )}
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
