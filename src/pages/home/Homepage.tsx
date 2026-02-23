import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Chip,
  Pagination,
  Skeleton,
  TextField,
  Typography,
} from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import SearchIcon from "@mui/icons-material/Search";
import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "../common/axios";
import { useAuth } from "../common/context/useAuth";
import { INPUT_HEIGHT } from "../common/utils/helperUtil";

const categories = [
  { label: "전체", value: "전체" },
  { label: "한식", value: "한식" },
  { label: "양식", value: "양식" },
  { label: "고기/구이", value: "고기/구이" },
  { label: "씨푸드", value: "씨푸드" },
  { label: "일중/세계음식", value: "일중/세계음식" },
  { label: "비건", value: "비건" },
  { label: "카페/디저트", value: "카페/디저트" },
];

interface Restaurant {
  id: number;
  name: string;
  address: string;
  category: string;
  imageUrl?: string;
  likeCount: number;
  liked: boolean;
  approvalStatus?: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
}

interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

type SearchParams = {
  categories?: string;
  keyword?: string;
  page?: number;
  size?: number;
  status?: "APPROVED";
};

const S3_PUBLIC_BASE_URL =
  (import.meta.env.VITE_S3_PUBLIC_BASE_URL as string | undefined)?.replace(/\/$/, "") ??
  "https://matjip-board-images-giduon-2026.s3.ap-northeast-2.amazonaws.com";

const ACCENT = "#ff6b00";

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&q=80",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920&q=80",
  "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=1920&q=80",
];

const toDisplayImageUrl = (value?: string | null): string | null => {
  const raw = value?.trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw) || raw.startsWith("/")) return raw;
  return `${S3_PUBLIC_BASE_URL}/${raw.replace(/^\/+/, "")}`;
};

