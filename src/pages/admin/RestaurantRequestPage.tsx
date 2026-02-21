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
import axios from "../common/axios";
import { useAuth } from "../common/context/useAuth";

type RestaurantRequestItem = {
  id: number;
  name: string;
  address: string;
  imageUrl?: string | null;
  representativeImageUrl?: string | null;
  hasBusinessLicenseFile: boolean;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  createdAt: string;
};

const ACCENT = "#ff6b00";

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
  const [selectedStatus, setSelectedStatus] = useState<"PENDING" | "APPROVED">(
    "PENDING",
  );
  const [page, setPage] = useState(1);
  const pageSize = 5;

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

  const filteredItems = useMemo(
    () => items.filter((item) => item.approvalStatus === selectedStatus),
    [items, selectedStatus],
  );

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(filteredItems.length / pageSize)),
    [filteredItems.length],
  );

  const pagedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page]);

  useEffect(() => {
    setPage(1);
  }, [selectedStatus]);

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);


  if (!user) {
    return (
      <Box
        sx={{
          maxWidth: 1100,
          mx: "auto",
          py: 5,
          px: { xs: 2, sm: 3 },
        }}
      >
        <Alert
          severity="warning"
          sx={{
            borderRadius: 2,
            border: "1px solid rgba(245,158,11,0.3)",
          }}
        >
          로그인이 필요합니다.
        </Alert>
      </Box>
    );
  }

  if (!isAdmin) {
    return (
      <Box
        sx={{
          maxWidth: 1100,
          mx: "auto",
          py: 5,
          px: { xs: 2, sm: 3 },
        }}
      >
        <Alert
          severity="error"
          sx={{
            borderRadius: 2,
            border: "1px solid rgba(220,38,38,0.2)",
          }}
        >
          관리자만 접근 가능합니다.
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        maxWidth: 1100,
        mx: "auto",
        py: 5,
        px: { xs: 2, sm: 3 },
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
            맛집 등록 신청
          </Typography>
          <Typography sx={{ fontSize: 14, color: "#64748b" }}>
            맛집 등록 신청을 검토하고 승인할 수 있습니다
          </Typography>
        </Box>
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
          <Button
            variant={selectedStatus === "PENDING" ? "contained" : "outlined"}
            sx={{
              bgcolor: selectedStatus === "PENDING" ? ACCENT : "transparent",
              color: selectedStatus === "PENDING" ? "#fff" : "#64748b",
              borderColor: selectedStatus === "PENDING" ? ACCENT : "rgba(0,0,0,0.2)",
              borderRadius: 1,
              fontWeight: 600,
              "&:hover": {
                bgcolor: selectedStatus === "PENDING" ? "#e55f00" : "rgba(0,0,0,0.04)",
                borderColor: selectedStatus === "PENDING" ? "#e55f00" : "rgba(0,0,0,0.3)",
              },
            }}
            onClick={() => setSelectedStatus("PENDING")}
          >
            승인대기
          </Button>
          <Button
            variant={selectedStatus === "APPROVED" ? "contained" : "outlined"}
            sx={{
              bgcolor: selectedStatus === "APPROVED" ? "#059669" : "transparent",
              color: selectedStatus === "APPROVED" ? "#fff" : "#64748b",
              borderColor: selectedStatus === "APPROVED" ? "#059669" : "rgba(0,0,0,0.2)",
              borderRadius: 1,
              fontWeight: 600,
              "&:hover": {
                bgcolor: selectedStatus === "APPROVED" ? "#047857" : "rgba(0,0,0,0.04)",
                borderColor: selectedStatus === "APPROVED" ? "#047857" : "rgba(0,0,0,0.3)",
              },
            }}
            onClick={() => setSelectedStatus("APPROVED")}
          >
            승인완료
          </Button>
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
          선택한 상태의 신청 내역이 없습니다.
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
                        ...(item.approvalStatus === "PENDING" && {
                          bgcolor: ACCENT,
                          color: "#fff",
                        }),
                        ...(item.approvalStatus === "APPROVED" && {
                          bgcolor: "#059669",
                          color: "#fff",
                        }),
                        ...(item.approvalStatus === "REJECTED" && {
                          bgcolor: "#dc2626",
                          color: "#fff",
                        }),
                        ...(item.approvalStatus === "CANCELLED" && {
                          bgcolor: "#64748b",
                          color: "#fff",
                        }),
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
                      navigate(`/admin/restaurant-requests/${item.id}`, {
                        state: { imageUrl: item.imageUrl ?? item.representativeImageUrl ?? null },
                      })
                    }
                  >
                    상세보기
                  </Button>
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
