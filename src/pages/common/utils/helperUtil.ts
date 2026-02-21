import type { ApiResponse } from "../types/api";

/** BlogPage 기준 Select, TextField 높이 (px) - 검색/필터 인풋 일관 높이 */
export const INPUT_HEIGHT = 40;

/** size="small" Select/TextField에 적용할 일관된 높이 sx */
export const inputHeightSx = {
  "& .MuiOutlinedInput-root": {
    height: INPUT_HEIGHT,
    minHeight: INPUT_HEIGHT,
  },
};

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

export const formatRelativeTime = (iso: string) => {
  const now = new Date();
  const target = new Date(iso);
  const diff = now.getTime() - target.getTime();

  const min = Math.floor(diff / 60000);
  const hour = Math.floor(diff / 3600000);
  const day = Math.floor(diff / 86400000);

  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  if (hour < 24) return `${hour}시간 전`;
  if (day < 7) return `${day}일 전`;

  return target.toLocaleDateString("ko-KR");
};

/**
 * 날짜/시간을 "YYYY.MM.DD HH:MM:SS" 형식으로 포맷
 */
export const formatDateTime = (value: string): string => {
  const d = new Date(value);

  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}.${String(d.getDate()).padStart(2, "0")} ${String(
    d.getHours()
  ).padStart(2, "0")}:${String(d.getMinutes()).padStart(
    2,
    "0"
  )}:${String(d.getSeconds()).padStart(2, "0")}`;
};
