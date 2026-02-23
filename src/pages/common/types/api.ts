export interface FieldMessage {
  field: string;
  messages: string[];
}

export interface ApiError {
  code: string;
  message: string;
  fields?: FieldMessage[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  data?: T | null;
  error?: ApiError | null;
}

// 페이지에서 사용하는 fieldErrors 타입
export type FieldErrors<T> = Partial<Record<keyof T, string>>;
