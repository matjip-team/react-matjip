import type { ApiResponse } from "../types/api";

// 성공 시 data 반환, 실패 시 에러 반환
export function unwrapData<T>(res: ApiResponse<T>): T {
  if (!res.success) {
    throw new Error(res.error?.message ?? "API Error");
  }

  if (!res.data) {
    return null as unknown as T;
    // throw new Error("No data returned");
  }
  return res.data;
}
