import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Divider,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import ReactQuill, { Quill } from "react-quill-new";
import QuillTableBetter from "quill-table-better";
import "react-quill-new/dist/quill.snow.css";
import "quill-table-better/dist/quill-table-better.css";
import hljs from "highlight.js";
import "highlight.js/styles/atom-one-dark.css";
import axios from "../../common/axios";
import { blogTheme } from "./theme/blogTheme";
import { uploadAdminBlogImage } from "./api/adminBlogImageUpload";
import { registerAdminBlogQuillModules } from "./quillSetup";
import { ADMIN_BLOG_API } from "./api/adminBlogApi";

registerAdminBlogQuillModules(Quill);

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

export default function AdminBlogEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const ACCENT = "#ff6b00";
  const MAX_THUMBNAIL_SIZE = 10 * 1024 * 1024;

  // const categories = [
  //   { key: "후기", label: "후기" },
  //   { key: "공지", label: "공지" },
  // ];

  const [category, setCategory] = useState("후기");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pendingDelta, setPendingDelta] = useState<unknown>(null);
  const [pendingHtml, setPendingHtml] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [thumbnailFileName, setThumbnailFileName] = useState("");
  const [thumbnailUploading, setThumbnailUploading] = useState(false);

  const quillRef = useRef<ReactQuill | null>(null);
  const thumbnailInputRef = useRef<HTMLInputElement | null>(null);
  const isHydratingRef = useRef(false);

  const extractPlainText = (html: string) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent?.trim() ?? "";
  };

  const hasMediaContent = (html: string) => /<(img|video|iframe)\b/i.test(html);

  const parseContentDelta = (rawDelta: unknown) => {
    if (!rawDelta) return null;
    if (typeof rawDelta === "object") return rawDelta;
    if (typeof rawDelta !== "string") return null;
    try {
      return JSON.parse(rawDelta);
    } catch {
      return null;
    }
  };

  const insertMediaToEditor = useCallback(
    (fileUrl: string, fileType: string) => {
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
    },
    [],
  );

  const handleMediaUpload = useCallback(
    async (file: File) => {
      try {
        setIsUploadingMedia(true);
        const fileUrl = await uploadAdminBlogImage(file);
        insertMediaToEditor(fileUrl, file.type || "");
      } catch (error: unknown) {
        console.error(error);
        const status = (error as HttpErrorLike)?.response?.status;
        const uploadStep = (error as HttpErrorLike)?.uploadStep;

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
          [{ header: [1, 2, 3, 4, 5, 6, false] }],
          [{ font: [] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }, { list: "check" }],
          [{ indent: "-1" }, { indent: "+1" }],
          [{ align: [] }],
          [{ color: [] }, { background: [] }],
          ["table-better"],
          [{ direction: "rtl" }],
          //[{ script: "sub" }, { script: "super" }],
          //["link", "image", "video", "code-block", "formula"],
          ["link", "image", "video"],
          ["clean"],
        ],
        handlers: {
          image: handleToolbarMedia,
        },
      },
      table: false,
      "table-better": {
        language: "en_US",
        menus: [
          "column",
          "row",
          "merge",
          "table",
          "cell",
          "wrap",
          "copy",
          "delete",
        ],
        toolbarTable: true,
      },
      keyboard: {
        bindings: QuillTableBetter.keyboardBindings,
      },
      imageResize: {
        parchment: Quill.import("parchment"),
        modules: ["Resize", "DisplaySize", "Toolbar"],
      },
      syntax: { hljs },
    }),
    [handleToolbarMedia],
  );

  useEffect(() => {
    axios.get(`${ADMIN_BLOG_API}/${id}`).then((res) => {
      const data = res.data.data;
      const html = data.contentHtml ?? data.content ?? "";
      setTitle(data.title ?? "");
      setCategory(data.blogType === "NOTICE" ? "공지" : "후기");
      setContent("");
      setPendingHtml(html);
      setPendingDelta(parseContentDelta(data.contentDelta));
      const existingImageUrl = data.imageUrl ?? "";
      setThumbnailUrl(existingImageUrl);
      setThumbnailFileName(existingImageUrl ? "현재 썸네일" : "");
    });
  }, [id]);

  const handleThumbnailPick = () => {
    thumbnailInputRef.current?.click();
  };

  const handleThumbnailChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("썸네일은 이미지 파일만 업로드할 수 있습니다.");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_THUMBNAIL_SIZE) {
      alert("썸네일 파일 크기는 10MB 이하만 가능합니다.");
      e.target.value = "";
      return;
    }

    try {
      setThumbnailUploading(true);
      const url = await uploadAdminBlogImage(file);
      setThumbnailUrl(url);
      setThumbnailFileName(file.name);
    } catch (error: unknown) {
      console.error(error);
      const status = (error as HttpErrorLike)?.response?.status;
      const uploadStep = (error as HttpErrorLike)?.uploadStep;

      if (uploadStep === "presign" && (status === 401 || status === 403)) {
        alert("로그인이 필요합니다.");
      } else if (uploadStep === "s3-put" && status === 403) {
        alert("S3 업로드 권한 또는 CORS 설정을 확인해 주세요.");
      } else {
        alert("썸네일 업로드에 실패했습니다. 다시 시도해 주세요.");
      }
    } finally {
      setThumbnailUploading(false);
      e.target.value = "";
    }
  };

  useEffect(() => {
    if (!pendingHtml && !pendingDelta) return;
    const intervalId = window.setInterval(() => {
      const editor = quillRef.current?.getEditor();
      if (!editor) return;
      const tableModule = editor.getModule("table-better");
      if (!tableModule) return;

      isHydratingRef.current = true;

      const length = editor.getLength();
      if (length > 0) {
        editor.deleteText(0, length, Quill.sources.SILENT);
      }

      if (pendingDelta) {
        editor.updateContents(pendingDelta as never, Quill.sources.API);
      } else {
        const deltaFromHtml = editor.clipboard.convert({ html: pendingHtml });
        editor.updateContents(deltaFromHtml, Quill.sources.API);
      }

      setContent(editor.root.innerHTML);
      setPendingDelta(null);
      setPendingHtml("");
      window.setTimeout(() => {
        isHydratingRef.current = false;
      }, 0);
      window.clearInterval(intervalId);
    }, 50);

    return () => window.clearInterval(intervalId);
  }, [pendingDelta, pendingHtml]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const editor = quillRef.current?.getEditor();
    const delta = editor?.getContents() ?? null;
    const html = editor?.root?.innerHTML ?? content;
    const text = extractPlainText(html);
    const hasMedia = hasMediaContent(html);

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

    if (thumbnailUploading) {
      alert("썸네일 업로드가 끝난 뒤 저장해 주세요.");
      return;
    }

    try {
      await axios.put(`${ADMIN_BLOG_API}/${id}`, {
        title,
        content: html,
        contentHtml: html,
        contentDelta: delta ? JSON.stringify(delta) : null,
        blogType: category === "공지" ? "NOTICE" : "REVIEW",
        imageUrl: thumbnailUrl || null,
      });

      navigate(`/admin/blog/${id}`);
    } catch (error: unknown) {
      const res = (error as HttpErrorLike)?.response?.data;
      if (res?.code === "VALIDATION_ERROR") {
        const fieldErrors: Record<string, string[]> = {};
        (res.fields ?? []).forEach((f) => {
          fieldErrors[f.field] = f.messages;
        });
        setErrors(fieldErrors);
      } else {
        alert("글 수정에 실패했습니다.");
      }
    }
  };

  return (
    <ThemeProvider theme={blogTheme}>
      <Box
        sx={{
          maxWidth: 1100,
          mx: "auto",
          py: 5,
          px: { xs: 2, sm: 3 },
        }}
      >
        {/* 페이지 타이틀 */}
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
            글 수정
          </Typography>
          <Typography sx={{ fontSize: 14, color: "#64748b" }}>
            블로그 글을 수정합니다
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
              {/* <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
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
              </Box> */}

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

              <Divider sx={{ my: 2, borderColor: "rgba(0,0,0,0.06)" }} />

              <Box
                sx={{
                  mb: 3,
                  p: 2,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "rgba(0,0,0,0.06)",
                  bgcolor: "#f8fafc",
                }}
              >
                <Typography
                  sx={{
                    fontSize: 14,
                    fontWeight: 600,
                    mb: 1.5,
                    color: "#64748b",
                  }}
                >
                  썸네일 이미지
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    flexWrap: "wrap",
                    mb: 1,
                  }}
                >
                  <Button
                    variant="outlined"
                    onClick={handleThumbnailPick}
                    disabled={thumbnailUploading}
                    sx={{
                      color: ACCENT,
                      borderColor: ACCENT,
                      borderRadius: 1.5,
                      "&:hover": {
                        borderColor: "#e55f00",
                        bgcolor: "rgba(255,107,0,0.04)",
                      },
                    }}
                  >
                    {thumbnailUploading ? "업로드 중..." : "썸네일 업로드"}
                  </Button>

                  {thumbnailUrl && (
                    <Button
                      variant="text"
                      color="error"
                      onClick={() => {
                        setThumbnailUrl("");
                        setThumbnailFileName("");
                      }}
                    >
                      썸네일 제거
                    </Button>
                  )}

                  <Typography sx={{ fontSize: 13, color: "#64748b" }}>
                    {thumbnailFileName || "선택된 썸네일 없음"}
                  </Typography>
                </Box>

                {thumbnailUrl && (
                  <Box
                    component="img"
                    src={thumbnailUrl}
                    alt="썸네일 미리보기"
                    sx={{
                      width: 220,
                      height: 130,
                      objectFit: "cover",
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: "rgba(0,0,0,0.06)",
                    }}
                  />
                )}

                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleThumbnailChange}
                />
              </Box>

              <Divider sx={{ my: 3, borderColor: "rgba(0,0,0,0.06)" }} />

              <Box
                sx={{
                  mb: 2,
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
                  key={id}
                  ref={quillRef}
                  theme="snow"
                  defaultValue=""
                  onChange={(value, _delta, source) => {
                    if (isHydratingRef.current && source !== "user") {
                      return;
                    }
                    setContent(value);
                    setErrors((prev) => ({ ...prev, content: [] }));
                  }}
                  modules={quillModules}
                />

                {errors.content && (
                  <Typography color="error" sx={{ mt: 1 }}>
                    {errors.content[0]}
                  </Typography>
                )}

                {isUploadingMedia && (
                  <Typography sx={{ mt: 1, color: "#64748b", fontSize: 13 }}>
                    파일 업로드 중입니다...
                  </Typography>
                )}
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
                  onClick={() => navigate("/admin/blog")}
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
                >
                  저장
                </Button>
              </Box>
            </Box>
        </Paper>
      </Box>
    </ThemeProvider>
  );
}
