import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Box,
  // Button,
  Card,
  CardContent,
  Chip,
  Menu,
  MenuItem,
  Select,
  Snackbar,
  TextField,
  Paper,
  Pagination,
  IconButton,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import axios from "../common/axios";
import { inputHeightSx, INPUT_HEIGHT } from "../common/utils/helperUtil";
// import { useAuth } from "../common/context/useAuth";
import { ThemeProvider } from "@mui/material/styles";
import { blogTheme } from "./theme/blogTheme";

// type CategoryType = "ALL" | "NOTICE" | "REVIEW";

interface BlogPost {
  id: number;
  title: string;
  content?: string;
  contentHtml?: string;
  contentDelta?: unknown;
  blogType: "NOTICE" | "REVIEW";
  authorNickname: string;
  createdAt?: string;
  viewCount: number;
  recommendCount: number;
  commentCount: number;
  hasImage?: boolean;
  hasVideo?: boolean;
  imageUrl?: string | null;
  videoUrl?: string | null;
  mediaType?: string | null;
  mediaUrls?: string[] | null;
}

interface BlogLikePayload extends Omit<BlogPost, "hasImage" | "hasVideo"> {
  hasImage?: unknown;
  hasVideo?: unknown;
}

const toBoolean = (value: unknown): boolean =>
  value === true || value === "true" || value === 1 || value === "1";

const normalizeBlog = (blog: BlogLikePayload): BlogPost => ({
  ...blog,
  hasImage: toBoolean(blog?.hasImage),
  hasVideo: toBoolean(blog?.hasVideo),
});

const getPostHtml = (post: BlogPost) => post.contentHtml ?? post.content ?? "";

