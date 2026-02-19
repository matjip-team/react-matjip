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
  approvalStatus: RestaurantApprovalStatus;
  createdAt: string;
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
