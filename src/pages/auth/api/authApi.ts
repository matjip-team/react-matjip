import axios from "../../common/axios";
import type { ApiResponse } from "../../common/types/api";
import type {
  SignupRequest,
  SignupResponse,
  LoginRequest,
  LoginResponse,
} from "./types";

export const signup = (data: SignupRequest) =>
  axios.post<ApiResponse<SignupResponse>>("/api/users", data);

export const login = (data: LoginRequest) =>
  axios.post<ApiResponse<LoginResponse>>("/api/auth", data);

export const logout = () =>
  axios.get<ApiResponse<LoginResponse>>("/api/auth/logout");

export const me = () => axios.get<ApiResponse<LoginResponse>>("/api/users/me");
