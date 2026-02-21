import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Pagination,
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
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        spacing={1}
        sx={{ mb: 2 }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          맛집 등록 신청 접수
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant={selectedStatus === "PENDING" ? "contained" : "outlined"}
            color="warning"
            onClick={() => setSelectedStatus("PENDING")}
          >
            승인대기
          </Button>
          <Button
            variant={selectedStatus === "APPROVED" ? "contained" : "outlined"}
            color="success"
            onClick={() => setSelectedStatus("APPROVED")}
          >
            승인완료
          </Button>
        </Stack>
      </Stack>

      {loading && <Typography sx={{ color: "#666", mb: 2 }}>목록 불러오는 중...</Typography>}

      {!loading && filteredItems.length === 0 && (
        <Alert severity="info">선택한 상태의 신청 내역이 없습니다.</Alert>
      )}

      <Stack spacing={2}>
        {pagedItems.map((item) => (
          <Card key={item.id} sx={{ border: "1px solid #eee" }}>
            <CardContent>
              <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ flex: 1 }}>
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
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
        <Pagination
          page={page}
          count={filteredItems.length === 0 ? 1 : pageCount}
          disabled={filteredItems.length === 0}
          onChange={(_, value) => setPage(value)}
        />
      </Box>

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
