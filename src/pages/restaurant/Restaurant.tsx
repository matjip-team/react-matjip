import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "../common/axios";

import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Rating,
  TextField,
  Divider,
  IconButton
} from "@mui/material";

import FavoriteIcon from "@mui/icons-material/Favorite";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

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

  useEffect(() => {
    if (!id) return;

    const fetchDetail = async () => {
      const res = await axios.get(`/api/restaurants/${id}`);
      setStore(res.data.data);
    };

    fetchDetail();
  }, [id]);

  const refresh = async () => {
    const res = await axios.get(`/api/restaurants/${id}`);
    setStore(res.data.data);
  };

  /* 좋아요 */
  const toggleLike = async () => {
    if (!store) return;

    if (store.liked) {
      await axios.delete(`/api/restaurants/${id}/likes`);
    } else {
      await axios.post(`/api/restaurants/${id}/likes`);
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

    await axios.post(`/api/restaurants/${id}/reviews`, {
      rating: myRating,
      content: reviewText,
    });

    setMyRating(0);
    setReviewText("");
    refresh();
  };

  /* 리뷰 삭제 */
  const deleteReview = async (reviewId: number) => {
    await axios.delete(`/api/restaurants/${id}/reviews/${reviewId}`);
    refresh();
  };

  /* 리뷰 수정 */
  const saveEdit = async (reviewId: number) => {
    await axios.put(`/api/restaurants/${id}/reviews/${reviewId}`, {
      rating: editRating,
      content: editText,
    });

    setEditingId(null);
    refresh();
  };

  if (!store) return null;

  return (
    <Container maxWidth="md" sx={{ mt: 5, mb: 8 }}>
      {/* 이미지 카드 */}
      <Card sx={{ borderRadius: 4, overflow: "hidden" }}>
        <img
          src={store.imageUrl ?? "/images/world.jpg"}
          alt={store.name}
          style={{ width: "100%", height: 360, objectFit: "cover" }}
        />
      </Card>

      {/* 가게 정보 */}
      <Card sx={{ mt: 4, borderRadius: 4 }}>
        <CardContent>
          <Typography variant="h4" fontWeight={700}>
            {store.name}
          </Typography>

          <Box sx={{ mt: 2 }}>
            {store.categories.map((c) => (
              <Chip key={c} label={c} sx={{ mr: 1 }} color="primary" />
            ))}
          </Box>

          <Typography color="text.secondary" sx={{ mt: 2 }}>
            {store.address}
          </Typography>

          {store.phone && (
            <Typography color="text.secondary" sx={{ mt: 1 }}>
               📞{store.phone}
            </Typography>
          )}

          <Typography sx={{ mt: 3 }}>
            {store.description}
          </Typography>

          <Box sx={{ mt: 3, display: "flex", alignItems: "center", gap: 2 }}>
            <Rating value={store.averageRating} precision={0.5} readOnly />
            <Typography>
              {store.averageRating}점 ({store.reviewCount} 리뷰)
            </Typography>
          </Box>

          <Button
            variant={store.liked ? "contained" : "outlined"}
            color="primary"
            startIcon={<FavoriteIcon />}
            sx={{ mt: 3, borderRadius: 3 }}
            onClick={toggleLike}
          >
            좋아요 {store.likeCount}
          </Button>
        </CardContent>
      </Card>

      {/* 리뷰 작성 */}
      <Card sx={{ mt: 5, borderRadius: 4 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600}>
            리뷰 작성
          </Typography>

          {hasMyReview && (
            <Typography color="text.secondary" sx={{ mt: 1, fontSize: 14 }}>
              이미 이 맛집에 리뷰를 작성하셨습니다. 수정은 아래 리뷰 목록에서 할 수 있습니다.
            </Typography>
          )}

          <Rating
            value={myRating}
            onChange={(_, value) => setMyRating(value)}
            sx={{ mt: 2 }}
            disabled={hasMyReview}
          />

          <TextField
            fullWidth
            multiline
            rows={4}
            sx={{ mt: 2 }}
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder={hasMyReview ? "이미 리뷰를 작성하셨습니다." : "리뷰를 작성해주세요."}
            disabled={hasMyReview}
          />

          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 2, borderRadius: 3 }}
            onClick={submitReview}
            disabled={hasMyReview}
          >
            리뷰 등록
          </Button>
        </CardContent>
      </Card>

      {/* 리뷰 목록 */}
      <Card sx={{ mt: 5, borderRadius: 4 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600}>
            리뷰
          </Typography>

          {store.reviews.length === 0 && (
            <Typography sx={{ mt: 2 }}>
              아직 작성된 리뷰가 없습니다.
            </Typography>
          )}

          {store.reviews.map((review) => (
            <Box key={review.id} sx={{ mt: 3 }}>
              <Divider sx={{ mb: 2 }} />

              <Typography fontWeight={600}>
                {review.nickname}
              </Typography>

              <Rating value={review.rating} readOnly size="small" />

              {editingId === review.id ? (
                <>
                  <Rating
                    value={editRating}
                    onChange={(_, value) => setEditRating(value)}
                    sx={{ mt: 1 }}
                  />
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    sx={{ mt: 1 }}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                  />
                  <Button
                    variant="contained"
                    sx={{ mt: 1 }}
                    onClick={() => saveEdit(review.id)}
                  >
                    저장
                  </Button>
                </>
              ) : (
                <>
                  <Typography sx={{ mt: 1 }}>
                    {review.content}
                  </Typography>

                  {review.mine && (
                    <Box sx={{ mt: 1 }}>
                      <IconButton
                        color="primary"
                        onClick={() => {
                          setEditingId(review.id);
                          setEditRating(review.rating);
                          setEditText(review.content);
                        }}
                      >
                        <EditIcon />
                      </IconButton>

                      <IconButton
                        color="error"
                        onClick={() => deleteReview(review.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  )}
                </>
              )}
            </Box>
          ))}
        </CardContent>
      </Card>

      {/* 뒤로 가기 */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
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
          sx={{ borderRadius: 2 }}
        >
          뒤로 가기
        </Button>
      </Box>
    </Container>
  );
}
