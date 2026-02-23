import { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  ButtonGroup,
  CircularProgress,
  Divider,
  FormControlLabel,
  Paper,
  Snackbar,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {
  createAdminBoard,
  hideAdminBoard,
  isAdminEndpointUnsupported,
  type BoardType,
} from "./api/adminBoardApi";
import { uploadBoardImage } from "./api/boardImageUpload";
import { boardTheme } from "./theme/boardTheme";

interface ValidationField {
  field?: string;
  messages?: string[];
}

interface ErrorEnvelope {
  response?: {
    status?: number;
    data?: {
      code?: string;
      fields?: ValidationField[];
      error?: {
        code?: string;
        fields?: ValidationField[];
      };
    };
  };
  uploadStep?: "presign" | "s3-put";
}

const htmlToText = (html: string): string => {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent?.trim() ?? "";
};

const parseValidationErrors = (error: unknown): Record<string, string> => {
  const payload = (error as ErrorEnvelope)?.response?.data;
  const fields = payload?.fields ?? payload?.error?.fields ?? [];
  const map: Record<string, string> = {};
  fields.forEach((item) => {
    const key = item.field;
    const message = item.messages?.[0];
    if (key && message) map[key] = message;
  });
  return map;
};

const ACCENT = "#ff6b00";

export default function BoardWrite() {
  const navigate = useNavigate();

  const [boardType, setBoardType] = useState<BoardType>("NOTICE");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [hidden, setHidden] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const quillRef = useRef<ReactQuill | null>(null);

  const insertEmbedToEditor = useCallback((fileUrl: string, type: "image" | "video") => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;

    const range = quill.getSelection(true);
    const index = range ? range.index : quill.getLength();

    quill.insertEmbed(index, type, fileUrl, "user");
    quill.setSelection(index + 1);
  }, []);

  const uploadMedia = useCallback(
    async (file: File, mediaType: "image" | "video") => {
      try {
        setUploading(true);
        const fileUrl = await uploadBoardImage(file);
        insertEmbedToEditor(fileUrl, mediaType);
      } catch (error: unknown) {
        const uploadStep = (error as ErrorEnvelope)?.uploadStep;
        const status = (error as ErrorEnvelope)?.response?.status;

        if (uploadStep === "presign" && (status === 401 || status === 403)) {
          setToast("로그인이 필요합니다.");
          return;
        }

        if (uploadStep === "s3-put" && status === 403) {
          setToast("S3 업로드 권한 또는 CORS 설정을 확인해주세요.");
          return;
        }

        setToast(mediaType === "video" ? "동영상 업로드에 실패했습니다." : "이미지 업로드에 실패했습니다.");
      } finally {
        setUploading(false);
      }
    },
    [insertEmbedToEditor],
  );

  const onToolbarFile = useCallback(
    (accept: string, mediaType: "image" | "video") => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = accept;
      input.click();

      input.onchange = () => {
        const file = input.files?.[0];
        if (file) {
          void uploadMedia(file, mediaType);
        }
      };
    },
    [uploadMedia],
  );

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          ["link", "image", "video"],
          ["clean"],
        ],
        handlers: {
          image: () => onToolbarFile("image/*", "image"),
          video: () => onToolbarFile("video/*", "video"),
        },
      },
    }),
    [onToolbarFile],
  );

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};

    if (!title.trim()) {
      nextErrors.title = "제목을 입력해주세요.";
    } else if (title.trim().length < 2) {
      nextErrors.title = "제목은 2자 이상이어야 합니다.";
    }

    if (!htmlToText(content)) {
      nextErrors.content = "본문을 입력해주세요.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validate()) return;
    if (uploading) {
      setToast("미디어 업로드가 끝난 후 다시 시도해주세요.");
      return;
    }

    setSaving(true);
    try {
      const res = await createAdminBoard({
        title: title.trim(),
        content,
        boardType,
        hidden,
      });

      const locationHeader = (res.headers?.location as string | undefined) ?? "";
      const locationMatchedId = locationHeader.match(/\/(\d+)(?:\?.*)?$/)?.[1];
      const createdIdCandidates = [
        typeof res.data?.data === "number" ? res.data.data : undefined,
        res.data?.data?.id,
        res.data?.id,
        res.data?.data?.boardId,
        res.data?.data?.board?.id,
        locationMatchedId ? Number(locationMatchedId) : undefined,
      ];
      const createdId = createdIdCandidates.find(
        (value): value is number => typeof value === "number" && Number.isFinite(value) && value > 0,
      );

      if (hidden && createdId) {
        try {
          await hideAdminBoard(createdId);
        } catch (error: unknown) {
          if (isAdminEndpointUnsupported(error)) {
            setToast("숨김 API가 아직 준비되지 않았습니다. 게시글은 정상 등록되었습니다.");
          } else {
            setToast("게시글은 등록되었지만 숨김 처리에 실패했습니다.");
          }
        }
      } else if (hidden && !createdId) {
        setToast("게시글은 등록되었지만 숨김 처리를 위해 게시글 ID를 확인하지 못했습니다.");
      }

      navigate(createdId ? `/admin/board/${createdId}` : "/admin/board", {
        replace: true,
      });
    } catch (error: unknown) {
      const fieldErrors = parseValidationErrors(error);
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
      } else {
        setToast("게시글 등록에 실패했습니다.");
      }
    } finally {
      setSaving(false);
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
            관리자 글 작성
          </Typography>
          <Typography sx={{ fontSize: 14, color: "#64748b" }}>
            새 게시글을 작성합니다
          </Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: 4,
            position: "relative",
            borderRadius: 2,
            border: "1px solid",
            borderColor: "rgba(0,0,0,0.06)",
            bgcolor: "#fff",
          }}
        >
          <Box component="form" onSubmit={handleSubmit}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3, flexWrap: "wrap" }}>
              <Typography sx={{ fontWeight: 600, color: "#334155" }}>말머리</Typography>
              <ButtonGroup size="small">
                <Button
                  variant={boardType === "NOTICE" ? "contained" : "outlined"}
                  sx={{
                    bgcolor: boardType === "NOTICE" ? ACCENT : "transparent",
                    color: boardType === "NOTICE" ? "#fff" : "#64748b",
                    borderColor: boardType === "NOTICE" ? ACCENT : "rgba(0,0,0,0.2)",
                    borderRadius: 1,
                    "&:hover": {
                      bgcolor: boardType === "NOTICE" ? "#e55f00" : "rgba(0,0,0,0.04)",
                      borderColor: boardType === "NOTICE" ? "#e55f00" : "rgba(0,0,0,0.3)",
                    },
                  }}
                  onClick={() => setBoardType("NOTICE")}
                >
                  공지
                </Button>
                <Button
                  variant={boardType === "REVIEW" ? "contained" : "outlined"}
                  sx={{
                    bgcolor: boardType === "REVIEW" ? ACCENT : "transparent",
                    color: boardType === "REVIEW" ? "#fff" : "#64748b",
                    borderColor: boardType === "REVIEW" ? ACCENT : "rgba(0,0,0,0.2)",
                    borderRadius: 1,
                    "&:hover": {
                      bgcolor: boardType === "REVIEW" ? "#e55f00" : "rgba(0,0,0,0.04)",
                      borderColor: boardType === "REVIEW" ? "#e55f00" : "rgba(0,0,0,0.3)",
                    },
                  }}
                  onClick={() => setBoardType("REVIEW")}
                >
                  일반
                </Button>
              </ButtonGroup>

              <Box sx={{ flex: 1 }} />

              <FormControlLabel
                control={
                  <Switch
                    checked={hidden}
                    onChange={(_, value) => setHidden(value)}
                    sx={{
                      "& .MuiSwitch-switchBase.Mui-checked": { color: "#94a3b8" },
                      "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                        backgroundColor: "#94a3b8",
                      },
                    }}
                  />
                }
                label={
                  <Typography sx={{ fontSize: 14, color: "#64748b" }}>
                    작성 후 숨김
                  </Typography>
                }
              />
            </Box>

            <Divider sx={{ my: 2, borderColor: "rgba(0,0,0,0.06)" }} />

            <TextField
              fullWidth
              value={title}
              placeholder="제목을 입력하세요"
              onChange={(event) => {
                setTitle(event.target.value);
                if (errors.title) {
                  setErrors((prev) => ({ ...prev, title: "" }));
                }
              }}
              error={Boolean(errors.title)}
              helperText={errors.title}
              sx={{
                mb: 3,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                  fontSize: "1.1rem",
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: ACCENT,
                    borderWidth: 2,
                  },
                },
                "& .MuiInputLabel-root.Mui-focused": { color: ACCENT },
              }}
            />

            <Box
              sx={{
                mb: 3,
                "& .ql-toolbar.ql-snow": {
                  borderRadius: "8px 8px 0 0",
                  borderColor: "rgba(0,0,0,0.12)",
                },
                "& .ql-container.ql-snow": {
                  height: 500,
                  maxHeight: "70vh",
                  borderRadius: "0 0 8px 8px",
                  borderColor: "rgba(0,0,0,0.12)",
                  overflowY: "auto",
                  display: "block",
                },
                "& .ql-editor": {
                  minHeight: 460,
                  fontSize: 15,
                  lineHeight: 1.7,
                },
              }}
            >
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={content}
                onChange={(value) => {
                  setContent(value);
                  if (errors.content) {
                    setErrors((prev) => ({ ...prev, content: "" }));
                  }
                }}
                modules={modules}
                style={{ marginBottom: 45 }}
              />
              {errors.content ? (
                <Typography color="error" sx={{ mt: 1 }}>
                  {errors.content}
                </Typography>
              ) : null}
              {uploading ? (
                <Typography sx={{ mt: 1, color: "#64748b", fontSize: 13 }}>
                  미디어 업로드 중입니다...
                </Typography>
              ) : null}
            </Box>

            <Divider sx={{ my: 3, borderColor: "rgba(0,0,0,0.06)" }} />

            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 1.5,
                mt: 4,
                pt: 2,
              }}
            >
              <Button
                variant="outlined"
                sx={{
                  height: 40,
                  fontSize: 14,
                  borderRadius: 1.5,
                  textTransform: "none",
                  fontWeight: 600,
                  borderColor: "rgba(0,0,0,0.2)",
                  color: "#64748b",
                  "&:hover": {
                    borderColor: ACCENT,
                    color: ACCENT,
                    bgcolor: "rgba(255,107,0,0.04)",
                  },
                }}
                onClick={() => navigate("/admin/board")}
              >
                취소
              </Button>
              <Button
                type="submit"
                variant="contained"
                sx={{
                  height: 40,
                  fontSize: 14,
                  borderRadius: 1.5,
                  bgcolor: ACCENT,
                  textTransform: "none",
                  fontWeight: 600,
                  px: 2.5,
                  "&:hover": { bgcolor: "#e55f00" },
                }}
                disabled={saving}
              >
                {saving ? <CircularProgress size={20} color="inherit" /> : "등록"}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={2200}
        onClose={() => setToast("")}
        message={toast}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </ThemeProvider>
  );
}
