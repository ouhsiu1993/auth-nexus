 // 標準化錯誤回應函數
exports.errorResponse = (res, statusCode, errorCode, message, data = null) => {
    return res.status(statusCode).json({
      code: errorCode,
      message,
      data,
    });
  };
  
  // 標準化成功回應函數
  exports.successResponse = (res, statusCode, message, data = null) => {
    return res.status(statusCode).json({
      code: 'SUCCESS',
      message,
      data,
    });
  };
  
  // 自訂錯誤類別
  class AppError extends Error {
    constructor(message, statusCode, code) {
      super(message);
      this.statusCode = statusCode;
      this.code = code;
      this.isOperational = true;
  
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  exports.AppError = AppError;