export default function HomePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const pageParam = Math.max(0, (Number(searchParams.get("page")) || 1) - 1);
  const keywordParam = searchParams.get("keyword") ?? "";
  const categoryParam = searchParams.get("category") ?? "전체";

  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [stores, setStores] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState(keywordParam);
  const [page, setPage] = useState(pageParam);
  const [totalPages, setTotalPages] = useState(0);
  const [heroIndex, setHeroIndex] = useState(0);

  // URL 파라미터 변경 시 상태 동기화 (뒤로가기 등)
  useEffect(() => {
    setPage(pageParam);
    setKeyword(keywordParam);
    setSelectedCategory(categoryParam);
  }, [pageParam, keywordParam, categoryParam]);

  // 히어로 배경 3장 스무스 전환
  useEffect(() => {
    const id = setInterval(() => setHeroIndex((i) => (i + 1) % HERO_IMAGES.length), 5000);
    return () => clearInterval(id);
  }, []);

  /* ===================== 맛집 조회 ===================== */
  const fetchRestaurants = useCallback(
    async (overrides?: { page?: number }) => {
      setLoading(true);
      const usePage = overrides?.page ?? page;

      try {
        const params: SearchParams = {
          page: usePage,
          size: 9,
          status: "APPROVED",
        };

      if (selectedCategory !== "전체") {
        params.categories = selectedCategory;
      }

      const trimmed = keyword.trim();
      if (trimmed !== "") {
        params.keyword = trimmed;
      }

      const res = await axios.get("/api/spring/restaurants", { params });
      const data: PageResponse<Restaurant> = res.data.data;

      const approvedOnly = (data.content ?? []).filter(
        (item) => !item.approvalStatus || item.approvalStatus === "APPROVED",
      );
      setStores(approvedOnly);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("맛집 조회 실패", error);
    } finally {
      setLoading(false);
    }
    },
    [selectedCategory, keyword, page],
  );

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  /* ===================== 좋아요 토글 ===================== */
  const toggleLike = async (storeId: number) => {
    if (!user) {
      alert("로그인이 필요합니다.");
      navigate("/auth/login");
      return;
    }

    const target = stores.find((s) => s.id === storeId);
    if (!target) return;

    // optimistic UI
    setStores((prev) =>
      prev.map((store) =>
        store.id === storeId
          ? {
              ...store,
              liked: !store.liked,
              likeCount: store.liked
                ? store.likeCount - 1
                : store.likeCount + 1,
            }
          : store
      )
    );

    try {
      if (target.liked) {
        await axios.delete(`/api/spring/restaurants/${storeId}/likes`);
      } else {
        await axios.post(`/api/spring/restaurants/${storeId}/likes`);
      }
    } catch (error) {
      console.error("좋아요 실패", error);
      fetchRestaurants();
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        backgroundColor: "#f8f9fb",
      }}
    >
      <Box
        sx={{
          maxWidth: 1100,
          mx: "auto",
          py: { xs: 3, sm: 5 },
          px: { xs: 2, sm: 3 },
        }}
      >
      {/* HERO 영역 - 3장 배경 스무스 전환 */}
      <Box
        sx={{
          height: { xs: 320, sm: 360 },
          position: "relative",
          borderRadius: 2,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          color: "#fff",
          textAlign: "center",
          mb: 3,
          overflow: "hidden",
        }}
      >
        {HERO_IMAGES.map((url, i) => (
          <Box
            key={url}
            sx={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url('${url}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              borderRadius: 2,
              opacity: heroIndex === i ? 1 : 0,
              transition: "opacity 1.2s ease-in-out",
            }}
          />
        ))}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.35), rgba(0,0,0,0.5))",
            borderRadius: 2,
          }}
        />

        <Box
          sx={{
            position: "relative",
            zIndex: 2,
            width: "100%",
            px: { xs: 2, sm: 4 },
            boxSizing: "border-box",
          }}
        >
          <Typography
            variant="h3"
            fontWeight={700}
            letterSpacing="-0.02em"
            sx={{ fontSize: { xs: "1.75rem", sm: "2.25rem", md: "2.5rem" } }}
          >
            오늘 뭐 먹지?
          </Typography>
          <Typography
            mt={1.5}
            sx={{ opacity: 0.95, fontSize: { xs: "0.95rem", sm: "1rem" } }}
          >
            지역과 취향에 맞는 맛집을 찾아보세요
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              mt: 3,
              gap: 1,
              width: "100%",
              maxWidth: 520,
              mx: "auto",
            }}
          >
            <TextField
              placeholder="맛집명, 지역명을 검색해보세요"
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPage(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") fetchRestaurants();
              }}
              size="small"
              sx={{
                flex: 1,
                backgroundColor: "#fff",
                borderRadius: 2,
                boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                "& .MuiOutlinedInput-root": {
                  height: INPUT_HEIGHT,
                  minHeight: INPUT_HEIGHT,
                  borderRadius: 2,
                  fieldset: { borderColor: "transparent" },
                  "&:hover fieldset": { borderColor: "rgba(0,0,0,0.12)" },
                  "&.Mui-focused fieldset": { borderColor: ACCENT, borderWidth: 1 },
                },
              }}
            />
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={() => {
                setPage(0);
                setSearchParams(
                  (prev) => {
                    const next = new URLSearchParams(prev);
                    next.set("page", "1");
                    if (keyword.trim()) next.set("keyword", keyword.trim());
                    else next.delete("keyword");
                    next.set("category", selectedCategory);
                    return next;
                  },
                  { replace: true },
                );
                fetchRestaurants({ page: 0 });
              }}
              sx={{
                height: INPUT_HEIGHT,
                minHeight: INPUT_HEIGHT,
                px: 2.5,
                borderRadius: 2,
                backgroundColor: ACCENT,
                boxShadow: "0 2px 12px rgba(255,107,0,0.35)",
                "&:hover": {
                  backgroundColor: "#e65f00",
                  boxShadow: "0 4px 16px rgba(255,107,0,0.4)",
                },
              }}
            >
              검색
            </Button>
          </Box>
        </Box>
      </Box>

      {/* 카테고리 */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 1,
          py: 0.5,
          mb: 2,
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.value;
          return (
            <Chip
              key={cat.value}
              label={cat.label}
              clickable
              onClick={() => {
                setSelectedCategory(cat.value);
                setPage(0);
                setSearchParams(
                  (prev) => {
                    const next = new URLSearchParams(prev);
                    next.set("category", cat.value);
                    next.set("page", "1");
                    const kw = prev.get("keyword");
                    if (kw) next.set("keyword", kw);
                    return next;
                  },
                  { replace: true },
                );
              }}
              sx={{
                py: 1,
                px: 2,
                fontWeight: 500,
                fontSize: "0.8125rem",
                borderRadius: 1.5,
                backgroundColor: isSelected ? "rgba(0,0,0,0.06)" : "transparent",
                color: isSelected ? "text.primary" : "text.secondary",
                border: "none",
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundColor: "rgba(0,0,0,0.04)",
                  color: "text.primary",
                },
              }}
            />
          );
        })}
      </Box>

      {/* 맛집 카드 */}
      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
          },
        }}
      >
        {loading
          ? Array.from({ length: 6 }).map((_, index) => (
              <Skeleton
                key={index}
                variant="rectangular"
                height={260}
                sx={{ borderRadius: 2 }}
              />
            ))
          : stores.map((store) => (
              <Card
                key={store.id}
                elevation={0}
                sx={{
                  borderRadius: 2,
                  overflow: "hidden",
                  border: "1px solid rgba(0,0,0,0.06)",
                  transition: "all 0.25s ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 12px 24px rgba(0,0,0,0.08)",
                  },
                }}
              >
                <CardActionArea
                  onClick={() =>
                    navigate(`/restaurant/${store.id}`, {
                      state: {
                        fromHomepage: true,
                        page,
                        keyword,
                        category: selectedCategory,
                      },
                    })
                  }
                >
                  <CardMedia
                    component="img"
                    height="180"
                    image={toDisplayImageUrl(store.imageUrl) ?? "/images/world.jpg"}
                    sx={{
                      width: "100%",
                      display: "block",
                      objectFit: "cover",
                    }}
                    onError={(e) => {
                      const img = e.currentTarget as HTMLImageElement;
                      if (img.src.includes("/images/world.jpg")) return;
                      img.src = "/images/world.jpg";
                    }}
                  />

                  <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 1,
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        fontWeight={600}
                        sx={{
                          lineHeight: 1.4,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {store.name}
                      </Typography>
                      <Box
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLike(store.id);
                        }}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          flexShrink: 0,
                          cursor: "pointer",
                          color: store.liked ? ACCENT : "action.disabled",
                          transition: "color 0.2s",
                          "&:hover": { color: ACCENT },
                        }}
                      >
                        <FavoriteIcon sx={{ fontSize: 20 }} />
                        <Typography variant="body2" sx={{ ml: 0.5 }}>
                          {store.likeCount}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mt: 0.5,
                        fontSize: "0.8rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {store.address}
                    </Typography>
                    <Chip
                      label={store.category}
                      size="small"
                      sx={{
                        mt: 1.5,
                        height: 24,
                        fontSize: "0.75rem",
                        backgroundColor: "rgba(255,107,0,0.08)",
                        color: ACCENT,
                        fontWeight: 600,
                      }}
                    />
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
      </Box>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 5, mb: 2 }}>
          <Pagination
            count={totalPages}
            page={page + 1}
            onChange={(_, value) => {
              const newPage = value - 1;
              setPage(newPage);
              setSearchParams(
                (prev) => {
                  const next = new URLSearchParams(prev);
                  next.set("page", String(value));
                  return next;
                },
                { replace: true },
              );
            }}
            color="primary"
            sx={{
              "& .MuiPaginationItem-root": {
                borderRadius: 1,
              },
              "& .Mui-selected": {
                backgroundColor: `${ACCENT} !important`,
                color: "#fff !important",
                "&:hover": { backgroundColor: "#e65f00 !important" },
              },
            }}
          />
        </Box>
      )}

      {!loading && stores.length === 0 && (
        <Box
          sx={{
            py: 8,
            textAlign: "center",
            color: "text.secondary",
          }}
        >
          <Typography variant="body1">
            검색 결과가 없습니다.
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.8 }}>
            다른 키워드나 카테고리로 검색해 보세요
          </Typography>
        </Box>
      )}
      </Box>
    </Box>
  );
}
