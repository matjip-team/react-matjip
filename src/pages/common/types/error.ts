export interface FieldMessage {
  field: string;
  messages: string[]; // 배열로 내려옴
}

export interface ApiError {
  code: string;
  message: string;
  fields?: FieldMessage[];
}

export interface ValidationErrorResponse {
  success: false;
  data: null;
  error: ApiError;
}
