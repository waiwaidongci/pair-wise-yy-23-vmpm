import { ERROR_CODES, type ErrorCode } from "../constants/errorCodes";
import { ERROR_MESSAGES } from "../constants/errorMessages";
import { logger } from "./logger";

/** 统一业务异常，api/service/controller 分层包装（layer 不同、禁止单点吞掉）。 */
export class AppError extends Error {
  code: ErrorCode;
  layer: "api" | "service" | "controller";
  cause?: unknown;

  constructor(code: ErrorCode, layer: "api" | "service" | "controller", detail?: string, cause?: unknown) {
    super(detail ?? ERROR_MESSAGES[code]);
    this.name = "AppError";
    this.code = code;
    this.layer = layer;
    this.cause = cause;
  }
}

/** service 层包装：底层 IndexedDB 异常统一转 STORE_UNAVAILABLE/NOT_FOUND。 */
export function wrapServiceError(scope: string, error: unknown, fallback: ErrorCode = ERROR_CODES.STORE_UNAVAILABLE): AppError {
  if (error instanceof AppError) {
    logger.warn(scope, `透传 ${error.layer} 层异常 ${error.code}: ${error.message}`);
    return error;
  }
  const wrapped = new AppError(fallback, "service", ERROR_MESSAGES[fallback], error);
  logger.error(scope, wrapped.message, error);
  return wrapped;
}

/** controller 层包装：业务编排异常二次包装，保留原 code。 */
export function wrapControllerError(scope: string, error: unknown, fallback: ErrorCode = ERROR_CODES.VALIDATION_FAILED): AppError {
  if (error instanceof AppError) {
    logger.warn(scope, `controller 捕获 ${error.layer} 异常 ${error.code}: ${error.message}`);
    return new AppError(error.code, "controller", error.message, error);
  }
  const wrapped = new AppError(fallback, "controller", ERROR_MESSAGES[fallback], error);
  logger.error(scope, wrapped.message, error);
  return wrapped;
}
