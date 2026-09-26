import { ControllerError, ServiceError } from "./errors";
import { ERROR_CODES, type ErrorCode } from "../constants/errorCodes";

// controller(api) 层包装：保留 service 已判定的错误码，其余统一归并。
export function wrapControllerReflect(fallback: ErrorCode) {
  return (cause: unknown): never => {
    if (cause instanceof ControllerError) throw cause;
    if (cause instanceof ServiceError) {
      throw new ControllerError((cause.code in ERROR_CODES ? cause.code : fallback) as ErrorCode);
    }
    throw new ControllerError(fallback);
  };
}
