import type { ApiResponse } from "../types/api";

// 성공 시 data 반환, 실패 시 throw
export function unwrapData<T>(res: ApiResponse<T>): T {
  if (!res.success) {
    throw new Error(res.error?.message ?? "API Error");
  }
  if (!res.data) {
    throw new Error("No data returned");
  }
  return res.data;
}

export type Empty<T> = {
  [K in keyof T]: T[K] extends string
    ? ""
    : T[K] extends number
    ? 0
    : T[K] extends File
    ? null
    : null;
};