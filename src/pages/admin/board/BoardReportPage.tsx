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
      <Box sx={{ maxWidth: 1240, mx: "auto", mt: 4, px: 1 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
            mb: 2,
          }}
        >
          <Typography sx={{ fontSize: 28, fontWeight: 800, color: "#ff6b00" }}>
            신고 관리
          </Typography>

          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="outlined" onClick={() => navigate("/admin/board")}>관리자 보드</Button>
          </Box>
        </Box>

        <Paper variant="outlined" sx={{ borderColor: "#ececec", p: 1.5, mb: 1.5 }}>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
            <Select
              size="small"
              value={filter}
              onChange={(event) => {
                setFilter(event.target.value as ReportFilter);
                setPage(1);
              }}
              sx={{ minWidth: 140 }}
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
              sx={{ minWidth: 90 }}
            >
              <MenuItem value={10}>10개</MenuItem>
              <MenuItem value={20}>20개</MenuItem>
              <MenuItem value={50}>50개</MenuItem>
            </Select>
          </Box>
        </Paper>

        <TableContainer component={Paper} variant="outlined" sx={{ borderColor: "#ececec" }}>
          <Table size="small" sx={{ minWidth: 1140 }}>
            <TableHead>
              <TableRow>
                <TableCell align="center" sx={{ width: 70, whiteSpace: "nowrap" }}>번호</TableCell>
                <TableCell align="center" sx={{ width: 90, whiteSpace: "nowrap" }}>대상</TableCell>
                <TableCell align="left" sx={{ width: 240, whiteSpace: "nowrap" }}>게시글</TableCell>
                <TableCell align="left" sx={{ minWidth: 280, whiteSpace: "nowrap" }}>신고 사유</TableCell>
                <TableCell align="center" sx={{ width: 90, whiteSpace: "nowrap" }}>신고자</TableCell>
                <TableCell align="center" sx={{ width: 110, whiteSpace: "nowrap" }}>상태</TableCell>
                <TableCell align="center" sx={{ width: 120, whiteSpace: "nowrap" }}>처리 액션</TableCell>
                <TableCell align="center" sx={{ width: 170, whiteSpace: "nowrap" }}>신고일</TableCell>
                <TableCell align="center" sx={{ width: 180, whiteSpace: "nowrap" }}>처리</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 5, color: "#777" }}>
                    신고 내역이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report) => (
                  <TableRow key={report.id} hover>
                    <TableCell align="center">{report.id}</TableCell>
                    <TableCell align="center">{getTargetLabel(report)}</TableCell>
                    <TableCell align="left">
                      <Typography
                        component="span"
                        sx={{
                          cursor: "pointer",
                          textDecoration: "underline",
                          textUnderlineOffset: 2,
                        }}
                        onClick={() => navigate(`/admin/board/${report.boardId}`)}
                      >
                        {report.boardTitle ?? `게시글 #${report.boardId}`}
                      </Typography>
                      {report.commentId ? (
                        <Typography sx={{ color: "#888", fontSize: 12 }}>
                          댓글 #{report.commentId}
                        </Typography>
                      ) : null}
                    </TableCell>
                    <TableCell align="left" sx={{ whiteSpace: "pre-wrap", wordBreak: "keep-all", minWidth: 280 }}>
                      {report.reason}
                      {report.processNote ? (
                        <Typography sx={{ color: "#666", fontSize: 12, mt: 0.3 }}>
                          처리메모: {report.processNote}
                        </Typography>
                      ) : null}
                    </TableCell>
                    <TableCell align="center">{report.reporterNickname ?? `#${report.reporterId}`}</TableCell>
                    <TableCell align="center">{getStatusChip(report.status)}</TableCell>
                    <TableCell align="center">{getActionLabel(report.actionType)}</TableCell>
                    <TableCell align="center">{formatDate(report.createdAt)}</TableCell>
                    <TableCell align="center">
                      {report.status === "PENDING" ? (
                        <Box sx={{ display: "flex", justifyContent: "center", gap: 0.6 }}>
                          <Button size="small" color="success" variant="outlined" onClick={() => void handleAccept(report)}>
                            승인
                          </Button>
                          <Button size="small" color="inherit" variant="outlined" onClick={() => void handleReject(report)}>
                            기각
                          </Button>
                        </Box>
                      ) : (
                        <Typography sx={{ color: "#777", fontSize: 12 }}>
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

        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <Pagination
            count={totalPages}
            page={page}
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
