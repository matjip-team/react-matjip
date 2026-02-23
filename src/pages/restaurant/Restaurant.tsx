import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "../common/axios";
import ReactQuill, { Quill } from "react-quill-new";
import "react-quill-new/dist/quill.bubble.css";
import "quill-table-better/dist/quill-table-better.css";
import { registerBlogQuillModules } from "../blog/quillSetup";

import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  Rating,
  TextField,
  Divider,
  IconButton,
} from "@mui/material";

import FavoriteIcon from "@mui/icons-material/Favorite";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

registerBlogQuillModules(Quill);

interface Review {
  id: number;
  nickname: string;
  rating: number;
  content: string;
  mine?: boolean;
}

interface RestaurantDetail {
  id: number;
  name: string;
  address: string;
  phone?: string;
  description: string;
  imageUrl?: string;
  categories: string[];
  averageRating: number;
  reviewCount: number;
  reviews: Review[];
  likeCount: number;
  liked: boolean;
}

const S3_PUBLIC_BASE_URL =
  (import.meta.env.VITE_S3_PUBLIC_BASE_URL as string | undefined)?.replace(/\/$/, "") ??
  "https://matjip-board-images-giduon-2026.s3.ap-northeast-2.amazonaws.com";

const ACCENT = "#ff6b00";

const toDisplayImageUrl = (value?: string | null): string | null => {
  const raw = value?.trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw) || raw.startsWith("/")) return raw;
  return `${S3_PUBLIC_BASE_URL}/${raw.replace(/^\/+/, "")}`;
};

