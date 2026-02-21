// src/api/api.ts
import axios, { AxiosError } from "axios";
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { API_BASE_URL } from "../common/config/config";

// Axios 인스턴스 생성
const instance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // HttpOnly 쿠키 JWT 사용 시 필수

});

// 로그인 세션 자동 연장 인터셉터
instance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    // 403 Forbidden: 권한 없음 → 세션 만료 처리
    if (error.response?.status === 403) {
      window.dispatchEvent(new CustomEvent("auth:session-expired"));
      return Promise.reject(error);
    }

    // AccessToken 만료 시 재발급
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // refresh 요청은 기본 axios 사용 (무한루프 방지)
        await axios.post(
          `${API_BASE_URL}/api/auth/refresh`,
          {},
          { withCredentials: true },
        );

        // 토큰 갱신 후 원래 요청 재시도
        return instance(originalRequest);
      } catch (err) {
        // refresh 실패 = accessToken 없음/만료 → 로그아웃 이벤트 발생
        window.dispatchEvent(new CustomEvent("auth:session-expired"));
        return Promise.reject(err);
      }
    }

    // 그 외 에러는 그대로 전달
    return Promise.reject(error);
  },
);

export default instance;
