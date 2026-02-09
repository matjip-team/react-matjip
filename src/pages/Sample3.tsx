// src/pages/WebEditorFullSample.tsx
import React, { useState, useRef } from "react";
import ReactQuill, { Quill } from "react-quill";
import { Box, Button } from "@mui/material";
import "react-quill/dist/quill.snow.css";

// 이미지 크기 조절
// @ts-ignore
import ImageResize from "quill-image-resize-module-react";

// 테이블 관련
import QuillTable from "quill-table";
import QuillTableUI from "quill-table-ui";

// 모듈 등록
Quill.register("modules/imageResize", ImageResize);
Quill.register("modules/table", QuillTable);
Quill.register("modules/tableUI", QuillTableUI);

// 이미지 업로드 핸들러
function imageHandler(this: any) {
  const input = document.createElement("input");
  input.setAttribute("type", "file");
  input.setAttribute("accept", "image/*");
  input.click();

  input.onchange = () => {
    const file = input.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const range = this.quill.getSelection(true);
        this.quill.insertEmbed(range.index, "image", e.target?.result);
        this.quill.setSelection(range.index + 1);
      };
      reader.readAsDataURL(file);
    }
  };
}

// Quill 모듈 설정
const modules = {
  toolbar: {
    container: [
      ["bold", "italic", "underline", "strike"],
      ["link", "image", "table"], // table 버튼 포함
      [{ header: [1, 2, 3, false] }],
      [{ list: "ordered" }, { list: "bullet" }],
      ["clean"],
    ],
    handlers: {
      image: imageHandler,
    },
  },
  imageResize: {
    parchment: Quill.import("parchment"),
    modules: ["Resize", "DisplaySize"],
  },
  table: true,
  tableUI: true,
};

export default function WebEditorFullSample() {
  const [content, setContent] = useState<string>("");
  const [htmlMode, setHtmlMode] = useState<boolean>(false);
  const quillRef = useRef<ReactQuill>(null);

  return (
    <Box sx={{ p: 2 }}>
      <Button
        variant="contained"
        onClick={() => setHtmlMode((prev) => !prev)}
        sx={{ mb: 2 }}
      >
        {htmlMode ? "리치 에디터 모드" : "HTML 모드"}
      </Button>

      {htmlMode ? (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{ width: "100%", minHeight: 200, fontFamily: "monospace" }}
        />
      ) : (
        <ReactQuill
          ref={quillRef}
          value={content}
          onChange={setContent}
          modules={modules}
          theme="snow"
          style={{ height: 300, marginBottom: 20 }}
        />
      )}

      <Box sx={{ mt: 4 }}>
        <h3>Preview</h3>
        <Box
          sx={{
            border: "1px solid #ddd",
            p: 2,
            minHeight: 200,
            backgroundColor: "#fefefe",
          }}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </Box>
    </Box>
  );
}
