import { useState, useRef } from "react";
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
import axios from "../common/axios";
import { ThemeProvider } from "@mui/material/styles";
import { boardTheme } from "./theme/boardTheme";
// import { Editor } from "@toast-ui/react-editor";
// import "@toast-ui/editor/dist/toastui-editor.css";

// 게시글 작성 페이지

export default function BoardWrite() {
  const navigate = useNavigate();
  const MAIN_COLOR = "#ff6b00";

    // 말머리 옵션

  const categories = [
    { key: "후기", label: "후기" },
    { key: "공지", label: "공지" },
  ];

    // 상태 관리

  const [category, setCategory] = useState("후기");
  const [title, setTitle] = useState("");

  const editorRef = useRef<any>(null);

  const [errors, setErrors] = useState<Record<string, string[]>>({});

    // 글 등록

  // 글 등록 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const editorInstance = editorRef.current?.getInstance();
    const html = editorInstance.getHTML();
    const text = editorInstance.getMarkdown().trim();

    // 프론트 1차 검증

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

    // 서버 요청

    try {
      await axios.post("/api/boards", {
        title,
        content: html,
        boardType: category === "공지" ? "NOTICE" : "REVIEW",
      });

      navigate("/board");
    } catch (error: any) {
      const res = error?.response?.data;

      if (res?.code === "VALIDATION_ERROR") {
        const fieldErrors: Record<string, string[]> = {};

        res.fields.forEach((f: any) => {
          fieldErrors[f.field] = f.messages;
        });

        setErrors(fieldErrors);
      } else {
        alert("글 등록에 실패했습니다.");
      }
    }
  };

    // 렌더

  return (
    <ThemeProvider theme={boardTheme}>
      <Box sx={{ maxWidth: 900, mx: "auto", mt: 5 }}>
        <Card>
          <CardContent>
            {/* 제목 */}
            <Typography
              variant="h5"
              sx={{ mb: 3, color: MAIN_COLOR, fontWeight: 700 }}
            >
              글 작성
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
                        "&:hover": {
                          bgcolor: MAIN_COLOR,
                          color: "#fff",
                        },
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
                onChange={(e) => {
                  setTitle(e.target.value);
                  setErrors((prev) => ({ ...prev, title: [] }));
                }}
                error={!!errors.title}
                helperText={errors.title?.[0]}
                sx={{ mb: 3 }}
              />

              {/* 에디터 */}


              {/* 버튼 */}
              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  variant="outlined"
                  sx={{
                    mr: 1,
                    color: MAIN_COLOR,
                    borderColor: MAIN_COLOR,
                  }}
                  onClick={() => navigate("/board")}
                >
                  취소
                </Button>

                <Button
                  type="submit"
                  variant="contained"
                  sx={{
                    bgcolor: MAIN_COLOR,
                    "&:hover": { bgcolor: MAIN_COLOR },
                  }}
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
