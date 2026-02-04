import { type ProfileResponse, type ProfileRequest } from './../types/profile';
import axios from "../../common/axios";
import type { ApiResponse } from "../../common/types/api";
import type { Recommendation } from "../types/recommendation";
import type { ReviewPage } from "../types/review";


export const updateProfile = (data: FormData) =>
  axios.put<ApiResponse<ProfileRequest>>("/api/mypage/profile", data);

export const getProfile = () =>
  axios.get<ApiResponse<ProfileResponse>>("/api/mypage/profile");

export const recommendation = () =>
  axios.get<ApiResponse<Recommendation>>("/api/mypage/recommendations");

export const getReview = (cursor:number, limit:number) => {
  const params = new URLSearchParams({ cursor: cursor.toString(), limit: limit.toString() });
  return axios.get<ReviewPage>(`/api/mypage/reviews?${params.toString()}`);
}
