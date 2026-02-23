import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
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
  Typography,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { inputHeightSx } from "../../common/utils/helperUtil";
import {
  fetchAdminReports,
  processAdminReport,
  type AdminBoardReport,
  type ReportActionType,
  type ReportStatus,
} from "./api/adminBoardApi";
import { boardTheme } from "./theme/boardTheme";

type ReportFilter = "ALL" | ReportStatus;

const getStatusChip = (status: ReportStatus) => {
  if (status === "PENDING") return <Chip size="small" color="warning" label="처리대기" />;
  if (status === "ACCEPTED") return <Chip size="small" color="success" label="승인" />;
  return <Chip size="small" color="default" label="기각" />;
};

const getTargetLabel = (report: AdminBoardReport) =>
  report.targetType === "COMMENT" ? "댓글" : "게시글";

const getActionLabel = (action?: ReportActionType | null) => {
  if (action === "HIDE_BOARD") return "게시글 숨김";
  if (action === "DELETE_COMMENT") return "댓글 삭제";
  return "-";
};

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleString("ko-KR") : "-";

const ACCENT = "#ff6b00";

export default function BoardReportPage() {
  const navigate = useNavigate();

  const [filter, setFilter] = useState<ReportFilter>("PENDING");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  const [reports, setReports] = useState<AdminBoardReport[]>([]);
  const [totalPages, setTotalPages] = useState(1);

  const statusParam = useMemo<ReportStatus | undefined>(() => {
    if (filter === "ALL") return undefined;
    return filter;
  }, [filter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminReports({
        page: page - 1,
        size,
        status: statusParam,
      });
      setReports(data.content ?? []);
      setTotalPages(Math.max(1, data.totalPages || 1));
    } catch {
      setReports([]);
      setTotalPages(1);
      setToast("신고 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchReports();
  }, [page, size, statusParam]);

  const handleAccept = async (report: AdminBoardReport) => {
    const action: ReportActionType =
      report.targetType === "COMMENT" ? "DELETE_COMMENT" : "HIDE_BOARD";

    const noteInput = window.prompt("처리 메모를 입력하세요. (선택)") ?? "";

    try {
      await processAdminReport(report.id, {
        status: "ACCEPTED",
        action,
        note: noteInput.trim() || undefined,
      });
      setToast("신고를 승인 처리했습니다.");
      await fetchReports();
    } catch {
      setToast("신고 승인 처리에 실패했습니다.");
    }
  };

  const handleReject = async (report: AdminBoardReport) => {
    const noteInput = window.prompt("기각 사유를 입력하세요.") ?? "";

    try {
      await processAdminReport(report.id, {
        status: "REJECTED",
        note: noteInput.trim() || undefined,
      });
      setToast("신고를 기각 처리했습니다.");
      await fetchReports();
    } catch {
      setToast("신고 기각 처리에 실패했습니다.");
    }
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
              신고 관리
            </Typography>
            <Typography sx={{ fontSize: 14, color: "#64748b" }}>
              신고된 게시글·댓글을 검토하고 처리합니다
            </Typography>
          </Box>

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
            onClick={() => navigate("/admin/board")}
          >
            관리자 보드
          </Button>
        </Box>

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
              gap: 1.5,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <Select
              size="small"
              value={filter}
              onChange={(event) => {
                setFilter(event.target.value as ReportFilter);
                setPage(1);
              }}
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
              <MenuItem value="PENDING">처리대기</MenuItem>
              <MenuItem value="ACCEPTED">승인</MenuItem>
              <MenuItem value="REJECTED">기각</MenuItem>
              <MenuItem value="ALL">전체</MenuItem>
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
                ml: "auto",
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
          <Table size="small" sx={{ tableLayout: "fixed", width: "100%" }}>
            <TableHead>
              <TableRow sx={{ bgcolor: "#fafafa" }}>
                <TableCell align="center" sx={{ width: 52, fontWeight: 600, color: "#475569", px: 1 }}>번호</TableCell>
                <TableCell align="center" sx={{ width: 60, fontWeight: 600, color: "#475569", px: 1 }}>대상</TableCell>
                <TableCell align="left" sx={{ width: "22%", fontWeight: 600, color: "#475569", px: 2 }}>게시글</TableCell>
                <TableCell align="left" sx={{ width: "28%", fontWeight: 600, color: "#475569", px: 2 }}>신고 사유</TableCell>
                <TableCell align="center" sx={{ width: 80, fontWeight: 600, color: "#475569", px: 1 }}>신고자</TableCell>
                <TableCell align="center" sx={{ width: 80, fontWeight: 600, color: "#475569", px: 1 }}>상태</TableCell>
                <TableCell align="center" sx={{ width: 95, fontWeight: 600, color: "#475569", px: 1 }}>처리 액션</TableCell>
                <TableCell align="center" sx={{ width: 130, fontWeight: 600, color: "#475569", px: 1 }}>신고일</TableCell>
                <TableCell align="center" sx={{ width: 140, fontWeight: 600, color: "#475569", px: 1 }}>처리</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={24} sx={{ color: ACCENT }} />
                  </TableCell>
                </TableRow>
              ) : reports.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    align="center"
                    sx={{ py: 8, color: "#94a3b8", fontSize: 15 }}
                  >
                    신고 내역이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report) => (
                  <TableRow
                    key={report.id}
                    hover
                    sx={{
                      transition: "all 0.2s",
                      "&:hover": {
                        bgcolor: "rgba(255,107,0,0.04)",
                      },
                    }}
                  >
                    <TableCell align="center" sx={{ px: 1 }}>{report.id}</TableCell>
                    <TableCell align="center" sx={{ px: 1 }}>{getTargetLabel(report)}</TableCell>
                    <TableCell align="left" sx={{ px: 2, maxWidth: 0 }}>
                      <Typography
                        component="span"
                        sx={{
                          display: "block",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          cursor: "pointer",
                          "&:hover": { color: ACCENT, textDecoration: "underline" },
                        }}
                        onClick={() => navigate(`/admin/board/${report.boardId}`)}
                      >
                        {report.boardTitle ?? `게시글 #${report.boardId}`}
                      </Typography>
                      {report.commentId ? (
                        <Typography sx={{ color: "#94a3b8", fontSize: 12 }}>
                          댓글 #{report.commentId}
                        </Typography>
                      ) : null}
                    </TableCell>
                    <TableCell align="left" sx={{ px: 2, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                      {report.reason}
                      {report.processNote ? (
                        <Typography sx={{ color: "#666", fontSize: 12, mt: 0.3 }}>
                          처리메모: {report.processNote}
                        </Typography>
                      ) : null}
                    </TableCell>
                    <TableCell align="center" sx={{ px: 1 }}>{report.reporterNickname ?? `#${report.reporterId}`}</TableCell>
                    <TableCell align="center" sx={{ px: 1 }}>{getStatusChip(report.status)}</TableCell>
                    <TableCell align="center" sx={{ px: 1 }}>{getActionLabel(report.actionType)}</TableCell>
                    <TableCell align="center" sx={{ px: 1 }}>{formatDate(report.createdAt)}</TableCell>
                    <TableCell align="center" sx={{ px: 1 }}>
                      {report.status === "PENDING" ? (
                        <Box sx={{ display: "flex", justifyContent: "center", gap: 0.6 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            sx={{
                              borderColor: "#059669",
                              color: "#059669",
                              "&:hover": { borderColor: "#047857", bgcolor: "rgba(5,150,105,0.04)" },
                            }}
                            onClick={() => void handleAccept(report)}
                          >
                            승인
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            sx={{
                              borderColor: "rgba(0,0,0,0.2)",
                              color: "#64748b",
                              "&:hover": {
                                borderColor: "#dc2626",
                                color: "#dc2626",
                                bgcolor: "rgba(220,38,38,0.04)",
                              },
                            }}
                            onClick={() => void handleReject(report)}
                          >
                            기각
                          </Button>
                        </Box>
                      ) : (
                        <Typography sx={{ color: "#94a3b8", fontSize: 12 }}>
                          {formatDate(report.processedAt)}
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))
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
            page={page}
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