export default function BlogPage() {
  // const { user } = useAuth();
  const ACCENT = "#4F9FFA";

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const category = "ALL";
  // const [category, setCategory] = useState<CategoryType>("ALL");
  const [keyword, setKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(8);
  const [toast, setToast] = useState("");
  const [searchType, setSearchType] = useState("TITLE_CONTENT");
  const [appliedSearchType, setAppliedSearchType] = useState("TITLE_CONTENT");
  const [authorAnchor, setAuthorAnchor] = useState<null | HTMLElement>(null);
  const [selectedAuthor, setSelectedAuthor] = useState("");

  useEffect(() => {
    const fetchBlogs = async () => {
      const res = await axios.get("/api/spring/blogs", {
        params: {
          page,
          size,
          type: category === "ALL" ? null : category,
          keyword: appliedKeyword,
          searchType: appliedSearchType,
        },
      });

      const data = res.data.data;
      const notices = (data.notices ?? []).filter(Boolean).map(normalizeBlog);
      const contents = (data.contents ?? []).filter(Boolean).map(normalizeBlog);

      if (category === "ALL") {
        setPosts([...notices, ...contents]);
      } else if (category === "NOTICE") {
        setPosts(notices);
      } else {
        setPosts(contents);
      }

      const computedTotalPages = Math.ceil(
        (data.totalElements ?? 0) / (data.size ?? size),
      );
      setTotalPages(Math.max(1, computedTotalPages));
    };

    fetchBlogs();
  }, [page, category, appliedKeyword, size, appliedSearchType]);

  const getBlogType = (post?: BlogPost) => post?.blogType ?? "";

  const getBlogLabel = (post: BlogPost) => {
    if (post.blogType === "NOTICE") return "공지";
    if (post.blogType === "REVIEW") return "후기";
    return "-";
  };

  const getThumbnailUrl = (post: BlogPost) => {
    if (post.imageUrl?.trim()) {
      return post.imageUrl.trim();
    }

    const content = getPostHtml(post);
    const match = content.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/i);
    return match?.[1] ?? "";
  };

  const handleSearch = () => {
    if (!keyword.trim()) {
      setToast("검색어를 입력해주세요.");
      return;
    }
    setPage(0);
    setAppliedKeyword(keyword);
    setAppliedSearchType(searchType);
  };

  const openAuthorMenu = (e: React.MouseEvent<HTMLElement>, author: string) => {
    setAuthorAnchor(e.currentTarget as HTMLElement);
    setSelectedAuthor(author);
  };

  const closeAuthorMenu = () => setAuthorAnchor(null);

  // const handleWriteClick = () => {
  //   if (!user) {
  //     setToast("로그인이 필요합니다.");
  //     return;
  //   }
  //   navigate("/blog/write");
  // };

  return (
    <ThemeProvider theme={blogTheme}>
      <Box
        sx={{
          maxWidth: 1100,
          mx: "auto",
          py: 5,
          px: { xs: 2, sm: 3 },
        }}
      >
        {/* 페이지 타이틀 */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: "#1a1a1a",
              letterSpacing: "-0.02em",
              mb: 0.5,
            }}
          >
            맛집 이야기
          </Typography>
          <Typography sx={{ fontSize: 14, color: "#64748b" }}>
            맛집 후기와 추천을 함께 나눠요
          </Typography>
        </Box>

        {/* 검색 영역 */}
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
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1.5,
              alignItems: "center",
            }}
          >
            <Select
              size="small"
              value={searchType}
              onChange={(e) => setSearchType(String(e.target.value))}
              sx={{
                width: 120,
                bgcolor: "#fff",
                borderRadius: 1,
                ...inputHeightSx,
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(0,0,0,0.08)",
                },
              }}
            >
              <MenuItem value="TITLE_CONTENT">제목+내용</MenuItem>
              <MenuItem value="TITLE">제목</MenuItem>
              <MenuItem value="CONTENT">내용</MenuItem>
              <MenuItem value="AUTHOR">글쓴이</MenuItem>
              <MenuItem value="COMMENT">댓글</MenuItem>
            </Select>

            <TextField
              size="small"
              placeholder="검색어 입력"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              sx={{
                width: { xs: "100%", sm: 280 },
                flex: "1 1 200px",
                "& .MuiOutlinedInput-root": {
                  bgcolor: "#fff",
                  borderRadius: 1,
                  height: INPUT_HEIGHT,
                  minHeight: INPUT_HEIGHT,
                },
              }}
            />

            <IconButton
              sx={{
                bgcolor: ACCENT,
                color: "#fff",
                "&:hover": { bgcolor: "#e55f00", transform: "scale(1.02)" },
                transition: "all 0.2s",
              }}
              onClick={handleSearch}
            >
              <SearchIcon />
            </IconButton>

            <Select
              size="small"
              value={size}
              onChange={(e) => {
                setSize(Number(e.target.value));
                setPage(0);
              }}
              sx={{
                width: 90,
                ml: "auto",
                bgcolor: "#fff",
                borderRadius: 1,
                ...inputHeightSx,
              }}
            >
              <MenuItem value={8}>8개</MenuItem>
              <MenuItem value={10}>10개</MenuItem>
              <MenuItem value={30}>30개</MenuItem>
              <MenuItem value={50}>50개</MenuItem>
              <MenuItem value={100}>100개</MenuItem>
            </Select>
          </Box>
        </Paper>

        {posts.length === 0 ? (
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
            아직 등록된 글이 없습니다.
          </Paper>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                md: "repeat(4, minmax(0, 1fr))",
              },
              gap: 2,
            }}
          >
            {posts.map((post) => {
              const type = getBlogType(post);
              const thumbnailUrl = getThumbnailUrl(post);

              return (
                <Card
                  key={post.id}
                  component={Link}
                  to={`/blog/${post.id}`}
                  variant="outlined"
                  sx={{
                    border: "1px solid",
                    borderColor: "rgba(0,0,0,0.06)",
                    borderRadius: 2,
                    cursor: "pointer",
                    overflow: "hidden",
                    textDecoration: "none",
                    color: "inherit",
                    transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
                    "&:hover": {
                      borderColor: ACCENT,
                      boxShadow: "0 8px 24px rgba(255,107,0,0.12)",
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  <CardContent sx={{ py: 2, px: 2 }}>
                    <Box
                      sx={{
                        width: "100%",
                        height: 160,
                        borderRadius: 1.5,
                        overflow: "hidden",
                        mb: 1.5,
                        bgcolor: "#f1f5f9",
                      }}
                    >
                      {thumbnailUrl ? (
                        <Box
                          component="img"
                          src={thumbnailUrl}
                          alt="블로그 썸네일"
                          sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      ) : (
                        <Box sx={{ width: "100%", height: "100%" }} />
                      )}
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 0.9,
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Chip
                          label={getBlogLabel(post)}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: 11,
                            fontWeight: 600,
                            bgcolor: type === "NOTICE" ? ACCENT : "#64748b",
                            color: "#fff",
                            "& .MuiChip-label": { px: 1 },
                          }}
                        />
                        <Typography sx={{ fontSize: 12, color: "#94a3b8" }}>
                          #{post.id}
                        </Typography>
                      </Box>

                      <Typography sx={{ fontSize: 12, color: "#94a3b8" }}>
                        {post.createdAt
                          ? new Date(post.createdAt).toLocaleDateString("ko-KR")
                          : "-"}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        mb: 1,
                        "&:hover .blog-title": { textDecoration: "underline" },
                      }}
                    >
                      <Typography
                        className="blog-title"
                        sx={{
                          flex: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          fontWeight: type === "NOTICE" ? 700 : 500,
                        }}
                      >
                        {post.title}
                      </Typography>

                      {post.commentCount > 0 && (
                        <Typography sx={{ fontSize: 13, color: "#94a3b8" }}>
                          [{post.commentCount}]
                        </Typography>
                      )}
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Box
                        component="span"
                        sx={{
                          fontSize: 13,
                          color: "#64748b",
                          cursor: "pointer",
                          "&:hover": {
                            color: ACCENT,
                            textDecoration: "underline",
                          },
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openAuthorMenu(e, post.authorNickname);
                        }}
                      >
                        {post.authorNickname}
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          gap: 1.5,
                          color: "#94a3b8",
                          fontSize: 13,
                        }}
                      >
                        <Typography sx={{ fontSize: 13 }}>
                          조회 {post.viewCount}
                        </Typography>
                        <Typography sx={{ fontSize: 13 }}>
                          추천 {post.recommendCount}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}

        <Menu
          anchorEl={authorAnchor}
          open={Boolean(authorAnchor)}
          onClose={closeAuthorMenu}
        >
          <MenuItem onClick={() => alert(`${selectedAuthor} 글 보기`)}>
            글
          </MenuItem>
          <MenuItem onClick={() => alert(`${selectedAuthor} 댓글 보기`)}>
            댓글
          </MenuItem>
          <MenuItem onClick={() => alert(`${selectedAuthor} 작성글 검색`)}>
            작성글 검색
          </MenuItem>
        </Menu>

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            mt: 4,
            "& .MuiPaginationItem-root": {
              fontSize: 14,
            },
            "& .Mui-selected": {
              bgcolor: ACCENT,
              color: "#fff",
              "&:hover": { bgcolor: "#e55f00" },
            },
          }}
        >
          <Pagination
            count={posts.length === 0 ? 1 : totalPages}
            page={page + 1}
            disabled={posts.length === 0}
            onChange={(_, v) => setPage(v - 1)}
            color="standard"
            shape="rounded"
          />
        </Box>
      </Box>

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={1500}
        message={toast}
        onClose={() => setToast("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </ThemeProvider>
  );
}
