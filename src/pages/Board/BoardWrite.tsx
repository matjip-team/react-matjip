import { useState, useRef } from "react";
import { Button, ButtonGroup, Form, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

export default function BoardWrite() {
  const navigate = useNavigate();

  const categories = [
    { key: "후기", label: "후기" },
    { key: "공지", label: "공지" },
  ];

  const [category, setCategory] = useState("후기");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const fileInputRef = useRef(null);
  const [image, setImage] = useState(null);

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);

    setImage({
      file,
      previewUrl,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newPost = {
      id: Date.now(),
      type: category,
      title,
      author: "익명",
      date: new Date().toLocaleDateString("ko-KR"),
      views: 0,
      likes: 0,
      content,
      imageUrl: image?.previewUrl || null,
    };

    navigate("/board", {
      state: { newPost },
    });
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

            {/* 에디터 툴바 (이미지) */}
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
