import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ReactQuill, { Quill } from "react-quill-new";
import "react-quill-new/dist/quill.bubble.css";
import "react-quill-new/dist/quill.snow.css";
import "quill-table-better/dist/quill-table-better.css";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import { useAuth } from "../common/context/useAuth";
import { registerBlogQuillModules } from "../blog/quillSetup";
import {
  cancelRestaurantRequest,
  getMyRestaurantRequestDetail,
  getMyRestaurantRequestLicenseViewUrl,
  type RestaurantApprovalStatus,
  type RestaurantMyRequestDetail,
  updateMyRestaurantRequest,
} from "./api/restaurantRequestApi";

registerBlogQuillModules(Quill);

const STATUS_META: Record<
  RestaurantApprovalStatus,
  { label: string; color: "warning" | "success" | "error" | "default" }
> = {
  PENDING: { label: "승인 대기", color: "warning" },
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

type EditFormState = {
  name: string;
  address: string;
  phone: string;
  description: string;
  categoryText: string;
  latitude: number | null;
  longitude: number | null;
  imageUrl: string;
};


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

const S3_PUBLIC_BASE_URL =
  (import.meta.env.VITE_S3_PUBLIC_BASE_URL as string | undefined)?.replace(/\/$/, "") ??
  "https://matjip-board-images-giduon-2026.s3.ap-northeast-2.amazonaws.com";

const toDisplayImageUrl = (value?: string | null): string | null => {
  const raw = value?.trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw) || raw.startsWith("/")) return raw;
  return `${S3_PUBLIC_BASE_URL}/${raw.replace(/^\/+/, "")}`;
};

const CATEGORY_OPTIONS = [
  "한식",
  "양식",
  "고기/구이",
  "씨푸드",
  "일중/세계음식",
  "비건",
  "카페/디저트",
];

