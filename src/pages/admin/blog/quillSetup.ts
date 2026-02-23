import QuillTableBetter from "quill-table-better";
import ImageResize from "quill-image-resize";

const QUILL_REGISTER_KEY = "__QUILL_COMMON_MODULES_REGISTERED__";

interface QuillRegistrar {
  register: (...args: unknown[]) => void;
}

export function registerAdminBlogQuillModules(Quill: unknown) {
  const quill = Quill as QuillRegistrar;
  const globalObj = globalThis as Record<string, unknown>;
  if (globalObj[QUILL_REGISTER_KEY]) {
    return;
  }

  quill.register({ "modules/table-better": QuillTableBetter }, true);
  quill.register("modules/imageResize", ImageResize);
  globalObj[QUILL_REGISTER_KEY] = true;
}
