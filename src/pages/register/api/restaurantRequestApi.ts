import axios from "../../common/axios";
import type { ApiResponse } from "../../common/types/api";

export type RestaurantApprovalStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export interface RestaurantMyRequestItem {
  id: number;
  name: string;
  address: string;
  imageUrl?: string | null;
  representativeImageUrl?: string | null;
  approvalStatus: RestaurantApprovalStatus;
  createdAt: string;
}

export interface RestaurantMyRequestDetail extends RestaurantMyRequestItem {
  phone?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  representativeImageUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  categoryNames?: string[] | null;
  hasBusinessLicenseFile?: boolean;
  businessLicenseFileKey?: string | null;
  reviewedAt?: string | null;
  rejectedReason?: string | null;
}

export interface RestaurantMyRequestUpdatePayload {
  name: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  businessLicenseFileKey?: string | null;
  categoryNames?: string[] | null;
}

interface HttpErrorLike {
  message?: string;
  response?: {
    status?: number;
    data?: {
      message?: string | null;
      error?: {
        code?: string;
        message?: string | null;
      } | null;
    };
  };
}

export const getMyRestaurantRequests = async (): Promise<
  RestaurantMyRequestItem[]
> => {
  const response = await axios.get<ApiResponse<RestaurantMyRequestItem[]>>(
    "/api/restaurants/requests/me",
  );
  return response.data?.data ?? [];
};

export const cancelRestaurantRequest = async (id: number): Promise<void> => {
  await axios.patch<ApiResponse<null>>(`/api/restaurants/requests/${id}/cancel`);
};

export const updateMyRestaurantRequest = async (
  id: number,
  payload: RestaurantMyRequestUpdatePayload,
): Promise<void> => {
  await axios.patch<ApiResponse<null>>(`/api/restaurants/requests/${id}`, payload);
};

export const getMyRestaurantRequestLicenseViewUrl = async (id: number): Promise<string> => {
  const response = await axios.get<ApiResponse<string>>(
    `/api/restaurants/requests/${id}/license-view-url`,
  );

  const urlFromData = response.data?.data;
  const urlFromMessage = response.data?.message;
  const url = urlFromData
    ?? (typeof urlFromMessage === "string" && /^https?:\/\//i.test(urlFromMessage)
      ? urlFromMessage
      : null);
  if (!url) {
    throw new Error("LICENSE_URL_NOT_FOUND");
  }

  return url;
};

export const getMyRestaurantRequestDetail = async (
  id: number,
): Promise<RestaurantMyRequestDetail> => {
  try {
    const response = await axios.get<ApiResponse<RestaurantMyRequestDetail>>(
      `/api/restaurants/requests/${id}`,
    );
    if (response.data?.data) {
      return response.data.data;
    }
  } catch (error: unknown) {
    const httpError = error as HttpErrorLike;
    const status = httpError?.response?.status;
    const rawMessage = [
      httpError?.message,
      httpError?.response?.data?.message,
      httpError?.response?.data?.error?.message,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const isMissingDetailEndpoint =
      rawMessage.includes("no static resource") &&
      rawMessage.includes("api/restaurants/requests/");

    if (status !== 404 && status !== 405 && !isMissingDetailEndpoint) {
      throw error;
    }
  }

  const items = await getMyRestaurantRequests();
  const fallback = items.find((item) => item.id === id);
  if (!fallback) {
    throw new Error("REQUEST_NOT_FOUND");
  }

  return fallback;
};
