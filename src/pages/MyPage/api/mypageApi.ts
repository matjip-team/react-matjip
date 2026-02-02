import axios from "../../common/axios";
import type { ApiResponse } from "../../common/types/api";
import type { Recommendation } from "../types/recommendation";
import type { Review } from "../types/review";
import type { UserInfo } from "../types/user";

export const profileEdit = (data: FormData) =>
  axios.put<ApiResponse<UserInfo>>("/api/mypage/profile", data);

export const recommendation = () =>
  axios.get<ApiResponse<Recommendation>>("/api/auth");

export const review = () => axios.get<ApiResponse<Review>>("/api/auth/logout");
