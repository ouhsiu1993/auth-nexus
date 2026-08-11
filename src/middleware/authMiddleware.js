const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');

// 驗證 JWT Token
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  // 取得 Bearer Token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // 檢查是否有 Token
  if (!token) {
    return res.status(401).json({
      code: 'UNAUTHORIZED',
      message: '請先登入以獲取存取權限',
      data: null,
    });
  }

  try {
    // 驗證 Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 查詢使用者
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        code: 'UNAUTHORIZED',
        message: '使用者不存在',
        data: null,
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        code: 'FORBIDDEN',
        message: '此帳號已被停用',
        data: null,
      });
    }

    // 將使用者存入 req 物件
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      code: 'UNAUTHORIZED',
      message: 'Token 無效或已過期',
      data: null,
    });
  }
});

// 驗證工作區 ID
exports.verifyTenant = asyncHandler(async (req, res, next) => {
  const tenantId = req.headers['x-tenant-id'];

  if (!tenantId) {
    return res.status(400).json({
      code: 'BAD_REQUEST',
      message: '請提供工作區 ID',
      data: null,
    });
  }

  // 檢查使用者是否屬於該工作區（但管理員除外）
  if (!req.user.isSuperAdmin() && req.user.tenantId.toString() !== tenantId) {
    return res.status(403).json({
      code: 'FORBIDDEN',
      message: '無法存取其他工作區的資源',
      data: null,
    });
  }

  req.tenantId = tenantId;
  next();
});

// 限制角色訪問（需要先執行 protect 中介軟體）
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // 檢查用戶是否有權限
    const hasPermission = req.user.roles.some(role => roles.includes(role));
    
    if (!hasPermission) {
      return res.status(403).json({
        code: 'FORBIDDEN',
        message: '您沒有權限執行此操作',
        data: null,
      });
    }
    
    next();
  };
};

// 限制只有超級管理員
exports.superAdminOnly = (req, res, next) => {
  if (!req.user.isSuperAdmin()) {
    return res.status(403).json({
      code: 'FORBIDDEN',
      message: '只有超級管理員可以執行此操作',
      data: null,
    });
  }
  
  next();
};

// 生成 JWT Token
exports.signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};