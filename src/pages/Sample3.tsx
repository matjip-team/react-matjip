import { useRef, useMemo, useEffect, useState } from "react";
import ReactQuill, { Quill } from "react-quill-new";
import QuillTableBetter from "quill-table-better";
import "react-quill-new/dist/quill.snow.css";
import "quill-table-better/dist/quill-table-better.css";

import hljs from "highlight.js";
import "highlight.js/styles/atom-one-dark.css";
import "./styles.css"; // <-- 여기서 import

type Delta = Parameters<Quill["setContents"]>[0];

// import ImageResize from 'quill-image-resize-module-react';

import ImageResize from "quill-image-resize";

Quill.register({ "modules/table-better": QuillTableBetter }, true);
Quill.register("modules/imageResize", ImageResize);

const QuillTableBetterDemo = () => {
  const quillRef = useRef<ReactQuill | null>(null);

  const [savedDelta, setSavedDelta] = useState<Delta | null>(null);

  const modules = useMemo(
    // useMemo를 사용하는 이유: 렌더링마다 modules 객체를 새로 만들면 ReactQuill이 리렌더링 시 에디터 초기화 될 수 있음.
    () => ({
      toolbar: {
        container: [
          [{ header: 1 }, { header: 2 }],
          ["bold", "italic", "underline", "strike"],
          ["link", "image", "video", "code-block", "formula"],
          [{ list: "ordered" }, { list: "bullet" }, { list: "check" }],
          [{ indent: "-1" }, { indent: "+1" }],
          [{ direction: "rtl" }],
          [{ size: ["small", false, "large", "huge"] }],
          [{ color: [] }, { background: [] }],
          [{ font: [] }],
          [{ align: [] }],
          ["table-better"],
          ["clean"],
          [{ direction: "rtl" }],
          [{ header: [1, 2, 3, 4, 5, 6, false] }],
          [{ size: ["small", false, "large", "huge"] }], // custom dropdown
          [{ script: "sub" }, { script: "super" }], // superscript/subscript
        ],
      },
      table: false, // Disable default table module
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
        bindings: QuillTableBetter.keyboardBindings, // keyboard: 테이블 단축키 바인딩
      },
      imageResize: {
        parchment: Quill.import("parchment"),
        modules: ["Resize", "DisplaySize", "Toolbar"],
      },
      syntax: { hljs }, // syntax 하이라이트 설정
      handlers: {
        image: async function () {
          const input = document.createElement("input");
          input.setAttribute("type", "file");
          input.setAttribute("accept", "image/*");
          input.click();

          input.onchange = async () => {
            const file = input.files ? input.files[0] : null;

            if (file) {
              const formData = new FormData();
              formData.append("image", file);

              try {
                // 서버에 이미지 업로드 요청
                const response = await fetch("/api/spring/upload", {
                  method: "POST", // 이미지 업로드용 POST 요청
                  body: formData,
                });

                const data = await response.json();
                const imageUrl = data.data.url; // 업로드된 이미지 URL

                // 에디터에 이미지 삽입
                const editor = quillRef.current?.getEditor();
                const range = editor?.getSelection()?.index || 0;
                editor?.insertEmbed(range, "image", imageUrl, "user");
              } catch (error) {
                console.error("이미지 업로드 실패:", error);
              }
            }
          };
        },
      },
    }),
    [],
  );

  useEffect(() => {
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      const html = `
      <table class="ql-table-better">
        <tbody>
          <tr><td>1</td><td>2</td><td>3</td></tr>
          <tr><td>4</td><td>5</td><td>6</td></tr>
          <tr><td>7</td><td>8</td><td>9</td></tr>
        </tbody>
      </table>`;
      editor.clipboard.dangerouslyPasteHTML(html); // dangerouslyPasteHTML은 HTML 그대로 삽입
    }
  }, []);

  const handleSave = async () => {
    if (!quillRef.current) return;

    // 1️⃣ HTML 형식으로 에디터 내용 가져오기
    const editor = quillRef.current.getEditor();
    const htmlContent = editor.root.innerHTML;

    // 2️⃣ 서버로 POST 요청
    try {
      const response = await fetch("https://example.com/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: htmlContent }),
      });

      if (!response.ok) throw new Error("저장 실패!");

      alert("서버에 저장 완료 🎉");
    } catch (err) {
      console.error(err);
      alert("저장 중 오류 발생 😢");
    }
  };

  // 불러오기
  const handleLoad = async () => {
    try {
      const res = await fetch("/api/spring/load");
      const data: Delta = await res.json();
      setSavedDelta(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (savedDelta && quillRef.current) {
      const editor = quillRef.current.getEditor();
      editor.setContents(savedDelta); // 이제 Delta 타입이라 오류 없음
    }
  }, [savedDelta]);

  return (
    <>
      <div style={{ padding: "40px", maxWidth: "900px", margin: "0 auto" }}>
        <h1>🍽 Quill 샘플 페이지</h1>
        <p>Table, 이미지 리사이즈, 동영상, 이미지 상/중/하 정렬 포함</p>

        {/* 이미지 상/중/하 버튼 */}
        <div style={{ marginBottom: 10 }}></div>

        <ReactQuill
          ref={quillRef}
          theme="snow"
          modules={modules}
          style={{ height: 400 }}
          className="custom-quill"
        />
      </div>
      <button onClick={handleSave} style={{ marginTop: 10 }}>
        저장
      </button>
      <button onClick={handleLoad} style={{ marginTop: 10 }}>
        불러오기
      </button>
    </>
  );
};

export default QuillTableBetterDemo;
