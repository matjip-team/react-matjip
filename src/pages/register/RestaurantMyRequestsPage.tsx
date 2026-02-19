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
        setToast("濡쒓렇?몄씠 ?꾩슂?⑸땲??");
      } else if (status === 404) {
        setToast("???좎껌?댁뿭 API媛 ?꾩쭅 ?곌껐?섏? ?딆븯?듬땲??");
      } else {
        setToast("?좎껌?댁뿭 議고쉶???ㅽ뙣?덉뒿?덈떎.");
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void fetchMyRequests();
  }, [fetchMyRequests]);

  const handleCancel = async (requestId: number) => {
    const shouldCancel = window.confirm("?대떦 ?좎껌??泥좏쉶?섏떆寃좎뒿?덇퉴?");
    if (!shouldCancel) return;

    try {
      setProcessingId(requestId);
      await cancelRestaurantRequest(requestId);
      setToast("?좎껌??泥좏쉶?덉뒿?덈떎.");
      await fetchMyRequests();
    } catch (error: unknown) {
      const status = (error as HttpErrorLike)?.response?.status;
      if (status === 400) {
        setToast("?湲??곹깭 ?좎껌留?泥좏쉶?????덉뒿?덈떎.");
      } else if (status === 401 || status === 403) {
        setToast("濡쒓렇?몄씠 ?꾩슂?⑸땲??");
      } else {
        setToast("?좎껌 泥좏쉶???ㅽ뙣?덉뒿?덈떎.");
      }
    } finally {
      setProcessingId(null);
    }
  };

  if (!user) {
    return (
      <Box sx={{ maxWidth: 900, mx: "auto", mt: 5 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          濡쒓렇?명빐???좎껌?댁뿭???뺤씤?????덉뒿?덈떎.
        </Alert>
        <Stack direction="row" spacing={1}>
          <Button variant="contained" onClick={() => navigate("/auth/login")}>
            濡쒓렇???섎윭媛湲?
          </Button>
          <Button variant="outlined" onClick={() => navigate("/")}>
            ??
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
            ??留쏆쭛 ?깅줉 ?좎껌?댁뿭
          </Typography>
        </Box>
      </Stack>

      {loading && (
        <Typography sx={{ color: "#666", mb: 2 }}>
          ?좎껌?댁뿭 遺덈윭?ㅻ뒗 以?..
        </Typography>
      )}

      {!loading && items.length === 0 && (
        <Alert severity="info">?깅줉???좎껌?댁뿭???놁뒿?덈떎.</Alert>
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
                    ?좎껌?? {new Date(item.createdAt).toLocaleString()}
                  </Typography>
                </Box>

                {item.approvalStatus === "PENDING" && (
                  <Button
                    color="error"
                    variant="outlined"
                    disabled={processingId === item.id}
                    onClick={() => void handleCancel(item.id)}
                  >
                    ?좎껌 泥좏쉶
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

