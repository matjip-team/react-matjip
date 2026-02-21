import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Pagination,
  Paper,
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

const ACCENT = "#ff6b00";

const STATUS_META: Record<
  RestaurantApprovalStatus,
  { label: string; color: "warning" | "success" | "error" | "default" }
> = {
  PENDING: { label: "승인 대기", color: "warning" },
  APPROVED: { label: "승인 완료", color: "success" },
  REJECTED: { label: "반려", color: "error" },
  CANCELLED: { label: "철회", color: "default" },
};

const PAGE_SIZE = 5;

interface HttpErrorLike {
  response?: {
    status?: number;
  };
}

interface Props {
  /** 마이페이지 탭 내부에 렌더될 때 true (상단 패딩 제거) */
  embedded?: boolean;
}

export default function MyRestaurantRequestListPage({ embedded = false }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<RestaurantMyRequestItem[]>([]);
  const [toast, setToast] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<
    RestaurantApprovalStatus[]
  >(["PENDING", "APPROVED"]);
  const [page, setPage] = useState(1);

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
        setToast("신청 내역 API가 연결되지 않았습니다.");
      } else {
        setToast("신청 내역 조회에 실패했습니다.");
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void fetchMyRequests();
  }, [fetchMyRequests]);

  const filteredItems = useMemo(() => {
    if (selectedStatuses.length === 0) return items;
    return items.filter((item) => selectedStatuses.includes(item.approvalStatus));
  }, [items, selectedStatuses]);

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE)),
    [filteredItems.length],
  );

  const pagedItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [filteredItems, page]);

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  const toggleStatusFilter = (status: RestaurantApprovalStatus) => {
    setPage(1);
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status],
    );
  };

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
      <Box
        sx={{
          maxWidth: embedded ? "100%" : 1100,
          mx: embedded ? 0 : "auto",
          px: embedded ? 0 : { xs: 2, sm: 3 },
          ...(embedded ? { py: 0 } : { py: 5 }),
        }}
      >
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2, border: "1px solid rgba(245,158,11,0.3)" }}>
            로그인 후 신청내역을 확인할 수 있습니다.
          </Alert>
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="contained"
              onClick={() => navigate("/auth/login")}
              sx={{ bgcolor: ACCENT, "&:hover": { bgcolor: "#e55f00" }, fontWeight: 600, borderRadius: 1.5 }}
            >
              로그인 하러가기
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate("/")}
              sx={{
                borderColor: "rgba(0,0,0,0.2)",
                color: "#64748b",
                fontWeight: 600,
                borderRadius: 1.5,
                "&:hover": { borderColor: ACCENT, color: ACCENT, bgcolor: "rgba(255,107,0,0.04)" },
              }}
            >
              홈
            </Button>
          </Stack>
        </Box>
    );
  }

  const statusFilters: Array<{ status: RestaurantApprovalStatus; label: string }> = [
    { status: "PENDING", label: "승인대기" },
    { status: "APPROVED", label: "승인완료" },
    { status: "REJECTED", label: "반려" },
    { status: "CANCELLED", label: "철회" },
  ];

  return (
    <Box
      sx={{
        maxWidth: embedded ? "100%" : 1100,
        mx: embedded ? 0 : "auto",
        px: embedded ? 0 : { xs: 2, sm: 3 },
        ...(embedded ? { py: 0 } : { py: 5 }),
      }}
    >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 2,
            mb: 4,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: "#1a1a1a",
                letterSpacing: "-0.02em",
                mb: 0.5,
              }}
            >
              내 맛집 등록 신청내역
            </Typography>
            <Typography sx={{ fontSize: 14, color: "#64748b" }}>
              내가 신청한 맛집 등록 내역을 확인합니다
            </Typography>
          </Box>
          <Button
            variant="contained"
            sx={{
              bgcolor: ACCENT,
              "&:hover": { bgcolor: "#e55f00" },
              textTransform: "none",
              fontWeight: 600,
              px: 2.5,
              borderRadius: 1.5,
            }}
            onClick={() => navigate("/register")}
          >
            맛집 등록하기
          </Button>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 4,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "rgba(0,0,0,0.06)",
            bgcolor: "#fafafa",
          }}
        >
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {statusFilters.map(({ status, label }) => {
              const selected = selectedStatuses.includes(status);
              const statusColors =
                status === "PENDING"
                  ? { bg: ACCENT, border: ACCENT, hover: "#e55f00" }
                  : status === "APPROVED"
                    ? { bg: "#059669", border: "#059669", hover: "#047857" }
                    : status === "REJECTED"
                      ? { bg: "#dc2626", border: "#dc2626", hover: "#b91c1c" }
                      : { bg: "#64748b", border: "#64748b", hover: "#475569" };
              return (
                <Button
                  key={status}
                  variant={selected ? "contained" : "outlined"}
                  sx={{
                    bgcolor: selected ? statusColors.bg : "transparent",
                    color: selected ? "#fff" : "#64748b",
                    borderColor: selected ? statusColors.border : "rgba(0,0,0,0.2)",
                    borderRadius: 1,
                    fontWeight: 600,
                    "&:hover": {
                      bgcolor: selected ? statusColors.hover : "rgba(0,0,0,0.04)",
                      borderColor: selected ? statusColors.hover : "rgba(0,0,0,0.3)",
                    },
                  }}
                  onClick={() => toggleStatusFilter(status)}
                >
                  {label}
                </Button>
              );
            })}
          </Box>
        </Paper>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: ACCENT }} />
          </Box>
        ) : filteredItems.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              py: 8,
              textAlign: "center",
              color: "#94a3b8",
              fontSize: 15,
              borderRadius: 2,
              border: "1px dashed rgba(0,0,0,0.1)",
              bgcolor: "#f8fafc",
            }}
          >
            조건에 맞는 신청 내역이 없습니다.
          </Paper>
        ) : (
          <Stack spacing={2}>
            {pagedItems.map((item) => (
              <Paper
                key={item.id}
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "rgba(0,0,0,0.06)",
                  bgcolor: "#fff",
                  transition: "all 0.2s",
                  "&:hover": {
                    borderColor: ACCENT,
                    boxShadow: "0 4px 12px rgba(255,107,0,0.08)",
                  },
                }}
              >
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  justifyContent="space-between"
                  alignItems={{ xs: "stretch", md: "center" }}
                  spacing={2}
                >
                  <Stack direction="column" spacing={1} sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      <Typography sx={{ fontSize: 17, fontWeight: 700, color: "#1a1a1a" }}>
                        {item.name}
                      </Typography>
                      <Chip
                        size="small"
                        label={STATUS_META[item.approvalStatus].label}
                        sx={{
                          height: 22,
                          fontSize: 11,
                          fontWeight: 600,
                          "& .MuiChip-label": { px: 1 },
                          ...(item.approvalStatus === "PENDING" && { bgcolor: ACCENT, color: "#fff" }),
                          ...(item.approvalStatus === "APPROVED" && { bgcolor: "#059669", color: "#fff" }),
                          ...(item.approvalStatus === "REJECTED" && { bgcolor: "#dc2626", color: "#fff" }),
                          ...(item.approvalStatus === "CANCELLED" && { bgcolor: "#64748b", color: "#fff" }),
                        }}
                      />
                    </Stack>
                    <Typography sx={{ color: "#64748b", fontSize: 14 }}>{item.address}</Typography>
                    <Typography sx={{ color: "#94a3b8", fontSize: 13 }}>
                      신청일: {new Date(item.createdAt).toLocaleString("ko-KR")}
                    </Typography>
                  </Stack>

                  <Stack direction={{ xs: "row", md: "column" }} spacing={1} alignItems="flex-start">
                    <Button
                      variant="outlined"
                      sx={{
                        borderRadius: 1.5,
                        fontWeight: 600,
                        borderColor: "rgba(0,0,0,0.2)",
                        color: "#64748b",
                        "&:hover": {
                          borderColor: ACCENT,
                          color: ACCENT,
                          bgcolor: "rgba(255,107,0,0.04)",
                        },
                      }}
                      onClick={() =>
                        navigate(`/register/requests/${item.id}`, {
                          state: { imageUrl: item.imageUrl ?? item.representativeImageUrl ?? null },
                        })
                      }
                    >
                      상세보기
                    </Button>
                    {item.approvalStatus === "PENDING" && (
                      <Button
                        variant="outlined"
                        disabled={processingId === item.id}
                        sx={{
                          borderRadius: 1.5,
                          fontWeight: 600,
                          borderColor: "#dc2626",
                          color: "#dc2626",
                          "&:hover": {
                            borderColor: "#b91c1c",
                            bgcolor: "rgba(220,38,38,0.04)",
                          },
                        }}
                        onClick={() => void handleCancel(item.id)}
                      >
                        신청 철회
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            mt: 4,
            "& .MuiPaginationItem-root": { fontSize: 14 },
            "& .Mui-selected": {
              bgcolor: ACCENT,
              color: "#fff",
              "&:hover": { bgcolor: "#e55f00" },
            },
          }}
        >
          <Pagination
            page={page}
            count={filteredItems.length === 0 ? 1 : pageCount}
            disabled={filteredItems.length === 0}
            onChange={(_, value) => setPage(value)}
            color="standard"
            shape="rounded"
          />
        </Box>

        <Snackbar
          open={Boolean(toast)}
          autoHideDuration={2000}
          message={toast}
          onClose={() => setToast("")}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        />
      </Box>
  );
}

