import { useState } from "react";
import { handleApiError as apiErrorHandler } from "./handleApiError";

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

export function useFormError<T>() {
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<T>>({});

  const handleApiError = (err: unknown) => {
    // 공통 핸들러 예: handleApiError 유틸과 통합
    const { fieldErrors: fe, globalError: ge } = apiErrorHandler<T>(err);

    setFieldErrors(fe);
    setGlobalError(ge);
  };

  const resetErrors = () => {
    setGlobalError(null);
    setFieldErrors({});
  };

  return {
    globalError,
    fieldErrors,
    handleApiError,
    resetErrors,
    setGlobalError,
    setFieldErrors,
  };
}
