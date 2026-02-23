import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import SmartDisplayOutlinedIcon from "@mui/icons-material/SmartDisplayOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import { ThemeProvider } from "@mui/material/styles";
import { inputHeightSx, INPUT_HEIGHT } from "../../common/utils/helperUtil";
import {
  fetchAdminBoards,
  type AdminBoardListItem,
  type AdminBoardStatusFilter,
  type BoardSearchType,
} from "./api/adminBoardApi";
import { boardTheme } from "./theme/boardTheme";

interface SummaryCard {
  label: string;
  value: number;
  color: string;
}

type SortType =
  | "LATEST"
  | "OLDEST"
  | "VIEW_DESC"
  | "RECOMMEND_DESC"
  | "COMMENT_DESC";

const statusOptions: Array<{ value: AdminBoardStatusFilter; label: string }> = [
  { value: "ALL", label: "전체" },
  { value: "NOTICE", label: "공지" },
  { value: "REVIEW", label: "일반" },
  { value: "HIDDEN", label: "숨김" },
  { value: "REPORTED", label: "신고" },
];

const uniqueById = (items: AdminBoardListItem[]): AdminBoardListItem[] => {
  const map = new Map<number, AdminBoardListItem>();
  items.forEach((item) => map.set(item.id, item));
  return Array.from(map.values());
};

const getTime = (date?: string): number => {
  if (!date) return 0;
  const parsed = new Date(date).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

const compareBySort = (a: AdminBoardListItem, b: AdminBoardListItem, sort: SortType): number => {
  if (sort === "OLDEST") return getTime(a.createdAt) - getTime(b.createdAt);
  if (sort === "VIEW_DESC") return b.viewCount - a.viewCount;
  if (sort === "RECOMMEND_DESC") return b.recommendCount - a.recommendCount;
  if (sort === "COMMENT_DESC") return b.commentCount - a.commentCount;
  return getTime(b.createdAt) - getTime(a.createdAt);
};

const applyStatusFilter = (
  items: AdminBoardListItem[],
  status: AdminBoardStatusFilter,
): AdminBoardListItem[] => {
  if (status === "NOTICE") return items.filter((item) => item.boardType === "NOTICE");
  if (status === "REVIEW") return items.filter((item) => item.boardType === "REVIEW");
  if (status === "HIDDEN") return items.filter((item) => item.hidden);
  if (status === "REPORTED") return items.filter((item) => (item.reportCount ?? 0) > 0);
  return items;
};

const ACCENT = "#ff6b00";

const statusChip = (item: AdminBoardListItem) => {
  if (item.hidden) return <Chip size="small" color="default" label="숨김" />;
  if ((item.reportCount ?? 0) > 0) {
    return <Chip size="small" color="error" label={`신고 ${item.reportCount ?? 0}`} />;
  }
  return <Chip size="small" color="success" label="정상" />;
};

const mediaIcon = (item: AdminBoardListItem) => {
  const hasImage = Boolean(item.hasImage);
  const hasVideo = Boolean(item.hasVideo);

  if (hasImage && hasVideo) {
    return (
      <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.3, mr: 0.8 }}>
        <ImageOutlinedIcon sx={{ fontSize: 16, color: "#059669" }} />
        <SmartDisplayOutlinedIcon sx={{ fontSize: 16, color: "#2563eb" }} />
      </Box>
    );
  }
  if (hasImage) {
    return <ImageOutlinedIcon sx={{ fontSize: 16, color: "#059669", mr: 0.8 }} />;
  }
  if (hasVideo) {
    return <SmartDisplayOutlinedIcon sx={{ fontSize: 16, color: "#2563eb", mr: 0.8 }} />;
  }
  return <ChatBubbleOutlineIcon sx={{ fontSize: 16, color: "#94a3b8", mr: 0.8 }} />;
};

