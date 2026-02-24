import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  Menu,
  MenuItem,
  Select,
  Snackbar,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination,
  IconButton,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import SmartDisplayOutlinedIcon from "@mui/icons-material/SmartDisplayOutlined";
import axios from "../common/axios";
import { useAuth } from "../common/context/useAuth";
import { inputHeightSx, INPUT_HEIGHT } from "../common/utils/helperUtil";
import { ThemeProvider } from "@mui/material/styles";
import { boardTheme } from "./theme/boardTheme";

type CategoryType = "ALL" | "공지" | "일반";

interface Board {
  id: number;
  title: string;
  content?: string;
  boardType: "NOTICE" | "REVIEW";
  authorNickname: string;
  createdAt?: string;
  viewCount: number;
  recommendCount: number;
  commentCount: number;
  hasImage?: boolean;
  hasVideo?: boolean;
  hidden?: boolean;
  reportCount?: number;
}

const ACCENT = "#ff6b00";

export default function BoardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [posts, setPosts] = useState<Board[]>([]);
  const [category, setCategory] = useState<CategoryType>("ALL");

  const [keyword, setKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");

  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [toast, setToast] = useState("");
  const [searchType, setSearchType] = useState("TITLE_CONTENT");
  const [appliedSearchType, setAppliedSearchType] = useState("TITLE_CONTENT");

  const [authorAnchor, setAuthorAnchor] = useState<null | HTMLElement>(null);
  const [selectedAuthor, setSelectedAuthor] = useState<string>("");

  useEffect(() => {
    const fetchBoards = async () => {
      const res = await axios.get("/api/spring/boards", {
        params: {
          page,
          size,
          type:
            category === "ALL"
              ? null
              : category === "공지"
              ? "NOTICE"
              : "REVIEW",
          keyword: appliedKeyword,
          searchType: appliedSearchType,
        },
      });

      const data = res.data.data;

      const isVisibleBoard = (item: Board | null | undefined): item is Board =>
        item != null && item.hidden !== true;

      const notices = (data.notices ?? []).filter(isVisibleBoard);
      const contents = (data.contents ?? []).filter(isVisibleBoard);

      if (category === "ALL") {
        setPosts([...notices, ...contents]);
      } else if (category === "공지") {
        setPosts(notices);
      } else {
        setPosts(contents);
      }

      const computedTotalPages = Math.ceil(
        (data.totalElements ?? 0) / (data.size ?? size)
      );

      setTotalPages(Math.max(1, computedTotalPages));
    };

    fetchBoards();
  }, [page, category, appliedKeyword, size, appliedSearchType]);

  const getBoardType = (    post?: Board) => post?.boardType ?? "";

  const getBoardLabel = (post: Board) => {
    if (post.boardType === "NOTICE") return "공지";
    if (post.boardType === "REVIEW") return "일반";
    return "-";
  };

  const getTitleIcons = (post: Board) => {
    if (post.hasImage && post.hasVideo) {
      return (
        <Box component="span" sx={{ display: "inline-flex", gap: 0.4, mr: 0.8 }}>
          <ImageOutlinedIcon sx={{ fontSize: 16, verticalAlign: "middle", color: "#059669" }} />
          <SmartDisplayOutlinedIcon sx={{ fontSize: 16, verticalAlign: "middle", color: "#2563eb" }} />
        </Box>
      );
    }
    if (post.hasImage) {
      return (
        <ImageOutlinedIcon sx={{ fontSize: 16, verticalAlign: "middle", mr: 0.8, color: "#059669" }} />
      );
    }
    if (post.hasVideo) {
      return (
        <SmartDisplayOutlinedIcon sx={{ fontSize: 16, verticalAlign: "middle", mr: 0.8, color: "#2563eb" }} />
      );
    }
    return (
      <ChatBubbleOutlineIcon sx={{ fontSize: 16, verticalAlign: "middle", mr: 0.8, color: "#94a3b8" }} />
    );
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

  const openAuthorMenu = (
    e: React.MouseEvent<HTMLElement>,
    author: string
  ) => {
    setAuthorAnchor(e.currentTarget as HTMLElement);
    setSelectedAuthor(author);
  };

  const closeAuthorMenu = () => {
    setAuthorAnchor(null);
  };

  return (
    <ThemeProvider theme={boardTheme}>
      <Box
        sx={{
          maxWidth: 1100,
          mx: "auto",
          py: 5,
          px: { xs: 2, sm: 3 },
        }}
      >
        {/* 헤더 */}
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
              커뮤니티
            </Typography>
            <Typography sx={{ fontSize: 14, color: "#64748b" }}>
              자유롭게 소통하는 게시판입니다
            </Typography>
          </Box>
          {user && (
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
              onClick={() => navigate("/board/write")}
            >
              새글쓰기
            </Button>
          )}
        </Box>

        {/* 검색 + 카테고리 */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
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

            {["ALL", "공지", "일반"].map((c) => (
              <Button
                key={c}
                size="small"
                variant={category === c ? "contained" : "outlined"}
                sx={{
                  bgcolor: category === c ? ACCENT : "transparent",
                  color: category === c ? "#fff" : "#64748b",
                  borderColor: category === c ? ACCENT : "rgba(0,0,0,0.2)",
                  "&:hover": {
                    bgcolor: category === c ? "#e55f00" : "rgba(0,0,0,0.04)",
                    borderColor: category === c ? "#e55f00" : "rgba(0,0,0,0.3)",
                  },
                  borderRadius: 1,
                }}
                onClick={() => {
                  setCategory(c as CategoryType);
                  setPage(0);
                  setKeyword("");
                  setAppliedKeyword("");
                }}
              >
                {c === "ALL" ? "전체글" : c}
              </Button>
            ))}

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
              <MenuItem value={10}>10개</MenuItem>
              <MenuItem value={30}>30개</MenuItem>
              <MenuItem value={50}>50개</MenuItem>
              <MenuItem value={100}>100개</MenuItem>
            </Select>
          </Box>
        </Paper>

        {/* 테이블 */}
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            borderRadius: 2,
            border: "1px solid",
            borderColor: "rgba(0,0,0,0.06)",
            overflow: "hidden",
          }}
        >
          <Table sx={{ tableLayout: "fixed" }}>
            <TableHead>
              <TableRow
                sx={{
                  bgcolor: "#f8fafc",
                  "& th": {
                    py: 1.5,
                    fontWeight: 600,
                    fontSize: 13,
                    color: "#475569",
                    borderBottom: "1px solid rgba(0,0,0,0.08)",
                  },
                }}
              >
                <TableCell align="center" sx={{ width: 50 }}>번호</TableCell>
                <TableCell align="center" sx={{ width: 60 }}>말머리</TableCell>
                <TableCell align="center">제목</TableCell>
                <TableCell align="center" sx={{ width: 120 }}>글쓴이</TableCell>
                <TableCell align="center" sx={{ width: 90 }}>작성일</TableCell>
                <TableCell align="center" sx={{ width: 50 }}>조회</TableCell>
                <TableCell align="center" sx={{ width: 50 }}>추천</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {posts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    align="center"
                    sx={{
                      py: 8,
                      color: "#94a3b8",
                      fontSize: 15,
                      borderBottom: "none",
                    }}
                  >
                    등록된 글이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                posts.map((post) => {
                  const type = getBoardType(post);

                  return (
                    <TableRow
                      key={post.id}
                      sx={{
                        "&:hover": { bgcolor: "rgba(255,107,0,0.04)" },
                        transition: "background 0.2s",
                        "& td": {
                          py: 1.75,
                          fontSize: 14,
                          color: "#334155",
                          borderBottom: "1px solid rgba(0,0,0,0.06)",
                        },
                      }}
                    >
                      <TableCell align="center">{post.id}</TableCell>

                      <TableCell align="center">
                        <Chip
                          label={getBoardLabel(post)}
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
                      </TableCell>

                      <TableCell
                        align="left"
                        sx={{
                          pl: 3,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          fontWeight: type === "NOTICE" ? 700 : 500,
                        }}
                      >
                        <Box
                          component="span"
                          onClick={() => navigate(`/board/${post.id}`)}
                          sx={{
                            cursor: "pointer",
                            "&:hover": { color: ACCENT, textDecoration: "underline" },
                          }}
                        >
                          {getTitleIcons(post)}
                          {post.title}
                          {post.commentCount > 0 && (
                            <Typography
                              component="span"
                              sx={{ color: "#94a3b8", ml: 0.5, fontSize: "inherit" }}
                            >
                              [{post.commentCount}]
                            </Typography>
                          )}
                        </Box>
                      </TableCell>

                      <TableCell align="center">
                        <Box
                          component="span"
                          sx={{
                            cursor: "pointer",
                            "&:hover": { color: ACCENT, textDecoration: "underline" },
                          }}
                          onClick={(e) => openAuthorMenu(e, post.authorNickname)}
                        >
                          {post.authorNickname}
                        </Box>
                      </TableCell>

                      <TableCell align="center">
                        {post.createdAt
                          ? new Date(post.createdAt).toLocaleDateString("ko-KR")
                          : "-"}
                      </TableCell>

                      <TableCell align="center">{post.viewCount}</TableCell>
                      <TableCell align="center">{post.recommendCount}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

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
            "& .MuiPaginationItem-root": { fontSize: 14 },
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
