import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  CircularProgress,
  FormControlLabel,
  Snackbar,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {
  fetchAdminBoardDetail,
  hideAdminBoard,
  isAdminEndpointUnsupported,
  restoreAdminBoard,
  updateAdminBoard,
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

export default function BoardEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [boardType, setBoardType] = useState<BoardType>("NOTICE");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [hidden, setHidden] = useState(false);
  const [originHidden, setOriginHidden] = useState(false);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState("");
  const [warning, setWarning] = useState("");

  const quillRef = useRef<ReactQuill | null>(null);

  useEffect(() => {
    if (!id) return;

    const run = async () => {
      setLoading(true);
      try {
        const data = await fetchAdminBoardDetail(id);
        setTitle(data.title ?? "");
        setContent(data.contentHtml ?? data.content ?? "");
        setBoardType(data.boardType === "NOTICE" ? "NOTICE" : "REVIEW");
        const isHidden = Boolean(data.hidden);
        setHidden(isHidden);
        setOriginHidden(isHidden);
        setWarning("");
      } catch {
        setWarning("게시글 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [id]);

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

  const syncHiddenState = async () => {
    if (!id || hidden === originHidden) return;

    if (hidden) {
      await hideAdminBoard(id);
    } else {
      await restoreAdminBoard(id);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!id) return;

    if (!validate()) return;
    if (uploading) {
      setToast("미디어 업로드가 끝난 후 다시 시도해주세요.");
      return;
    }

    setSaving(true);
    try {
      await updateAdminBoard(id, {
        title: title.trim(),
        content,
        boardType,
      });

      try {
        await syncHiddenState();
      } catch (error: unknown) {
        if (isAdminEndpointUnsupported(error)) {
          setToast("숨김/복구 API가 아직 준비되지 않았습니다. 본문 수정은 완료되었습니다.");
        } else {
          setToast("본문 수정은 완료되었지만 숨김 상태 반영에 실패했습니다.");
        }
      }

      navigate(`/admin/board/${id}`, { replace: true });
    } catch (error: unknown) {
      const fieldErrors = parseValidationErrors(error);
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
      } else {
        setToast("게시글 수정에 실패했습니다.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={boardTheme}>
      <Box sx={{ maxWidth: 980, mx: "auto", mt: 4, px: 1 }}>
        {warning ? <Alert severity="warning" sx={{ mb: 2 }}>{warning}</Alert> : null}

        <Card variant="outlined" sx={{ borderColor: "#ececec" }}>
          <CardContent>
            <Typography sx={{ fontSize: 28, fontWeight: 800, color: "#ff6b00", mb: 2 }}>
              관리자 글 수정
            </Typography>

            <Box component="form" onSubmit={handleSubmit}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, flexWrap: "wrap" }}>
                <Typography sx={{ fontWeight: 700 }}>말머리</Typography>
                <ButtonGroup size="small">
                  <Button
                    variant={boardType === "NOTICE" ? "contained" : "outlined"}
                    sx={{
                      bgcolor: boardType === "NOTICE" ? "#ff6b00" : "#fff",
                      color: boardType === "NOTICE" ? "#fff" : "#ff6b00",
                      borderColor: "#ff6b00",
                    }}
                    onClick={() => setBoardType("NOTICE")}
                  >
                    공지
                  </Button>
                  <Button
                    variant={boardType === "REVIEW" ? "contained" : "outlined"}
                    sx={{
                      bgcolor: boardType === "REVIEW" ? "#ff6b00" : "#fff",
                      color: boardType === "REVIEW" ? "#fff" : "#ff6b00",
                      borderColor: "#ff6b00",
                    }}
                    onClick={() => setBoardType("REVIEW")}
                  >
                    일반
                  </Button>
                </ButtonGroup>

                <Box sx={{ flex: 1 }} />

                <FormControlLabel
                  control={<Switch checked={hidden} onChange={(_, value) => setHidden(value)} />}
                  label={hidden ? "숨김" : "노출"}
                />
              </Box>

              <TextField
                fullWidth
                value={title}
                placeholder="제목"
                onChange={(event) => {
                  setTitle(event.target.value);
                  if (errors.title) {
                    setErrors((prev) => ({ ...prev, title: "" }));
                  }
                }}
                error={Boolean(errors.title)}
                helperText={errors.title}
                sx={{ mb: 2 }}
              />

              <Box sx={{ mb: 2 }}>
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
                  style={{ height: 420, marginBottom: 45 }}
                />
                {errors.content ? (
                  <Typography sx={{ color: "#d32f2f", fontSize: 13, mt: 0.5 }}>{errors.content}</Typography>
                ) : null}
                {uploading ? (
                  <Typography sx={{ color: "#777", fontSize: 13, mt: 0.5 }}>
                    미디어 업로드 중입니다...
                  </Typography>
                ) : null}
              </Box>

              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                <Button variant="outlined" onClick={() => navigate(`/admin/board/${id}`)}>취소</Button>
                <Button
                  type="submit"
                  variant="contained"
                  sx={{ bgcolor: "#ff6b00", "&:hover": { bgcolor: "#e65f00" } }}
                  disabled={saving}
                >
                  {saving ? <CircularProgress size={18} color="inherit" /> : "저장"}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
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
