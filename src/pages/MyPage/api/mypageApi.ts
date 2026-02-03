import { type ProfileResponse, type ProfileRequest } from './../types/profile';
import axios from "../../common/axios";
import type { ApiResponse } from "../../common/types/api";
import type { Recommendation } from "../types/recommendation";
import type { Review } from "../types/review";


export const updateProfile = (data: FormData) =>
  axios.put<ApiResponse<ProfileRequest>>("/api/mypage/profile", data);

export const getProfile = () =>
  axios.get<ApiResponse<ProfileResponse>>("/api/mypage/profile");

export const recommendation = () =>
  axios.get<ApiResponse<Recommendation>>("/api/mypage/recommendations");

export const review = () => axios.get<ApiResponse<Review>>("/api/mypage/reviews");
