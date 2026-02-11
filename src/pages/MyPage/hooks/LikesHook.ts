import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { getLikes, deleteLike } from "../api/mypageApi";
import { CommonError } from "../../common/types/error";
import type { AxiosError } from "axios";

export const useLikes = () => {
  return useInfiniteQuery({
    queryKey: ["likes"],
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const res = await getLikes(pageParam, 21);
        return res.data.data;
      } catch (err) {
        const axiosError = err as AxiosError;
        throw new CommonError("실패", axiosError.response?.data || err);
      }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
    staleTime: 1000 * 60 * 5, // 5분 동안 데이터 fresh
    gcTime: 1000 * 60 * 10, // 캐시 10분 유지
    retry: 0, // 실패 시 재시도 안 함
  });
};

export const useDeleteLike = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (likeId: number) => deleteLike(likeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["likes"] });
    },
  });
};
