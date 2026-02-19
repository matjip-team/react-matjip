import { useEffect, useMemo, useRef } from "react";
import ReactQuill, { Quill } from "react-quill-new";
import QuillTableBetter from "quill-table-better";
import "react-quill-new/dist/quill.snow.css";
import "quill-table-better/dist/quill-table-better.css";
import hljs from "highlight.js";
import "highlight.js/styles/atom-one-dark.css";
import "./styles.css";
import { registerBlogQuillModules } from "./blog/quillSetup";

registerBlogQuillModules(Quill);

const QuillTableBetterDemo = () => {
  const quillRef = useRef<ReactQuill | null>(null);

  const modules = useMemo(
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
          [{ size: ["small", false, "large", "huge"] }],
          [{ script: "sub" }, { script: "super" }],
        ],
      },
      table: false,
      "table-better": {
        language: "en_US",
        menus: ["column", "row", "merge", "table", "cell", "wrap", "copy", "delete"],
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
      editor.clipboard.dangerouslyPasteHTML(html);
    }
  }, []);

  return (
    <div style={{ padding: "40px", maxWidth: "900px", margin: "0 auto" }}>
      <h1>Quill Sample Page</h1>
      <p>Table, image resize, video and rich formatting demo</p>
      <div style={{ marginBottom: 10 }} />
      <ReactQuill
        ref={quillRef}
        theme="snow"
        modules={modules}
        style={{ height: 400 }}
        className="custom-quill"
      />
    </div>
  );
};

export default QuillTableBetterDemo;