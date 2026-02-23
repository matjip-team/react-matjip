import { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  ButtonGroup,
  CircularProgress,
  Divider,
  Paper,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import axios from "../common/axios";
import { boardTheme } from "./theme/boardTheme";
import { uploadBoardImage } from "./api/boardImageUpload";

type BoardType = "NOTICE" | "REVIEW";

interface HttpErrorLike {
  response?: {
    status?: number;
    data?: ValidationErrorResponse;
  };
  uploadStep?: "presign" | "s3-put";
}

interface ValidationErrorField {
  field: string;
  messages: string[];
}

interface ValidationErrorResponse {
  code?: string;
  fields?: ValidationErrorField[];
}

const ACCENT = "#ff6b00";

export default function BoardWrite() {
  const navigate = useNavigate();

  const [boardType, setBoardType] = useState<BoardType>("REVIEW");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const quillRef = useRef<ReactQuill | null>(null);

  const extractPlainText = (html: string) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent?.trim() ?? "";
  };

  const insertEmbedToEditor = useCallback((fileUrl: string, type: "image" | "video") => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;

    const range = quill.getSelection(true);
    const index = range ? range.index : quill.getLength();

    quill.insertEmbed(index, type, fileUrl, "user");
    quill.setSelection(index + 1);
  }, []);

  const handleMediaUpload = useCallback(
    async (file: File, mediaType: "image" | "video") => {
      try {
        setIsUploadingMedia(true);
        const fileUrl = await uploadBoardImage(file);
        insertEmbedToEditor(fileUrl, mediaType);
      } catch (error: unknown) {
        console.error(error);
        const status = (error as HttpErrorLike)?.response?.status;
        const uploadStep = (error as HttpErrorLike)?.uploadStep;

        if (uploadStep === "presign" && (status === 401 || status === 403)) {
          setToast("로그인이 필요합니다.");
        } else if (uploadStep === "s3-put" && status === 403) {
          setToast("S3 업로드 권한 또는 CORS 설정을 확인해 주세요.");
        } else {
          setToast(mediaType === "video" ? "영상 업로드에 실패했습니다." : "이미지 업로드에 실패했습니다.");
        }
      } finally {
        setIsUploadingMedia(false);
      }
    },
    [insertEmbedToEditor],
  );

  const handleToolbarFile = useCallback(
    (accept: string, mediaType: "image" | "video") => {
      const input = document.createElement("input");
      input.setAttribute("type", "file");
      input.setAttribute("accept", accept);
      input.click();

      input.onchange = () => {
        const file = input.files?.[0];
        if (file) {
          void handleMediaUpload(file, mediaType);
        }
      };
    },
    [handleMediaUpload],
  );

  const handleToolbarImage = useCallback(() => {
    handleToolbarFile("image/*", "image");
  }, [handleToolbarFile]);

  const handleToolbarVideo = useCallback(() => {
    handleToolbarFile("video/*", "video");
  }, [handleToolbarFile]);

  const quillModules = useMemo(
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
          image: handleToolbarImage,
          video: handleToolbarVideo,
        },
      },
    }),
    [handleToolbarImage, handleToolbarVideo],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const text = extractPlainText(content);
    const nextErrors: Record<string, string> = {};

    if (!title.trim()) {
      nextErrors.title = "제목을 입력해 주세요.";
    } else if (title.trim().length < 2) {
      nextErrors.title = "제목은 최소 2자 이상 입력해 주세요.";
    }

    if (!text) {
      nextErrors.content = "내용을 입력해 주세요.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (isUploadingMedia) {
      setToast("미디어 업로드가 끝난 뒤 다시 시도해 주세요.");
      return;
    }

    setSaving(true);
    try {
      await axios.post("/api/boards", {
        title: title.trim(),
        content,
        boardType,
      });

      navigate("/board");
    } catch (error: unknown) {
      const res = (error as HttpErrorLike)?.response?.data;

      if (res?.code === "VALIDATION_ERROR") {
        const fieldErrors: Record<string, string> = {};
        (res.fields ?? []).forEach((f) => {
          if (f.field && f.messages?.[0]) {
            fieldErrors[f.field] = f.messages[0];
          }
        });
        setErrors(fieldErrors);
      } else {
        setToast("글 등록에 실패했습니다.");
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
            글 작성
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
            </Box>

            <Divider sx={{ my: 2, borderColor: "rgba(0,0,0,0.06)" }} />

            <TextField
              fullWidth
              value={title}
              placeholder="제목을 입력하세요"
              onChange={(e) => {
                setTitle(e.target.value);
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
                  minHeight: 360,
                  borderRadius: "0 0 8px 8px",
                  borderColor: "rgba(0,0,0,0.12)",
                },
                "& .ql-editor": {
                  minHeight: 320,
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
                modules={quillModules}
                style={{ marginBottom: 45 }}
              />
              {errors.content ? (
                <Typography color="error" sx={{ mt: 1 }}>
                  {errors.content}
                </Typography>
              ) : null}
              {isUploadingMedia ? (
                <Typography sx={{ mt: 1, color: "#64748b", fontSize: 13 }}>
                  이미지/영상 업로드 중입니다...
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
                onClick={() => navigate("/board")}
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
