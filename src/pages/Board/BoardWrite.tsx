import { useState, useRef } from "react";
import { Button, ButtonGroup, Form, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function BoardWrite() {
  const navigate = useNavigate();

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

  // ✅ 핵심: 서버에 글 저장
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await axios.post(
        "http://localhost:8080/api/boards", //  여기까지함
        {
          title,
          content,
          boardType: category === "공지" ? "NOTICE" : "REVIEW",
        },
        {
          params: {
            userId: 1, // ⚠️ JWT 붙기 전 임시
          },
        }
      );

      // 저장 성공 → 목록으로 이동
      navigate("/board");
    } catch (error) {
      alert("글 등록에 실패했습니다.");
      console.error(error);
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: "900px" }}>
      <Card>
        <Card.Body>
          <h3 className="mb-4">글 작성</h3>

          <Form onSubmit={handleSubmit}>
            {/* 말머리 */}
            <div className="mb-3 d-flex align-items-center">
              <span className="me-3 fw-bold">말머리</span>
              <ButtonGroup>
                {categories.map((c) => (
                  <Button
                    key={c.key}
                    size="sm"
                    variant={
                      category === c.key
                        ? "primary"
                        : "outline-secondary"
                    }
                    onClick={() => setCategory(c.key)}
                  >
                    {c.label}
                  </Button>
                ))}
              </ButtonGroup>
            </div>

            {/* 제목 */}
            <Form.Group className="mb-3">
              <Form.Control
                placeholder="제목을 입력하세요"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Form.Group>

            {/* 이미지 (아직 서버 연동 안 함, UI만 유지) */}
            <div className="border p-2 mb-0 bg-light small">
              <Button
                size="sm"
                variant="outline-secondary"
                onClick={handleImageClick}
              >
                🖼 이미지
              </Button>
              {image && (
                <span className="ms-2 text-muted">
                  {image.file.name}
                </span>
              )}
            </div>

            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleImageChange}
            />

            {/* 내용 */}
            <Form.Control
              as="textarea"
              rows={12}
              className="rounded-0"
              placeholder="내용을 입력하세요"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />

            {/* 버튼 */}
            <div className="d-flex justify-content-end mt-4">
              <Button
                variant="secondary"
                className="me-2"
                onClick={() => navigate("/board")}
              >
                취소
              </Button>
              <Button type="submit">등록</Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}
