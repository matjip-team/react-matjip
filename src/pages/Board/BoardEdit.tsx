import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  ButtonGroup,
  TextField,
  Card,
  CardContent,
  Typography,
} from "@mui/material";
import axios from "../common/axios";
import { ThemeProvider } from "@mui/material/styles";
import { boardTheme } from "./theme/boardTheme";
import { Editor } from "@toast-ui/react-editor";
import "@toast-ui/editor/dist/toastui-editor.css";

// 게시글 수정 페이지

export default function BoardEdit() {
  const { id } = useParams(); // 게시글 id
  const navigate = useNavigate();
  const MAIN_COLOR = "#ff6b00";

  const categories = [
    { key: "후기", label: "후기" },
    { key: "공지", label: "공지" },
  ];

  const [category, setCategory] = useState("후기");
  const [title, setTitle] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const editorRef = useRef<any>(null);

  // 기존 게시글 불러오기

  useEffect(() => {
    axios.get(`/api/boards/${id}`).then((res) => {
      const data = res.data.data;

      setTitle(data.title);
      setCategory(data.boardType === "NOTICE" ? "공지" : "후기");

      // 에디터 내용 세팅
      editorRef.current?.getInstance().setHTML(data.content);
    });
  }, [id]);

  // 수정 저장

    // 수정 저장 처리
    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const editorInstance = editorRef.current?.getInstance();
    const html = editorInstance.getHTML();
    const text = editorInstance.getMarkdown().trim();

    if (!title.trim()) {
      setErrors({ title: ["제목을 입력하십시오."] });
      return;
    }

    if (title.trim().length < 2) {
      setErrors({ title: ["제목은 최소 2자 이상 입력해 주십시오."] });
      return;
    }

    if (!text) {
      setErrors({ content: ["내용을 입력해 주세요."] });
      return;
    }

    try {
      await axios.put(`/api/boards/${id}`, {
        title,
        content: html,
        boardType: category === "공지" ? "NOTICE" : "REVIEW",
      });

      navigate(`/board/${id}`);
    } catch {
      alert("글 수정 실패");
    }
  };

    // 렌더

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
              {/* 말머리 */}
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <Typography sx={{ mr: 2, fontWeight: 600 }}>
                  말머리
                </Typography>

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

              {/* 제목 */}
              <TextField
                fullWidth
                placeholder="제목을 입력하세요"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                error={!!errors.title}
                helperText={errors.title?.[0]}
                sx={{ mb: 3 }}
              />

              {/* 에디터 */}
              <Box sx={{ mb: 3 }}>
                <Editor
                  ref={editorRef}
                  initialValue=""
                  previewStyle="vertical"
                  height="400px"
                  initialEditType="wysiwyg"
                />
              </Box>

              {/* 버튼 */}
              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  variant="outlined"
                  sx={{ mr: 1, color: MAIN_COLOR, borderColor: MAIN_COLOR }}
                  onClick={() => navigate(-1)}
                >
                  취소
                </Button>

                <Button
                  type="submit"
                  variant="contained"
                  sx={{ bgcolor: MAIN_COLOR }}
                >
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