export default function AdminBoardPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [rawItems, setRawItems] = useState<AdminBoardListItem[]>([]);

  const [statusFilter, setStatusFilter] = useState<AdminBoardStatusFilter>("ALL");
  const [searchType, setSearchType] = useState<BoardSearchType>("TITLE_CONTENT");
  const [keyword, setKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [sortType, setSortType] = useState<SortType>("LATEST");

  const [size, setSize] = useState(20);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const serverType =
          statusFilter === "NOTICE" ? "NOTICE" : statusFilter === "REVIEW" ? "REVIEW" : undefined;

        const data = await fetchAdminBoards({
          page: 0,
          size: 300,
          type: serverType,
          keyword: appliedKeyword || undefined,
          searchType,
        });

        setRawItems(uniqueById([...(data.notices ?? []), ...(data.contents ?? [])]));
      } catch {
        setRawItems([]);
        setError("관리자 보드 데이터를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [statusFilter, appliedKeyword, searchType]);

  const filteredItems = useMemo(() => {
    const byStatus = applyStatusFilter(rawItems, statusFilter);
    return [...byStatus].sort((a, b) => compareBySort(a, b, sortType));
  }, [rawItems, statusFilter, sortType]);

  const summaryCards = useMemo<SummaryCard[]>(() => {
    const total = filteredItems.length;
    const notice = filteredItems.filter((item) => item.boardType === "NOTICE").length;
    const review = filteredItems.filter((item) => item.boardType === "REVIEW").length;
    const hidden = filteredItems.filter((item) => item.hidden).length;
    const reported = filteredItems.filter((item) => (item.reportCount ?? 0) > 0).length;

    return [
      { label: "전체 게시글", value: total, color: "#334155" },
      { label: "공지", value: notice, color: ACCENT },
      { label: "일반", value: review, color: "#64748b" },
      { label: "숨김/신고", value: hidden + reported, color: "#dc2626" },
    ];
  }, [filteredItems]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / size));
  const currentPage = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * size;
    return filteredItems.slice(start, start + size);
  }, [currentPage, filteredItems, size]);

  const handleSearch = () => {
    setPage(1);
    setAppliedKeyword(keyword.trim());
  };

  const handleStatusChange = (next: AdminBoardStatusFilter) => {
    setStatusFilter(next);
    setPage(1);
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
        {/* 페이지 타이틀 */}
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
              커뮤니티 관리
            </Typography>
            <Typography sx={{ fontSize: 14, color: "#64748b" }}>
              게시글을 검색하고 관리할 수 있습니다
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              sx={{
                borderColor: "rgba(0,0,0,0.2)",
                color: "#64748b",
                fontWeight: 600,
                borderRadius: 1.5,
                "&:hover": {
                  borderColor: ACCENT,
                  color: ACCENT,
                  bgcolor: "rgba(255,107,0,0.04)",
                },
              }}
              onClick={() => navigate("/admin/board/reports")}
            >
              신고 검토
            </Button>
            <Button
              variant="contained"
              sx={{
                bgcolor: ACCENT,
                fontWeight: 600,
                borderRadius: 1.5,
                textTransform: "none",
                "&:hover": { bgcolor: "#e55f00" },
              }}
              onClick={() => navigate("/admin/board/write")}
            >
              관리자 글 작성
            </Button>
          </Stack>
        </Box>

        {error ? (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              borderRadius: 2,
              border: "1px solid rgba(220,38,38,0.2)",
            }}
          >
            {error}
          </Alert>
        ) : null}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: ACCENT }} />
          </Box>
        ) : (
          <Box
            sx={{
              mb: 4,
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                md: "repeat(4, minmax(0, 1fr))",
              },
              gap: 2,
            }}
          >
            {summaryCards.map((card) => (
              <Paper
                key={card.label}
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "rgba(0,0,0,0.06)",
                  bgcolor: "#fff",
                }}
              >
                <Typography sx={{ color: "#64748b", fontSize: 13 }}>{card.label}</Typography>
                <Typography sx={{ fontSize: 28, fontWeight: 700, color: card.color, mt: 0.5 }}>
                  {card.value}
                </Typography>
              </Paper>
            ))}
          </Box>
        )}

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
          <Box sx={{ display: "flex", gap: 0.7, flexWrap: "wrap", mb: 1.5 }}>
            {statusOptions.map((option) => (
              <Button
                key={option.value}
                size="small"
                variant={statusFilter === option.value ? "contained" : "outlined"}
                sx={{
                  color: statusFilter === option.value ? "#fff" : "#64748b",
                  bgcolor: statusFilter === option.value ? ACCENT : "transparent",
                  borderColor: statusFilter === option.value ? ACCENT : "rgba(0,0,0,0.2)",
                  borderRadius: 1,
                  "&:hover": {
                    bgcolor: statusFilter === option.value ? "#e55f00" : "rgba(0,0,0,0.04)",
                    borderColor: statusFilter === option.value ? "#e55f00" : "rgba(0,0,0,0.3)",
                  },
                }}
                onClick={() => handleStatusChange(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </Box>

          <Box
            sx={{
              display: "flex",
              gap: 1.5,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <Select
              size="small"
              value={searchType}
              onChange={(event) => setSearchType(event.target.value as BoardSearchType)}
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
              <MenuItem value="AUTHOR">작성자</MenuItem>
              <MenuItem value="COMMENT">댓글</MenuItem>
            </Select>

            <TextField
              size="small"
              placeholder="검색어 입력"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleSearch();
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

            <Box sx={{ flex: 1 }} />

            <Select
              size="small"
              value={sortType}
              onChange={(event) => setSortType(event.target.value as SortType)}
              sx={{
                width: 120,
                bgcolor: "#fff",
                borderRadius: 1,
                ...inputHeightSx,
              }}
            >
              <MenuItem value="LATEST">최신순</MenuItem>
              <MenuItem value="OLDEST">등록순</MenuItem>
              <MenuItem value="VIEW_DESC">조회순</MenuItem>
              <MenuItem value="RECOMMEND_DESC">추천순</MenuItem>
              <MenuItem value="COMMENT_DESC">댓글순</MenuItem>
            </Select>

            <Select
              size="small"
              value={size}
              onChange={(event) => {
                setSize(Number(event.target.value));
                setPage(1);
              }}
              sx={{
                width: 90,
                bgcolor: "#fff",
                borderRadius: 1,
                ...inputHeightSx,
              }}
            >
              <MenuItem value={10}>10개</MenuItem>
              <MenuItem value={20}>20개</MenuItem>
              <MenuItem value={50}>50개</MenuItem>
            </Select>
          </Box>
        </Paper>

        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{
            borderRadius: 2,
            border: "1px solid",
            borderColor: "rgba(0,0,0,0.06)",
            overflow: "hidden",
          }}
        >
          <Table size="small" sx={{ tableLayout: "fixed" }}>
            <TableHead>
              <TableRow sx={{ bgcolor: "#fafafa" }}>
                <TableCell align="center" sx={{ width: 70, fontWeight: 600, color: "#475569" }}>번호</TableCell>
                <TableCell align="center" sx={{ width: 84, fontWeight: 600, color: "#475569" }}>상태</TableCell>
                <TableCell align="center" sx={{ width: 80, fontWeight: 600, color: "#475569" }}>말머리</TableCell>
                <TableCell align="left" sx={{ fontWeight: 600, color: "#475569" }}>제목</TableCell>
                <TableCell align="center" sx={{ width: 120, fontWeight: 600, color: "#475569" }}>작성자</TableCell>
                <TableCell align="center" sx={{ width: 130, fontWeight: 600, color: "#475569" }}>작성일</TableCell>
                <TableCell align="center" sx={{ width: 70, fontWeight: 600, color: "#475569" }}>조회</TableCell>
                <TableCell align="center" sx={{ width: 70, fontWeight: 600, color: "#475569" }}>추천</TableCell>
                <TableCell align="center" sx={{ width: 84, fontWeight: 600, color: "#475569" }}>신고</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading && pageItems.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    align="center"
                    sx={{ py: 8, color: "#94a3b8", fontSize: 15 }}
                  >
                    게시글이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                pageItems.map((item) => {
                  const isReported = (item.reportCount ?? 0) > 0;
                  return (
                    <TableRow
                      key={item.id}
                      hover
                      onClick={() => navigate(`/admin/board/${item.id}`)}
                      sx={{
                        cursor: "pointer",
                        bgcolor: item.hidden ? "#f8fafc" : "transparent",
                        transition: "all 0.2s",
                        "&:hover": {
                          bgcolor: "rgba(255,107,0,0.04)",
                        },
                      }}
                    >
                      <TableCell align="center">{item.id}</TableCell>
                      <TableCell align="center">{statusChip(item)}</TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={item.boardType === "NOTICE" ? "공지" : "일반"}
                          sx={{
                            height: 22,
                            fontSize: 11,
                            fontWeight: 600,
                            bgcolor: item.boardType === "NOTICE" ? ACCENT : "#64748b",
                            color: "#fff",
                            "& .MuiChip-label": { px: 1 },
                          }}
                        />
                      </TableCell>
                      <TableCell align="left" sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        <Box
                          component="span"
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            maxWidth: "100%",
                            "&:hover": { textDecoration: "underline" },
                          }}
                        >
                          {mediaIcon(item)}
                          {item.hidden ? <VisibilityOffOutlinedIcon sx={{ fontSize: 15, mr: 0.5, color: "#757575" }} /> : null}
                          {isReported ? <FlagOutlinedIcon sx={{ fontSize: 15, mr: 0.5, color: "#d32f2f" }} /> : null}
                          <span>{item.title}</span>
                          {item.commentCount > 0 ? (
                            <Typography component="span" sx={{ color: "#94a3b8", ml: 0.4 }}>
                              [{item.commentCount}]
                            </Typography>
                          ) : null}
                        </Box>
                      </TableCell>
                      <TableCell align="center">{item.authorNickname}</TableCell>
                      <TableCell align="center">
                        {item.createdAt ? new Date(item.createdAt).toLocaleString("ko-KR") : "-"}
                      </TableCell>
                      <TableCell align="center">{item.viewCount}</TableCell>
                      <TableCell align="center">{item.recommendCount}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="신고 수">
                          <Box component="span">{item.reportCount ?? 0}</Box>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

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
            count={totalPages}
            page={currentPage}
            onChange={(_, value) => setPage(value)}
            color="standard"
            shape="rounded"
          />
        </Box>
      </Box>

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={2000}
        onClose={() => setToast("")}
        message={toast}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </ThemeProvider>
  );
}
