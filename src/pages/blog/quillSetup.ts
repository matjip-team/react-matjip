import QuillTableBetter from "quill-table-better";
import ImageResize from "quill-image-resize";

const BLOG_QUILL_REGISTER_KEY = "__BLOG_QUILL_MODULES_REGISTERED__";

interface QuillRegistrar {
  register: (...args: unknown[]) => void;
}

export function registerBlogQuillModules(Quill: unknown) {
  const quill = Quill as QuillRegistrar;
  const globalObj = globalThis as Record<string, unknown>;
  if (globalObj[BLOG_QUILL_REGISTER_KEY]) {
    return;
  }

  quill.register({ "modules/table-better": QuillTableBetter }, true);
  quill.register("modules/imageResize", ImageResize);
  globalObj[BLOG_QUILL_REGISTER_KEY] = true;
}
