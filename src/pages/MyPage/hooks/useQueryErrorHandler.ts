import { useEffect, useRef } from "react";
import { CommonError } from "../../common/types/error";

interface Props {
  status: "pending" | "error" | "success";
  error: unknown;
  handleApiError: (data: unknown) => void;
}

export function useQueryErrorHandler({ status, error, handleApiError }: Props) {
  const handledRef = useRef(false);

  useEffect(() => {
    if (status !== "error" || !error || handledRef.current) return;

    if (error instanceof CommonError) {
      handleApiError(error.data);
    } else if (error instanceof Error) {
      handleApiError(error.message);
    } else {
      handleApiError("알 수 없는 오류가 발생했습니다.");
    }

    handledRef.current = true;
  }, [status, error, handleApiError]);
}
