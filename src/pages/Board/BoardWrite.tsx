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
import { boardTheme } from "../../theme/boardTheme";

export default function BoardWrite() {
  const navigate = useNavigate();
  const MAIN_COLOR = "#ff6b00"; // ✅ 기존 컨셉 색상 유지

  const categories = [
    { key: "후기", label: "후기" },
    { key: "공지", label: "공지" },
  ];

  const [category, setCategory] = useState("후기");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [image, setImage] = useState<{
    file: File;
    previewUrl: string;
  } | null>(null);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setImage({ file, previewUrl });
  };

  /** ✅ 글 등록 */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await axios.post(
        "/api/boards",
        {
          title,
          content,
          boardType: category === "공지" ? "NOTICE" : "REVIEW",
        },
      );

      navigate("/board");
    } catch (error) {
      alert("글 등록에 실패했습니다.");
      console.error(error);
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
              글 작성
            </Typography>

            <Box component="form" onSubmit={handleSubmit}>
              {/* ===== 말머리 ===== */}
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <Typography sx={{ mr: 2, fontWeight: 600 }}>
                  말머리
                </Typography>
                <ButtonGroup size="small">
                  {categories.map((c) => (
                    <Button
                      key={c.key}
                      variant={
                        category === c.key
                          ? "contained"
                          : "outlined"
                      }
                      sx={{
                        bgcolor:
                          category === c.key ? MAIN_COLOR : "#fff",
                        color:
                          category === c.key ? "#fff" : MAIN_COLOR,
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

              {/* ===== 제목 ===== */}
              <TextField
                fullWidth
                placeholder="제목을 입력하세요"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                sx={{ mb: 3 }}
              />

              {/* ===== 이미지 ===== */}
              <Box
                sx={{
                  border: "1px solid #ddd",
                  p: 1,
                  mb: 1,
                  bgcolor: "#fff3e6", // 🔸 기존 톤 유지
                }}
              >
                <Button
                  size="small"
                  variant="outlined"
                  sx={{
                    color: MAIN_COLOR,
                    borderColor: MAIN_COLOR,
                  }}
                  onClick={handleImageClick}
                >
                  🖼 이미지
                </Button>
                {image && (
                  <Typography variant="caption" sx={{ ml: 2 }}>
                    {image.file.name}
                  </Typography>
                )}
              </Box>

              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleImageChange}
              />

              {/* ===== 내용 ===== */}
              <TextField
                fullWidth
                multiline
                rows={12}
                placeholder="내용을 입력하세요"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                sx={{ mb: 3 }}
              />

              {/* ===== 버튼 ===== */}
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
