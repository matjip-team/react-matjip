import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  TextField,
  Typography,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import axios from "../common/axios";
import { boardTheme } from "./theme/boardTheme";
import { uploadBoardImage } from "./api/boardImageUpload";

export default function BoardEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const MAIN_COLOR = "#ff6b00";

  const categories = [
    { key: "후기", label: "후기" },
    { key: "공지", label: "공지" },
  ];

  const [category, setCategory] = useState("후기");
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

  const hasMediaContent = (html: string) => /<(img|video|iframe)\b/i.test(html);

  const insertMediaToEditor = useCallback((fileUrl: string, fileType: string) => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;

    const range = quill.getSelection(true);
    const index = range ? range.index : quill.getLength();

    if (fileType.startsWith("video/")) {
      quill.insertEmbed(index, "video", fileUrl, "user");
      quill.setSelection(index + 1);
      return;
    }

    quill.insertEmbed(index, "image", fileUrl, "user");
    quill.setSelection(index + 1);
  }, []);

  const handleMediaUpload = useCallback(
    async (file: File) => {
      try {
        setIsUploadingMedia(true);
        const fileUrl = await uploadBoardImage(file);
        insertMediaToEditor(fileUrl, file.type || "");
      } catch (error: any) {
        console.error(error);
        const status = error?.response?.status;
        const uploadStep = error?.uploadStep;

        if (uploadStep === "presign" && (status === 401 || status === 403)) {
          alert("로그인이 필요합니다.");
        } else if (uploadStep === "s3-put" && status === 403) {
          alert("S3 업로드 권한 또는 CORS 설정을 확인해 주세요.");
        } else {
          alert("파일 업로드에 실패했습니다. 다시 시도해 주세요.");
        }
      } finally {
        setIsUploadingMedia(false);
      }
    },
    [insertMediaToEditor],
  );

  const handleToolbarMedia = useCallback(() => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*,video/*");
    input.click();

    input.onchange = () => {
      const file = input.files?.[0];
      if (file) {
        void handleMediaUpload(file);
      }
    };
  }, [handleMediaUpload]);

  const quillModules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          ["link", "image"],
          ["clean"],
        ],
        handlers: {
          image: handleToolbarMedia,
        },
      },
    }),
    [handleToolbarMedia],
  );

  useEffect(() => {
    axios.get(`/api/boards/${id}`).then((res) => {
      const data = res.data.data;
      setTitle(data.title ?? "");
      setCategory(data.boardType === "NOTICE" ? "공지" : "후기");
      setContent(data.contentHtml ?? data.content ?? "");
    });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const editor = quillRef.current?.getEditor();
    const delta = editor?.getContents() ?? null;
    const html = content;
    const text = extractPlainText(content);
    const hasMedia = hasMediaContent(content);

    if (!title.trim()) {
      setErrors({ title: ["제목을 입력하십시오."] });
      return;
    }

    if (title.trim().length < 2) {
      setErrors({ title: ["제목은 최소 2자 이상 입력해 주십시오."] });
      return;
    }

    if (!text && !hasMedia) {
      setErrors({ content: ["내용을 입력해 주세요."] });
      return;
    }

    try {
      await axios.put(`/api/boards/${id}`, {
        title,
        content: html,
        contentHtml: html,
        contentDelta: delta ? JSON.stringify(delta) : null,
        boardType: category === "공지" ? "NOTICE" : "REVIEW",
      });

      navigate(`/board/${id}`);
    } catch (error: any) {
      const res = error?.response?.data;
      if (res?.code === "VALIDATION_ERROR") {
        const fieldErrors: Record<string, string[]> = {};
        res.fields.forEach((f: any) => {
          fieldErrors[f.field] = f.messages;
        });
        setErrors(fieldErrors);
      } else {
        alert("글 수정에 실패했습니다.");
      }
    }
  };

  return (
    <ThemeProvider theme={boardTheme}>
      <Box sx={{ maxWidth: 900, mx: "auto", mt: 5 }}>
        <Card>
          <CardContent>
            <Typography
              variant="h5"
              sx={{ mb: 3, color: MAIN_COLOR, fontWeight: 700 }}
            >
              글 수정
            </Typography>

            <Box component="form" onSubmit={handleSubmit}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <Typography sx={{ mr: 2, fontWeight: 600 }}>말머리</Typography>

                <ButtonGroup size="small">
                  {categories.map((c) => (
                    <Button
                      key={c.key}
                      variant={category === c.key ? "contained" : "outlined"}
                      sx={{
                        bgcolor: category === c.key ? MAIN_COLOR : "#fff",
                        color: category === c.key ? "#fff" : MAIN_COLOR,
                        borderColor: MAIN_COLOR,
                      }}
                      onClick={() => setCategory(c.key)}
                    >
                      {c.label}
                    </Button>
                  ))}
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
                    파일 업로드 중입니다...
                  </Typography>
                )}
              </Box>

              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  variant="outlined"
                  sx={{ mr: 1, color: MAIN_COLOR, borderColor: MAIN_COLOR }}
                  onClick={() => navigate(-1)}
                >
                  취소
                </Button>

                <Button type="submit" variant="contained" sx={{ bgcolor: MAIN_COLOR }}>
                  저장
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </ThemeProvider>
  );
}
