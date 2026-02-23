import { type ProfileResponse } from "./../types/profile";
import axios from "../../common/axios";
import type { ApiResponse } from "../../common/types/api";
import type { LikesPage } from "../types/likes";
import type { ReviewPage } from "../types/review";

export const updateProfile = (data: FormData) =>
  axios.put<ApiResponse<void>>("/api/mypage/profile", data);

export const getProfile = () =>
  axios.get<ApiResponse<ProfileResponse>>("/api/mypage/profile");

export const getReview = (cursor: number, limit: number) => {
  const params = new URLSearchParams({
    cursor: cursor.toString(),
    limit: limit.toString(),
  });
  return axios.get<ApiResponse<ReviewPage>>(
    `/api/mypage/reviews?${params.toString()}`,
  );
};

export const getLikes = (cursor: number, limit: number) => {
  const params = new URLSearchParams({
    cursor: cursor.toString(),
    limit: limit.toString(),
  });
  return axios.get<ApiResponse<LikesPage>>(
    `/api/mypage/likes?${params.toString()}`,
  );
};

export const deleteLike = (likeId: number) => {
  return axios.delete(`/api/mypage/likes/${likeId}`);
};

export const withdrawAccount = (password: string) =>
  axios.post<ApiResponse<void>>("/api/mypage/withdraw", { password });
