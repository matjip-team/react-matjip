import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Snackbar,
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
import {
  fetchAdminBoards,
  type AdminBoardListItem,
  type AdminBoardStatusFilter,
  type BoardSearchType,
} from "./api/adminBoardApi";
import { boardTheme } from "./theme/boardTheme";

const statusOptions: Array<{ value: AdminBoardStatusFilter; label: string }> = [
  { value: "ALL", label: "전체" },
  { value: "NOTICE", label: "공지" },
  { value: "REVIEW", label: "일반" },
  { value: "HIDDEN", label: "숨김" },
  { value: "REPORTED", label: "신고" },
];

type SortType =
  | "LATEST"
  | "OLDEST"
  | "VIEW_DESC"
  | "RECOMMEND_DESC"
  | "COMMENT_DESC";

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
        <ImageOutlinedIcon sx={{ fontSize: 16, color: "#2e7d32" }} />
        <SmartDisplayOutlinedIcon sx={{ fontSize: 16, color: "#d32f2f" }} />
      </Box>
    );
  }

  if (hasImage) {
    return <ImageOutlinedIcon sx={{ fontSize: 16, color: "#2e7d32", mr: 0.8 }} />;
  }

  if (hasVideo) {
    return <SmartDisplayOutlinedIcon sx={{ fontSize: 16, color: "#d32f2f", mr: 0.8 }} />;
  }

  return <ChatBubbleOutlineIcon sx={{ fontSize: 16, color: "#9e9e9e", mr: 0.8 }} />;
};

export default function BoardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialStatus = (searchParams.get("status") as AdminBoardStatusFilter) || "ALL";

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [rawItems, setRawItems] = useState<AdminBoardListItem[]>([]);

  const [statusFilter, setStatusFilter] = useState<AdminBoardStatusFilter>(initialStatus);
  const [searchType, setSearchType] = useState<BoardSearchType>("TITLE_CONTENT");
  const [keyword, setKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [sortType, setSortType] = useState<SortType>("LATEST");

  const [size, setSize] = useState(20);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
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
        setToast("관리자 게시글을 불러오지 못했습니다.");
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

    if (next === "ALL") {
      searchParams.delete("status");
      setSearchParams(searchParams, { replace: true });
      return;
    }

    setSearchParams({ status: next }, { replace: true });
  };

  return (
    <ThemeProvider theme={boardTheme}>
      <Box sx={{ maxWidth: 1200, mx: "auto", mt: 4, px: 1 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <Typography sx={{ fontSize: 28, fontWeight: 800, color: "#ff6b00" }}>
            관리자 게시글 목록
          </Typography>

          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="outlined" onClick={() => navigate("/admin/board")}>대시보드</Button>
            <Button
              variant="contained"
              sx={{ bgcolor: "#ff6b00", "&:hover": { bgcolor: "#e65f00" } }}
              onClick={() => navigate("/admin/board/write")}
            >
              관리자 작성
            </Button>
          </Box>
        </Box>

        <Paper variant="outlined" sx={{ borderColor: "#ececec", p: 1.5, mb: 1.5 }}>
          <Box sx={{ display: "flex", gap: 0.7, flexWrap: "wrap", mb: 1.2 }}>
            {statusOptions.map((option) => (
              <Button
                key={option.value}
                size="small"
                variant={statusFilter === option.value ? "contained" : "outlined"}
                sx={{
                  color: statusFilter === option.value ? "#fff" : "#ff6b00",
                  bgcolor: statusFilter === option.value ? "#ff6b00" : "#fff",
                  borderColor: "#ff6b00",
                  "&:hover": {
                    bgcolor: statusFilter === option.value ? "#e65f00" : "#fff8f2",
                    borderColor: "#ff6b00",
                  },
                }}
                onClick={() => handleStatusChange(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </Box>

          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
            <Select
              size="small"
              value={searchType}
              onChange={(event) => setSearchType(event.target.value as BoardSearchType)}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="TITLE_CONTENT">제목+내용</MenuItem>
              <MenuItem value="TITLE">제목</MenuItem>
              <MenuItem value="CONTENT">내용</MenuItem>
              <MenuItem value="AUTHOR">작성자</MenuItem>
              <MenuItem value="COMMENT">댓글</MenuItem>
            </Select>

            <TextField
              size="small"
              placeholder="검색어"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSearch();
                }
              }}
              sx={{ width: { xs: "100%", sm: 280 } }}
            />

            <IconButton
              sx={{ bgcolor: "#ff6b00", color: "#fff", "&:hover": { bgcolor: "#e65f00" } }}
              onClick={handleSearch}
            >
              <SearchIcon />
            </IconButton>

            <Box sx={{ flex: 1 }} />

            <Select
              size="small"
              value={sortType}
              onChange={(event) => setSortType(event.target.value as SortType)}
              sx={{ minWidth: 140 }}
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
              sx={{ minWidth: 90 }}
            >
              <MenuItem value={10}>10개</MenuItem>
              <MenuItem value={20}>20개</MenuItem>
              <MenuItem value={50}>50개</MenuItem>
            </Select>
          </Box>
        </Paper>

        <TableContainer component={Paper} variant="outlined" sx={{ borderColor: "#ececec" }}>
          <Table size="small" sx={{ tableLayout: "fixed" }}>
            <TableHead>
              <TableRow>
                <TableCell align="center" sx={{ width: 70 }}>번호</TableCell>
                <TableCell align="center" sx={{ width: 84 }}>상태</TableCell>
                <TableCell align="center" sx={{ width: 80 }}>말머리</TableCell>
                <TableCell align="left">제목</TableCell>
                <TableCell align="center" sx={{ width: 120 }}>작성자</TableCell>
                <TableCell align="center" sx={{ width: 130 }}>작성일</TableCell>
                <TableCell align="center" sx={{ width: 70 }}>조회</TableCell>
                <TableCell align="center" sx={{ width: 70 }}>추천</TableCell>
                <TableCell align="center" sx={{ width: 84 }}>신고</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading && pageItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 5, color: "#777" }}>
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
                      sx={{
                        bgcolor: item.hidden ? "#fafafa" : "transparent",
                      }}
                    >
                      <TableCell align="center">{item.id}</TableCell>
                      <TableCell align="center">{statusChip(item)}</TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          color={item.boardType === "NOTICE" ? "warning" : "default"}
                          label={item.boardType === "NOTICE" ? "공지" : "일반"}
                        />
                      </TableCell>
                      <TableCell align="left" sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        <Box
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            cursor: "pointer",
                            maxWidth: "100%",
                            "&:hover": { textDecoration: "underline" },
                          }}
                          onClick={() => navigate(`/admin/board/${item.id}`)}
                        >
                          {mediaIcon(item)}
                          {item.hidden ? <VisibilityOffOutlinedIcon sx={{ fontSize: 15, mr: 0.5, color: "#757575" }} /> : null}
                          {isReported ? <FlagOutlinedIcon sx={{ fontSize: 15, mr: 0.5, color: "#d32f2f" }} /> : null}
                          <span>{item.title}</span>
                          {item.commentCount > 0 ? (
                            <Typography component="span" sx={{ color: "#888", ml: 0.4 }}>
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

        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
        </Box>
      </Box>

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={1800}
        onClose={() => setToast("")}
        message={toast}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </ThemeProvider>
  );
}
