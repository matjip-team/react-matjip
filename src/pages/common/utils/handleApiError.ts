import type { FieldErrors, FieldMessage } from "../types/api";
import type { AxiosError } from "axios";

interface ErrorResponse {
  success: boolean;
  data: null;
  error: {
    code: string;
    message: string;
    fields?: FieldMessage[];
  };
}

/**
 * AxiosError 또는 HTTP 200 실패(success=false) 응답 처리
 * @param err - AxiosError<ErrorResponse> | { response: { data: ErrorResponse } } | Error
 * @returns fieldErrors, globalError
 */
export function handleApiError<T>(err: unknown): {
  fieldErrors: FieldErrors<T>;
  globalError: string | null;
} {
  const fieldErrors: FieldErrors<T> = {};
  let globalError: string | null = null;

  let data: ErrorResponse | undefined;

  // AxiosError인지 확인
  if (
    (err as AxiosError)?.isAxiosError &&
    (err as AxiosError)?.response?.data
  ) {
    data = (err as AxiosError<ErrorResponse>).response?.data;
  }
  // HTTP 200 실패(response.data)
  else if ((err as { response?: { data?: ErrorResponse } })?.response?.data) {
    data = (err as { response: { data: ErrorResponse } }).response.data;
  }
  // 그냥 객체
  else if ((err as ErrorResponse)?.error) {
    data = err as ErrorResponse;
  }

  if (data?.error) {
    globalError = data.error.message;

    if (data.error.fields?.length) {
      data.error.fields.forEach((f: FieldMessage) => {
        fieldErrors[f.field as keyof T] = f.messages[0]; // 첫 번째 메시지 사용
      });
    }
  } else if ((err as Error)?.message) {
    globalError = (err as Error).message;
  } else {
    globalError = "알 수 없는 오류가 발생했습니다.";
  }

  return { fieldErrors, globalError };
}
