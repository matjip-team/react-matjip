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

export class CommonError<T> extends Error {
  data?: T;

  constructor(message: string, data?: T) {
    super(message);
    this.name = "ApiError";
    this.data = data;
  }
}
