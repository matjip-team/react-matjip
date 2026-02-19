import { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  ButtonGroup,
  TextField,
  Card,
  CardContent,
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

export default function BoardWrite() {
  const navigate = useNavigate();
  const MAIN_COLOR = "#ff6b00";

  const [boardType, setBoardType] = useState<BoardType>("REVIEW");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

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
          alert("로그인이 필요합니다.");
        } else if (uploadStep === "s3-put" && status === 403) {
          alert("S3 업로드 권한 또는 CORS 설정을 확인해 주세요.");
        } else {
          alert(mediaType === "video" ? "영상 업로드에 실패했습니다." : "이미지 업로드에 실패했습니다.");
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

    const html = content;
    const text = extractPlainText(content);

    if (!title.trim()) {
      setErrors({ title: ["제목을 입력해 주세요."] });
      return;
    }

    if (title.trim().length < 2) {
      setErrors({ title: ["제목은 최소 2자 이상 입력해 주세요."] });
      return;
    }

    if (!text) {
      setErrors({ content: ["내용을 입력해 주세요."] });
      return;
    }

    if (isUploadingMedia) {
      alert("미디어 업로드가 끝난 뒤 다시 시도해 주세요.");
      return;
    }

    try {
      await axios.post("/api/boards", {
        title,
        content: html,
        boardType,
      });

      navigate("/board");
    } catch (error: unknown) {
      const res = (error as HttpErrorLike)?.response?.data;

      if (res?.code === "VALIDATION_ERROR") {
        const fieldErrors: Record<string, string[]> = {};
        (res.fields ?? []).forEach((f) => {
          fieldErrors[f.field] = f.messages;
        });
        setErrors(fieldErrors);
      } else {
        alert("글 등록에 실패했습니다.");
      }
    }
  };

  return (
    <ThemeProvider theme={boardTheme}>
      <Box sx={{ maxWidth: 900, mx: "auto", mt: 5 }}>
        <Card>
          <CardContent>
            <Typography variant="h5" sx={{ mb: 3, color: MAIN_COLOR, fontWeight: 700 }}>
              글 작성
            </Typography>

            <Box component="form" onSubmit={handleSubmit}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <Typography sx={{ mr: 2, fontWeight: 600 }}>말머리</Typography>

                <ButtonGroup size="small">
                  <Button
                    variant={boardType === "REVIEW" ? "contained" : "outlined"}
                    sx={{
                      bgcolor: boardType === "REVIEW" ? MAIN_COLOR : "#fff",
                      color: boardType === "REVIEW" ? "#fff" : MAIN_COLOR,
                      borderColor: MAIN_COLOR,
                      "&:hover": { bgcolor: MAIN_COLOR, color: "#fff" },
                    }}
                    onClick={() => setBoardType("REVIEW")}
                  >
                    후기
                  </Button>
                  <Button
                    variant={boardType === "NOTICE" ? "contained" : "outlined"}
                    sx={{
                      bgcolor: boardType === "NOTICE" ? MAIN_COLOR : "#fff",
                      color: boardType === "NOTICE" ? "#fff" : MAIN_COLOR,
                      borderColor: MAIN_COLOR,
                      "&:hover": { bgcolor: MAIN_COLOR, color: "#fff" },
                    }}
                    onClick={() => setBoardType("NOTICE")}
                  >
                    공지
                  </Button>
                </ButtonGroup>
              </Box>

              <TextField
                fullWidth
                placeholder="제목을 입력하세요"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setErrors((prev) => ({ ...prev, title: [] }));
                }}
                error={!!errors.title}
                helperText={errors.title?.[0]}
                sx={{ mb: 3 }}
              />

              <Box sx={{ mb: 3 }}>
                <ReactQuill
                  ref={quillRef}
                  theme="snow"
                  value={content}
                  onChange={(value) => {
                    setContent(value);
                    setErrors((prev) => ({ ...prev, content: [] }));
                  }}
                  modules={quillModules}
                  style={{ height: "400px", marginBottom: "45px" }}
                />

                {errors.content && (
                  <Typography color="error" sx={{ mt: 1 }}>
                    {errors.content[0]}
                  </Typography>
                )}

                {isUploadingMedia && (
                  <Typography sx={{ mt: 1, color: "#666", fontSize: 13 }}>
                    이미지/영상 업로드 중입니다...
                  </Typography>
                )}
              </Box>

              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  variant="outlined"
                  sx={{ mr: 1, color: MAIN_COLOR, borderColor: MAIN_COLOR }}
                  onClick={() => navigate("/board")}
                >
                  취소
                </Button>

                <Button
                  type="submit"
                  variant="contained"
                  sx={{ bgcolor: MAIN_COLOR, "&:hover": { bgcolor: MAIN_COLOR } }}
                >
                  등록
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </ThemeProvider>
  );
}
