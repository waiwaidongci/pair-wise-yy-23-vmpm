import { ERROR_CODES, type ErrorCode } from "../constants/errorCodes";
import { ERROR_MESSAGES } from "../constants/errorMessages";

// service / controller 必须各自包装异常，禁止在一个全局位置吞掉所有异常。
export class ServiceError extends Error {
  code: ErrorCode;
  constructor(code: ErrorCode, message?: string) {
    super(message ?? ERROR_MESSAGES[code]);
    this.name = "ServiceError";
    this.code = code;
  }
}

export class ControllerError extends Error {
  code: ErrorCode;
  constructor(code: ErrorCode, message?: string) {
    super(message ?? ERROR_MESSAGES[code]);
    this.name = "ControllerError";
    this.code = code;
  }
}

export function wrapServiceError(code: ErrorCode) {
  return (cause: unknown): never => {
    if (cause instanceof ServiceError) throw cause;
    throw new ServiceError(code, `${ERROR_MESSAGES[code]}（${String((cause as Error)?.message ?? cause)}）`);
  };
}

export function wrapControllerError(code: ErrorCode) {
  return (cause: unknown): never => {
    if (cause instanceof ControllerError) throw cause;
    const serviceCode = (cause as ServiceError)?.code;
    throw new ControllerError(
      serviceCode && serviceCode in ERROR_CODES ? serviceCode : code
    );
  };
}
