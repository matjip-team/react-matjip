import QuillTableBetter from "quill-table-better";
import ImageResize from "quill-image-resize";

const BLOG_QUILL_REGISTER_KEY = "__BLOG_QUILL_MODULES_REGISTERED__";

export function registerBlogQuillModules(Quill: any) {
  const globalObj = globalThis as Record<string, unknown>;
  if (globalObj[BLOG_QUILL_REGISTER_KEY]) {
    return;
  }

  Quill.register({ "modules/table-better": QuillTableBetter }, true);
  Quill.register("modules/imageResize", ImageResize);
  globalObj[BLOG_QUILL_REGISTER_KEY] = true;
}
