import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import { useAuth } from "../common/context/useAuth";
import {
  cancelRestaurantRequest,
  getMyRestaurantRequestDetail,
  getMyRestaurantRequestLicenseViewUrl,
  type RestaurantApprovalStatus,
  type RestaurantMyRequestDetail,
} from "./api/restaurantRequestApi";

const STATUS_META: Record<
  RestaurantApprovalStatus,
  { label: string; color: "warning" | "success" | "error" | "default" }
> = {
  PENDING: { label: "확인 대기", color: "warning" },
  APPROVED: { label: "승인 완료", color: "success" },
  REJECTED: { label: "반려", color: "error" },
  CANCELLED: { label: "철회", color: "default" },
};

interface HttpErrorLike {
  message?: string;
  response?: {
    status?: number;
    data?: {
      message?: string | null;
      error?: {
        message?: string | null;
      } | null;
    };
  };
}

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString("ko-KR");
};

const getStatusGuide = (status: RestaurantApprovalStatus) => {
  if (status === "PENDING") {
    return {
      severity: "info" as const,
      text: "현재 관리자 검토 대기 상태입니다. 대기 중에는 신청 철회가 가능합니다.",
    };
  }

  if (status === "APPROVED") {
    return {
      severity: "success" as const,
      text: "승인된 신청입니다. 서비스 반영 여부를 확인해 주세요.",
    };
  }

  if (status === "REJECTED") {
    return {
      severity: "error" as const,
      text: "반려된 신청입니다. 반려 사유를 확인 후 수정해서 다시 신청해 주세요.",
    };
  }

  return {
    severity: "warning" as const,
    text: "철회된 신청입니다. 필요하면 새 신청을 등록할 수 있습니다.",
  };
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={0.7}>
      <Typography sx={{ width: { xs: "100%", sm: 100 }, color: "#666", fontSize: 14 }}>
        {label}
      </Typography>
      <Typography sx={{ flex: 1, color: "#222", fontSize: 14, whiteSpace: "pre-wrap" }}>{value}</Typography>
    </Stack>
  );
}

export default function MyRestaurantRequestDetailPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [licenseOpening, setLicenseOpening] = useState(false);
  const [detail, setDetail] = useState<RestaurantMyRequestDetail | null>(null);
  const [toast, setToast] = useState("");

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const markerRef = useRef<kakao.maps.Marker | null>(null);

  const requestId = useMemo(() => Number(id), [id]);
  const hasValidRequestId = Number.isInteger(requestId) && requestId > 0;

  const fetchDetail = useCallback(async () => {
    if (!user || !hasValidRequestId) {
      return;
    }

    try {
      setLoading(true);
      const data = await getMyRestaurantRequestDetail(requestId);
      setDetail(data);
    } catch (error: unknown) {
      if (error instanceof Error && error.message === "REQUEST_NOT_FOUND") {
        setToast("신청 내역을 찾을 수 없습니다.");
        return;
      }
      const status = (error as HttpErrorLike)?.response?.status;
      if (status === 401 || status === 403) {
        setToast("로그인이 필요합니다.");
      } else if (status === 404) {
        setToast("신청 내역을 찾을 수 없습니다.");
      } else {
        setToast("신청 상세 조회에 실패했습니다.");
      }
    } finally {
      setLoading(false);
    }
  }, [hasValidRequestId, requestId, user]);

  useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  useEffect(() => {
    if (!detail || !window.kakao?.maps || !mapContainerRef.current) {
      return;
    }

    kakao.maps.load(() => {
      const container = mapContainerRef.current;
      if (!container) {
        return;
      }

      const fallbackPosition = new kakao.maps.LatLng(37.5665, 126.978);

      const map =
        mapRef.current ??
        new kakao.maps.Map(container, {
          center: fallbackPosition,
          level: 4,
        });

      mapRef.current = map;

      const placeMarker = (position: kakao.maps.LatLng) => {
        map.setCenter(position);

        if (markerRef.current) {
          markerRef.current.setMap(null);
        }

        markerRef.current = new kakao.maps.Marker({ map, position });
      };

      if (detail.latitude !== null && detail.latitude !== undefined && detail.longitude !== null && detail.longitude !== undefined) {
        placeMarker(new kakao.maps.LatLng(Number(detail.latitude), Number(detail.longitude)));
      }
    });
  }, [detail]);

  const handleCancel = async () => {
    if (!detail) {
      return;
    }

    const shouldCancel = window.confirm("해당 신청을 철회하시겠습니까?");
    if (!shouldCancel) {
      return;
    }

    try {
      setProcessing(true);
      await cancelRestaurantRequest(detail.id);
      setToast("신청이 철회되었습니다.");
      await fetchDetail();
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
      setProcessing(false);
    }
  };

  const openMap = () => {
    if (!detail) {
      return;
    }

    const hasAddress = Boolean(detail.address?.trim());
    const hasCoordinates = detail.latitude !== undefined && detail.latitude !== null
      && detail.longitude !== undefined && detail.longitude !== null;

    if (hasAddress) {
      window.open(`https://map.kakao.com/?q=${encodeURIComponent(detail.address)}`, "_blank", "noopener,noreferrer");
      return;
    }

    if (hasCoordinates) {
      window.open(`https://map.kakao.com/link/map/${detail.latitude},${detail.longitude}`, "_blank", "noopener,noreferrer");
      return;
    }

    setToast("위치 정보가 없습니다.");
  };

  const handleOpenLicense = async () => {
    if (!detail) {
      return;
    }

    const popup = window.open("about:blank", "_blank");
    if (!popup) {
      setToast("브라우저 팝업 차단을 해제한 뒤 다시 시도해 주세요.");
      return;
    }

    try {
      setLicenseOpening(true);
      const viewUrl = await getMyRestaurantRequestLicenseViewUrl(detail.id);
      if (!viewUrl) {
        popup.close();
        setToast("첨부파일 주소를 불러오지 못했습니다.");
        return;
      }
      try {
        popup.location.replace(viewUrl);
        popup.focus();
      } catch {
        window.open(viewUrl, "_blank");
      }
    } catch (error: unknown) {
      popup.close();
      const httpError = error as HttpErrorLike;
      const status = httpError?.response?.status;
      const rawMessage = [
        httpError?.message,
        httpError?.response?.data?.message,
        httpError?.response?.data?.error?.message,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (status === 401 || status === 403) {
        setToast("로그인이 필요합니다.");
      } else if (status === 404) {
        setToast("첨부파일을 찾을 수 없습니다.");
      } else if (rawMessage.includes("no business license file")) {
        setToast("첨부파일이 없습니다.");
      } else {
        setToast("첨부파일 열기에 실패했습니다.");
      }
    } finally {
      setLicenseOpening(false);
    }
  };

  if (!user) {
    return (
      <Box sx={{ maxWidth: 940, mx: "auto", mt: 5 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          로그인 후 신청 상세를 확인할 수 있습니다.
        </Alert>
        <Button variant="contained" onClick={() => navigate("/auth/login")}>
          로그인 하러가기
        </Button>
      </Box>
    );
  }

  if (!hasValidRequestId) {
    return (
      <Box sx={{ maxWidth: 940, mx: "auto", mt: 5 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          잘못된 접근입니다.
        </Alert>
        <Button variant="outlined" onClick={() => navigate("/register/requests")}>목록으로</Button>
      </Box>
    );
  }

  const statusGuide = detail ? getStatusGuide(detail.approvalStatus) : null;
  const displayDescription = detail?.description?.trim() ? detail.description.trim() : "-";

  return (
    <Box sx={{ maxWidth: 940, mx: "auto", mt: 5 }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1} sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          신청 상세
        </Typography>
        <Button variant="outlined" onClick={() => navigate("/register/requests")}>목록으로</Button>
      </Stack>

      {loading && <Typography sx={{ color: "#666", mb: 2 }}>상세 정보를 불러오는 중...</Typography>}

      {!loading && !detail && <Alert severity="info">표시할 신청 정보가 없습니다.</Alert>}

      {detail && (
        <Card sx={{ border: "1px solid #ececec" }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
              <Box>
                <Typography sx={{ fontSize: 24, fontWeight: 800, lineHeight: 1.25 }}>{detail.name}</Typography>
                <Typography sx={{ fontSize: 13, color: "#888", mt: 0.5 }}>신청 번호: #{detail.id}</Typography>
              </Box>
              <Chip
                size="small"
                label={STATUS_META[detail.approvalStatus].label}
                color={STATUS_META[detail.approvalStatus].color}
                sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}
              />
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
              <Box>
                <Typography sx={{ fontWeight: 700, mb: 1 }}>신청 요약</Typography>
                <Stack spacing={0.8}>
                  <InfoRow label="신청일" value={formatDateTime(detail.createdAt)} />
                  <InfoRow
                    label="처리일"
                    value={detail.approvalStatus === "PENDING" ? "-" : formatDateTime(detail.reviewedAt)}
                  />
                </Stack>
              </Box>

              <Box>
                <Typography sx={{ fontWeight: 700, mb: 1 }}>첨부 서류</Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={0.7} alignItems={{ xs: "flex-start", sm: "center" }}>
                  <Typography sx={{ width: { xs: "100%", sm: 100 }, color: "#666", fontSize: 14 }}>
                    사업자등록증
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap" }}>
                    <Typography sx={{ color: "#222", fontSize: 14 }}>
                      {detail.hasBusinessLicenseFile || detail.businessLicenseFileKey ? "첨부됨" : "없음"}
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<DescriptionOutlinedIcon />}
                      onClick={() => void handleOpenLicense()}
                      disabled={licenseOpening}
                    >
                      {licenseOpening ? "여는 중..." : "첨부파일 열기"}
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography sx={{ fontWeight: 700, mb: 1 }}>신청 정보</Typography>
            <Stack spacing={0.9}>
              <InfoRow label="주소" value={detail.address || "-"} />
              <InfoRow label="전화번호" value={detail.phone || "-"} />
              <InfoRow
                label="카테고리"
                value={detail.categoryNames?.length ? detail.categoryNames.join(", ") : "-"}
              />
              <Box sx={{ pl: { xs: 0, sm: 12.5 } }}>
                <Button size="small" variant="outlined" endIcon={<OpenInNewIcon />} onClick={openMap}>
                  지도에서 크게 보기
                </Button>
              </Box>
              <InfoRow label="설명" value={displayDescription} />
            </Stack>

            <Box
              ref={mapContainerRef}
              sx={{
                mt: 2,
                width: "100%",
                height: 250,
                borderRadius: 1,
                border: "1px solid #e8e8e8",
                overflow: "hidden",
                backgroundColor: "#fafafa",
              }}
            />

            {detail.approvalStatus === "REJECTED" && (
              <Alert severity="error" sx={{ mt: 2 }}>
                반려 사유: {detail.rejectedReason || "사유가 전달되지 않았습니다."}
              </Alert>
            )}

            {statusGuide && (
              <Alert severity={statusGuide.severity} sx={{ mt: 2 }}>
                {statusGuide.text}
              </Alert>
            )}

            <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2 }}>
              <Button variant="outlined" onClick={() => navigate("/register/requests")}>닫기</Button>
              {detail.approvalStatus === "PENDING" && (
                <Button
                  color="error"
                  variant="contained"
                  disabled={processing}
                  onClick={() => void handleCancel()}
                >
                  신청 철회
                </Button>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={2200}
        message={toast}
        onClose={() => setToast("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
}