export default function Restaurant() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const navState = location.state as
    | { fromMyPageTab?: number; fromHomepage?: boolean; page?: number; keyword?: string; category?: string }
    | null;
  const fromMyPageTab = navState?.fromMyPageTab;
  const fromHomepage = navState?.fromHomepage;
  const homepagePage = navState?.page ?? 0;
  const homepageKeyword = navState?.keyword ?? "";
  const homepageCategory = navState?.category ?? "전체";

  const [store, setStore] = useState<RestaurantDetail | null>(null);
  const [myRating, setMyRating] = useState<number | null>(0);
  const [reviewText, setReviewText] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRating, setEditRating] = useState<number | null>(0);
  const [editText, setEditText] = useState("");

  const descriptionHtml = useMemo(() => {
    const raw = store?.description ?? "";
    const hasHtml = /<[^>]+>/.test(raw);
    if (hasHtml) {
      return raw;
    }
    const escaped = raw
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
    return `<p>${escaped.replace(/\n/g, "<br/>")}</p>`;
  }, [store?.description]);

  useEffect(() => {
    if (!id) return;

    const fetchDetail = async () => {
      const res = await axios.get(`/api/spring/restaurants/${id}`);
      setStore(res.data.data);
    };

    fetchDetail();
  }, [id]);

  const refresh = async () => {
    const res = await axios.get(`/api/spring/restaurants/${id}`);
    setStore(res.data.data);
  };

  /* 좋아요 */
  const toggleLike = async () => {
    if (!store) return;

    if (store.liked) {
      await axios.delete(`/api/spring/restaurants/${id}/likes`);
    } else {
      await axios.post(`/api/spring/restaurants/${id}/likes`);
    }

    refresh();
  };

  /* 이미 내 리뷰가 있는지 확인 (같은 사용자 중복 등록 방지) */
  const hasMyReview = store ? store.reviews.some((r) => r.mine) : false;

  /* 리뷰 등록 */
  const submitReview = async () => {
    if (hasMyReview) {
      alert("이미 리뷰를 작성하셨습니다. 수정을 원하시면 기존 리뷰에서 수정 버튼을 이용해주세요.");
      return;
    }
    if (!myRating) return alert("평점을 선택해주세요.");

    await axios.post(`/api/spring/restaurants/${id}/reviews`, {
      rating: myRating,
      content: reviewText,
    });

    setMyRating(0);
    setReviewText("");
    refresh();
  };

  /* 리뷰 삭제 */
  const deleteReview = async (reviewId: number) => {
    await axios.delete(`/api/spring/restaurants/${id}/reviews/${reviewId}`);
    refresh();
  };

  /* 리뷰 수정 */
  const saveEdit = async (reviewId: number) => {
    await axios.put(`/api/spring/restaurants/${id}/reviews/${reviewId}`, {
      rating: editRating,
      content: editText,
    });

    setEditingId(null);
    refresh();
  };

  if (!store) return null;

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", py: 5, px: { xs: 2, sm: 3 } }}>
      {/* 이미지 */}
      <Box
        sx={{
          borderRadius: 2,
          overflow: "hidden",
          border: "1px solid",
          borderColor: "rgba(0,0,0,0.06)",
        }}
      >
        <Box
          component="img"
          src={toDisplayImageUrl(store.imageUrl) ?? "/images/world.jpg"}
          alt={store.name}
          onError={(e) => {
            const img = e.currentTarget;
            if (img.src.includes("/images/world.jpg")) return;
            img.src = "/images/world.jpg";
          }}
          sx={{ width: "100%", height: { xs: 240, sm: 320 }, objectFit: "cover", display: "block" }}
        />
      </Box>

      {/* 가게 정보 */}
      <Paper
        elevation={0}
        sx={{
          mt: 4,
          p: 4,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "rgba(0,0,0,0.06)",
          bgcolor: "#fff",
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: "#1a1a1a",
            letterSpacing: "-0.02em",
            mb: 0.5,
          }}
        >
          {store.name}
        </Typography>

        <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 0.8 }}>
          {store.categories.map((c) => (
            <Chip
              key={c}
              label={c}
              size="small"
              sx={{
                height: 26,
                fontSize: 12,
                fontWeight: 600,
                bgcolor: ACCENT,
                color: "#fff",
                "& .MuiChip-label": { px: 1.5 },
              }}
            />
          ))}
        </Box>

        <Typography sx={{ mt: 2, fontSize: 14, color: "#64748b" }}>
          📍 {store.address}
        </Typography>

        {store.phone && (
          <Typography sx={{ mt: 0.5, fontSize: 14, color: "#64748b" }}>
            📞 {store.phone}
          </Typography>
        )}

        <Box
          sx={{
            mt: 3,
            fontSize: 15,
            lineHeight: 1.7,
            color: "#334155",
            "& .ql-editor": { padding: 0 },
            "& .ql-editor img": { maxWidth: "100%", height: "auto" },
            "& .ql-editor iframe, & .ql-editor video": { maxWidth: "100%" },
            "& .ql-editor table": {
              width: "100%",
              borderCollapse: "collapse",
              margin: "12px 0",
            },
            "& .ql-editor td, & .ql-editor th": {
              border: "1px solid #e2e8f0",
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

        <Box sx={{ mt: 3, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          <Rating
            value={store.averageRating}
            precision={0.5}
            readOnly
            sx={{
              "& .MuiRating-iconFilled": { color: ACCENT },
              "& .MuiRating-iconHover": { color: ACCENT },
            }}
          />
          <Typography sx={{ fontSize: 14, color: "#64748b" }}>
            {store.averageRating}점 · 리뷰 {store.reviewCount}개
          </Typography>
        </Box>

        <Button
          variant={store.liked ? "contained" : "outlined"}
          startIcon={<FavoriteIcon />}
          sx={{
            mt: 3,
            borderRadius: 1.5,
            fontWeight: 600,
            textTransform: "none",
            ...(store.liked
              ? { bgcolor: ACCENT, "&:hover": { bgcolor: "#e55f00" } }
              : {
                  borderColor: ACCENT,
                  color: ACCENT,
                  "&:hover": { borderColor: "#e55f00", color: "#e55f00", bgcolor: "rgba(255,107,0,0.04)" },
                }),
          }}
          onClick={toggleLike}
        >
          좋아요 {store.likeCount}
        </Button>
      </Paper>

      {/* 리뷰 작성 */}
      <Paper
        elevation={0}
        sx={{
          mt: 4,
          p: 4,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "rgba(0,0,0,0.06)",
          bgcolor: "#fff",
        }}
      >
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, color: "#1a1a1a", mb: 0.5 }}
        >
          리뷰 작성
        </Typography>

        {hasMyReview && (
          <Typography sx={{ mt: 1, fontSize: 14, color: "#64748b" }}>
            이미 이 맛집에 리뷰를 작성하셨습니다. 수정은 아래 리뷰 목록에서 할 수 있습니다.
          </Typography>
        )}

        <Box sx={{ mt: 2 }}>
          <Rating
            value={myRating}
            onChange={(_, value) => setMyRating(value)}
            disabled={hasMyReview}
            sx={{
              "& .MuiRating-iconFilled": { color: ACCENT },
              "& .MuiRating-iconHover": { color: ACCENT },
            }}
          />
        </Box>

        <TextField
          fullWidth
          multiline
          rows={4}
          sx={{
            mt: 2,
            "& .MuiOutlinedInput-root": {
              borderRadius: 1.5,
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: ACCENT,
                borderWidth: 2,
              },
            },
          }}
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder={hasMyReview ? "이미 리뷰를 작성하셨습니다." : "리뷰를 작성해주세요."}
          disabled={hasMyReview}
        />

        <Button
          variant="contained"
          sx={{
            mt: 2,
            borderRadius: 1.5,
            fontWeight: 600,
            textTransform: "none",
            bgcolor: ACCENT,
            "&:hover": { bgcolor: "#e55f00" },
          }}
          onClick={submitReview}
          disabled={hasMyReview}
        >
          리뷰 등록
        </Button>
      </Paper>

      {/* 리뷰 목록 */}
      <Paper
        elevation={0}
        sx={{
          mt: 4,
          p: 4,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "rgba(0,0,0,0.06)",
          bgcolor: "#fff",
        }}
      >
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, color: "#1a1a1a", mb: 2 }}
        >
          리뷰 {store.reviews.length > 0 && `(${store.reviews.length})`}
        </Typography>

        {store.reviews.length === 0 && (
          <Typography sx={{ py: 4, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
            아직 작성된 리뷰가 없습니다.
          </Typography>
        )}

        {store.reviews.map((review, index) => (
          <Box key={review.id}>
            {index > 0 && <Divider sx={{ my: 2, borderColor: "rgba(0,0,0,0.06)" }} />}

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 600, color: "#1a1a1a", mb: 0.5 }}>
                  {review.nickname}
                </Typography>
                <Rating
                  value={review.rating}
                  readOnly
                  size="small"
                  sx={{ "& .MuiRating-iconFilled": { color: ACCENT } }}
                />
                {editingId === review.id ? (
                  <Box sx={{ mt: 2 }}>
                    <Rating
                      value={editRating}
                      onChange={(_, value) => setEditRating(value)}
                      sx={{
                        mb: 1,
                        "& .MuiRating-iconFilled": { color: ACCENT },
                        "& .MuiRating-iconHover": { color: ACCENT },
                      }}
                    />
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      size="small"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      sx={{
                        "& .MuiOutlinedInput-root": { borderRadius: 1.5 },
                      }}
                    />
                    <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
                      <Button
                        variant="contained"
                        size="small"
                        sx={{
                          borderRadius: 1.5,
                          fontWeight: 600,
                          bgcolor: ACCENT,
                          "&:hover": { bgcolor: "#e55f00" },
                        }}
                        onClick={() => saveEdit(review.id)}
                      >
                        저장
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        sx={{ borderRadius: 1.5 }}
                        onClick={() => setEditingId(null)}
                      >
                        취소
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <>
                    <Typography sx={{ mt: 1, fontSize: 14, color: "#475569", lineHeight: 1.6 }}>
                      {review.content}
                    </Typography>

                    {review.mine && (
                      <Box sx={{ mt: 1, display: "flex", gap: 0.5 }}>
                        <IconButton
                          size="small"
                          sx={{ color: "#64748b", "&:hover": { color: ACCENT } }}
                          onClick={() => {
                            setEditingId(review.id);
                            setEditRating(review.rating);
                            setEditText(review.content);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>

                        <IconButton
                          size="small"
                          sx={{ color: "#64748b", "&:hover": { color: "#dc2626" } }}
                          onClick={() => deleteReview(review.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                  </>
                )}
              </Box>
            </Box>
          </Box>
        ))}
      </Paper>

      {/* 뒤로 가기 */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
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
          onClick={() => {
            if (fromMyPageTab !== undefined) {
              navigate(`/auth/mypage?tab=${fromMyPageTab}`, { replace: true });
            } else if (fromHomepage) {
              const params = new URLSearchParams();
              params.set("page", String(homepagePage + 1));
              if (homepageKeyword) params.set("keyword", homepageKeyword);
              if (homepageCategory && homepageCategory !== "전체") params.set("category", homepageCategory);
              navigate(`/?${params.toString()}`, { replace: true });
            } else {
              navigate(-1);
            }
          }}
        >
          뒤로 가기
        </Button>
      </Box>
    </Box>
  );
}