const buildEditForm = (data: RestaurantMyRequestDetail): EditFormState => ({
  name: data.name ?? "",
  address: data.address ?? "",
  phone: data.phone ?? "",
  description: data.description ?? "",
  categoryText: data.categoryNames?.join(", ") ?? "",
  latitude: data.latitude ?? null,
  longitude: data.longitude ?? null,
  imageUrl: data.imageUrl ?? data.representativeImageUrl ?? "",
});

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
  const location = useLocation();
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [licenseOpening, setLicenseOpening] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<RestaurantMyRequestDetail | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState>({
    name: "",
    address: "",
    phone: "",
    description: "",
    categoryText: "",
    latitude: null,
    longitude: null,
    imageUrl: "",
  });
  const [toast, setToast] = useState("");

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const markerRef = useRef<kakao.maps.Marker | null>(null);

  const requestId = useMemo(() => Number(id), [id]);
  const hasValidRequestId = Number.isInteger(requestId) && requestId > 0;
  const imageUrlFromState = (location.state as { imageUrl?: string | null } | null)?.imageUrl ?? null;
  const displayImageUrl = toDisplayImageUrl(
    detail?.imageUrl ?? detail?.representativeImageUrl ?? imageUrlFromState ?? null,
  );

  const fetchDetail = useCallback(async () => {
    if (!user || !hasValidRequestId) {
      return;
    }

    try {
      setLoading(true);
      const data = await getMyRestaurantRequestDetail(requestId);
      setDetail(data);
      const nextForm = buildEditForm(data);
      setIsEditMode(false);
      setEditForm(nextForm);
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

  const handleSaveEdit = async () => {
    if (!detail) return;
    if (detail.approvalStatus !== "PENDING") {
      setToast("승인 대기 상태에서만 수정할 수 있습니다.");
      return;
    }

    if (!editForm.name.trim()) {
      setToast("가게명을 입력해 주세요.");
      return;
    }

    if (!editForm.address.trim()) {
      setToast("주소를 입력해 주세요.");
      return;
    }

    try {
      setSaving(true);
      await updateMyRestaurantRequest(detail.id, {
        name: editForm.name.trim(),
        address: editForm.address.trim(),
        phone: editForm.phone.trim() || null,
        description: editForm.description.trim() || null,
        imageUrl: editForm.imageUrl.trim() || null,
        latitude: editForm.latitude,
        longitude: editForm.longitude,
        categoryNames: editForm.categoryText
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
      });
      setToast("신청 내용이 수정되었습니다.");
      setIsEditMode(false);
      await fetchDetail();
    } catch (error: unknown) {
      const status = (error as HttpErrorLike)?.response?.status;
      if (status === 400) {
        setToast("승인 대기 상태 신청만 수정할 수 있습니다.");
      } else if (status === 401 || status === 403) {
        setToast("로그인이 필요합니다.");
      } else {
        setToast("신청 수정에 실패했습니다.");
      }
    } finally {
      setSaving(false);
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
  const previewName = isEditMode ? editForm.name : detail?.name ?? "";
  const previewAddress = isEditMode ? editForm.address : detail?.address ?? "";
  const previewPhone = isEditMode ? editForm.phone : detail?.phone ?? "";
  const previewCategories = isEditMode
    ? editForm.categoryText
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean)
    : (detail?.categoryNames ?? []);
  const previewImageUrl = toDisplayImageUrl(
    isEditMode ? editForm.imageUrl : (detail?.imageUrl ?? detail?.representativeImageUrl ?? null),
  );
  const selectedEditCategories = useMemo(
    () =>
      editForm.categoryText
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
    [editForm.categoryText],
  );

  const toggleEditCategory = (category: string) => {
    const next = selectedEditCategories.includes(category)
      ? selectedEditCategories.filter((c) => c !== category)
      : [...selectedEditCategories, category];
    setEditForm((prev) => ({ ...prev, categoryText: next.join(", ") }));
  };
  const displayDescription = isEditMode
    ? editForm.description.trim()
    : detail?.description?.trim()
      ? detail.description.trim()
      : "";
  const descriptionHtml = useMemo(() => {
    const raw = displayDescription;
    if (!raw) return "<p>-</p>";
    const hasHtml = /<[^>]+>/.test(raw);
    if (hasHtml) return raw;
    const escaped = raw
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
    return `<p>${escaped.replace(/\n/g, "<br/>")}</p>`;
  }, [displayDescription]);

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
            {isEditMode ? (
              <Stack spacing={2}>
                <TextField
                  label="가게명"
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  fullWidth
                  required
                />
                <TextField
                  label="주소"
                  value={editForm.address}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, address: e.target.value }))}
                  fullWidth
                  required
                />
                <Box
                  ref={mapContainerRef}
                  sx={{
                    width: "100%",
                    height: 250,
                    borderRadius: 1,
                    border: "1px solid #e8e8e8",
                    overflow: "hidden",
                    backgroundColor: "#fafafa",
                  }}
                />
                <Box>
                  <Button size="small" variant="outlined" endIcon={<OpenInNewIcon />} onClick={openMap}>
                    지도에서 크게 보기
                  </Button>
                </Box>
                <TextField
                  label="전화번호"
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      phone: e.target.value.replace(/[^0-9-]/g, "").slice(0, 13),
                    }))
                  }
                  fullWidth
                  placeholder="숫자와 - 입력 (예: 02-123-4567)"
                  inputProps={{ inputMode: "tel", pattern: "[0-9-]*", maxLength: 13 }}
                  helperText="숫자와 하이픈(-)만 입력 가능합니다."
                />
                <Stack spacing={1}>
                  <Typography sx={{ fontWeight: 700, fontSize: 14 }}>카테고리</Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {CATEGORY_OPTIONS.map((category) => {
                      const selected = selectedEditCategories.includes(category);
                      return (
                        <Chip
                          key={category}
                          clickable
                          label={category}
                          onClick={() => toggleEditCategory(category)}
                          sx={{
                            borderRadius: 1.2,
                            fontWeight: 600,
                            bgcolor: selected ? "#ff8a3d" : "#fff",
                            color: selected ? "#fff" : "#444",
                            border: `1px solid ${selected ? "#ff8a3d" : "#ddd"}`,
                          }}
                        />
                      );
                    })}
                  </Box>
                </Stack>
              </Stack>
            ) : (
              <Stack spacing={0.9}>
                <InfoRow label="주소" value={detail.address || "-"} />
                <Box
                  ref={mapContainerRef}
                  sx={{
                    mt: 0.5,
                    width: "100%",
                    height: 250,
                    borderRadius: 1,
                    border: "1px solid #e8e8e8",
                    overflow: "hidden",
                    backgroundColor: "#fafafa",
                  }}
                />
                <Box sx={{ pl: { xs: 0, sm: 12.5 } }}>
                  <Button size="small" variant="outlined" endIcon={<OpenInNewIcon />} onClick={openMap}>
                    지도에서 크게 보기
                  </Button>
                </Box>
                <InfoRow label="전화번호" value={detail.phone || "-"} />
                <InfoRow
                  label="카테고리"
                  value={detail.categoryNames?.length ? detail.categoryNames.join(", ") : "-"}
                />
              </Stack>
            )}
            <Stack spacing={0.9}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={0.7}>
                <Typography sx={{ width: { xs: "100%", sm: 100 }, color: "#666", fontSize: 14 }}>
                  대표사진
                </Typography>
                <Box sx={{ flex: 1 }}>
                  {displayImageUrl ? (
                    <Box
                      component="img"
                      src={displayImageUrl}
                      alt="대표사진"
                      onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                        const img = e.currentTarget;
                        if (img.src.includes("/images/world.jpg")) return;
                        img.src = "/images/world.jpg";
                      }}
                      sx={{
                        width: 240,
                        maxWidth: "100%",
                        height: 150,
                        objectFit: "cover",
                        borderRadius: 1,
                        border: "1px solid #e8e8e8",
                      }}
                    />
                  ) : (
                    <Typography sx={{ color: "#222", fontSize: 14 }}>없음</Typography>
                  )}
                </Box>
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={0.7}>
                <Typography sx={{ width: { xs: "100%", sm: 100 }, color: "#666", fontSize: 14 }}>
                  설명
                </Typography>
                <Box
                  sx={{
                    flex: 1,
                    "& .ql-editor": { padding: 0 },
                    "& .ql-editor img": { maxWidth: "100%", height: "auto" },
                    "& .ql-editor iframe, & .ql-editor video": { maxWidth: "100%" },
                    "& .ql-editor table": {
                      width: "100%",
                      borderCollapse: "collapse",
                      margin: "12px 0",
                    },
                    "& .ql-editor td, & .ql-editor th": {
                      border: "1px solid #d9d9d9",
                      padding: "8px 10px",
                      verticalAlign: "top",
                    },
                  }}
                >
                  {isEditMode ? (
                    <ReactQuill
                      theme="snow"
                      value={editForm.description}
                      onChange={(value) => setEditForm((prev) => ({ ...prev, description: value }))}
                      modules={{
                        toolbar: [
                          [{ header: [1, 2, false] }],
                          ["bold", "italic", "underline"],
                          [{ list: "ordered" }, { list: "bullet" }],
                          ["link", "image"],
                          ["clean"],
                        ],
                      }}
                    />
                  ) : (
                    <ReactQuill theme="bubble" readOnly modules={{ toolbar: false }} value={descriptionHtml} />
                  )}
                </Box>
              </Stack>
            </Stack>

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
              <Button variant="outlined" onClick={() => navigate("/register/requests")}>목록으로</Button>
              <Button variant="outlined" onClick={() => setIsPreviewOpen(true)}>
                미리보기
              </Button>
              {detail.approvalStatus === "PENDING" && !isEditMode && (
                <Button
                  variant="outlined"
                  onClick={() =>
                    navigate(`/register?editRequestId=${detail.id}`)
                  }
                >
                  수정
                </Button>
              )}
              {detail.approvalStatus === "PENDING" && isEditMode && (
                <>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setIsEditMode(false);
                      setEditForm(buildEditForm(detail));
                    }}
                  >
                    수정 취소
                  </Button>
                  <Button
                    variant="contained"
                    disabled={saving}
                    onClick={() => void handleSaveEdit()}
                  >
                    {saving ? "저장 중..." : "수정 저장"}
                  </Button>
                </>
              )}
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

      <Dialog
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>맛집 소개 미리보기</DialogTitle>
        <DialogContent dividers>
          {detail?.approvalStatus !== "APPROVED" && (
            <Alert severity="info" sx={{ mb: 2 }}>
              현재 승인 전 상태입니다. 실제 맛집 소개 페이지에는 아직 노출되지 않습니다.
            </Alert>
          )}
          <Stack spacing={2}>
            <Card sx={{ borderRadius: 3, overflow: "hidden", border: "1px solid #ececec" }}>
              <Box
                component="img"
                src={previewImageUrl || "/images/world.jpg"}
                alt="미리보기 대표사진"
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                  const img = e.currentTarget;
                  if (img.src.includes("/images/world.jpg")) return;
                  img.src = "/images/world.jpg";
                }}
                sx={{
                  width: "100%",
                  height: { xs: 220, sm: 300 },
                  objectFit: "cover",
                }}
              />
            </Card>

            <Card sx={{ borderRadius: 3, border: "1px solid #ececec" }}>
              <CardContent>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  {previewName || "-"}
                </Typography>

                <Box sx={{ mt: 1.5, display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {(previewCategories.length ? previewCategories : ["-"]).map((category) => (
                    <Chip key={category} label={category} color="primary" size="small" />
                  ))}
                </Box>

                <Typography sx={{ color: "#666", mt: 2 }}>
                  {previewAddress || "-"}
                </Typography>
                <Typography sx={{ color: "#666", mt: 0.5 }}>
                  전화번호: {previewPhone || "-"}
                </Typography>

                <Box
                  sx={{
                    mt: 2,
                    "& .ql-editor": { padding: 0 },
                    "& .ql-editor img": { maxWidth: "100%", height: "auto" },
                    "& .ql-editor iframe, & .ql-editor video": { maxWidth: "100%" },
                    "& .ql-editor table": {
                      width: "100%",
                      borderCollapse: "collapse",
                      margin: "12px 0",
                    },
                    "& .ql-editor td, & .ql-editor th": {
                      border: "1px solid #d9d9d9",
                      padding: "8px 10px",
                      verticalAlign: "top",
                    },
                  }}
                >
                  <ReactQuill
                    theme="bubble"
                    readOnly
                    modules={{ toolbar: false }}
                    value={descriptionHtml}
                  />
                </Box>
              </CardContent>
            </Card>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsPreviewOpen(false)}>닫기</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
