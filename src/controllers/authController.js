// src/controllers/authController.js
const emailService = require('../services/emailService');
const { tokenService } = require('../services/tokenService');
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const Tenant = require('../models/tenantModel');
const { signToken } = require('../middleware/authMiddleware');
const { AppError, errorResponse, successResponse } = require('../utils/errorHandler');

/**
 * 使用者註冊
 * @route POST /api/auth/register
 * @access Public
 */
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const tenantId = req.headers['x-tenant-id'];

  // 驗證工作區 ID
  const tenant = await Tenant.findById(tenantId);
  if (!tenant) {
    return errorResponse(res, 404, 'TENANT_NOT_FOUND', '工作區不存在');
  }

  if (!tenant.isActive) {
    return errorResponse(res, 403, 'TENANT_INACTIVE', '工作區已停用');
  }

  // 檢查 Email 是否已存在（包含已刪除）
  const existingUser = await User.findOne({ email, tenantId });
  
  // 如果存在且已被刪除，則恢復該用戶
  if (existingUser && existingUser.isDeleted) {
    // 更新用戶資訊
    existingUser.name = name;
    existingUser.passwordHash = password; // 模型中會自動雜湊
    existingUser.isActive = true;
    existingUser.isDeleted = false;
    existingUser.deletedAt = null;
    
    // 儲存更新
    await existingUser.save();
    
    // 產生 JWT Token
    const token = signToken(existingUser._id);
    
    // 移除敏感資料
    existingUser.passwordHash = undefined;
    
    return successResponse(res, 200, '帳號已恢復', {
      user: existingUser,
      token,
      restored: true
    });
  }

  // 如果存在且未被刪除，返回錯誤
  if (existingUser) {
    return errorResponse(res, 409, 'EMAIL_EXISTS', '此 Email 已被使用');
  }

  // 建立使用者
  const user = await User.create({
    name,
    email,
    passwordHash: password, // 模型中會自動雜湊
    tenantId,
    roles: ['user'],
    isActive: true,
    isVerified: false, // 預設未驗證
  });

  // 產生 JWT Token
  const token = signToken(user._id);

  // 移除敏感資料
  user.passwordHash = undefined;

  return successResponse(res, 201, '註冊成功', {
    user,
    token,
  });
});

/**
 * 使用者登入
 * @route POST /api/auth/login
 * @access Public
 */
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const tenantId = req.headers['x-tenant-id'];

  // 驗證工作區 ID
  const tenant = await Tenant.findById(tenantId);
  if (!tenant) {
    return errorResponse(res, 404, 'TENANT_NOT_FOUND', '工作區不存在');
  }

  if (!tenant.isActive) {
    return errorResponse(res, 403, 'TENANT_INACTIVE', '工作區已停用');
  }

  // 查詢使用者
  const user = await User.findOne({ email, tenantId, isDeleted: { $ne: true } });
  if (!user) {
    return errorResponse(res, 401, 'INVALID_CREDENTIALS', '無效的憑證');
  }

  // 檢查帳號是否啟用
  if (!user.isActive) {
    return errorResponse(res, 403, 'ACCOUNT_DISABLED', '此帳號已被停用');
  }

  // 檢查是否有權限登入管理平台 (只有 super_admin 和 admin 可以登入)
  const allowedRoles = ['super_admin', 'admin'];
  const hasPermission = user.roles.some(role => allowedRoles.includes(role));
  
  if (!hasPermission) {
    return errorResponse(res, 403, 'ACCESS_DENIED', '您沒有權限登入此系統');
  }

  // 驗證密碼
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return errorResponse(res, 401, 'INVALID_CREDENTIALS', '無效的憑證');
  }

  // 產生 JWT Token
  const token = signToken(user._id);

  // 移除敏感資料
  user.passwordHash = undefined;

  return successResponse(res, 200, '登入成功', {
    user,
    token,
  });
});

/**
 * 取得當前使用者資訊
 * @route GET /api/auth/me
 * @access Private
 */
exports.getMe = asyncHandler(async (req, res) => {
  // 由於已通過 protect 中介軟體，req.user 已包含使用者資訊
  const user = req.user;

  // 移除敏感資料
  user.passwordHash = undefined;

  return successResponse(res, 200, '取得使用者資訊成功', {
    user,
  });
});

/**
 * 發送驗證郵件
 * @route POST /api/auth/send-verification-email
 * @access Private/Admin
 */
exports.sendVerificationEmail = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  
  // 驗證請求
  if (!userId) {
    return errorResponse(res, 400, 'BAD_REQUEST', '請提供使用者 ID');
  }
  
  // 查詢使用者
  const user = await User.findById(userId);
  
  if (!user) {
    return errorResponse(res, 404, 'USER_NOT_FOUND', '使用者不存在');
  }
  
  if (user.isDeleted) {
    return errorResponse(res, 400, 'USER_DELETED', '無法為已刪除的使用者發送驗證郵件');
  }
  
  if (!user.isActive) {
    return errorResponse(res, 400, 'USER_INACTIVE', '無法為已停用的使用者發送驗證郵件');
  }
  
  // 查詢工作區
  const tenant = await Tenant.findById(user.tenantId);
  
  if (!tenant) {
    return errorResponse(res, 404, 'TENANT_NOT_FOUND', '工作區不存在');
  }
  
  // 生成驗證 token
  const token = tokenService.generateVerificationToken({
    userId: user._id.toString(),
    tenantId: user.tenantId.toString(),
    email: user.email
  });
  
  // 構建驗證 URL - 修正為前端路由
  const verificationUrl = `${process.env.SITE_URL}/verify-email/${token}`;
  
  try {
    // 發送驗證郵件
    await emailService.sendVerificationEmail({
      to: user.email,
      name: user.name,
      verificationUrl,
      tenantName: tenant.name
    });
    
    return successResponse(res, 200, '驗證郵件發送成功', {
      email: user.email
    });
  } catch (error) {
    console.error('發送驗證郵件失敗:', error);
    return errorResponse(res, 500, 'EMAIL_SEND_ERROR', '發送驗證郵件失敗，請稍後再試');
  }
});

/**
 * 驗證電子郵件
 * @route GET /api/auth/verify-email/:token
 * @access Public
 */
exports.verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  // 驗證 token
  const decoded = tokenService.verifyVerificationToken(token);

  if (!decoded) {
    return errorResponse(res, 400, 'INVALID_TOKEN', '驗證連結無效或已過期');
  }

  const { userId, email } = decoded;

  // 查詢使用者
  const user = await User.findById(userId);

  if (!user) {
    return errorResponse(res, 404, 'USER_NOT_FOUND', '使用者不存在');
  }

  if (user.email !== email) {
    return errorResponse(res, 400, 'EMAIL_MISMATCH', '電子郵件不一致');
  }

  // 更新使用者驗證狀態
  user.isVerified = true;
  await user.save();

  return successResponse(res, 200, '電子郵件驗證成功', {
    userId: user._id,
    email: user.email,
  });
});

/**
 * 發送重設密碼郵件
 * @route POST /api/auth/send-reset-password-email
 * @access Private/Admin
 */
exports.sendResetPasswordEmail = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  
  // 驗證請求
  if (!userId) {
    return errorResponse(res, 400, 'BAD_REQUEST', '請提供使用者 ID');
  }
  
  // 查詢使用者
  const user = await User.findById(userId);
  
  if (!user) {
    return errorResponse(res, 404, 'USER_NOT_FOUND', '使用者不存在');
  }
  
  if (user.isDeleted) {
    return errorResponse(res, 400, 'USER_DELETED', '無法為已刪除的使用者發送重設密碼郵件');
  }
  
  if (!user.isActive) {
    return errorResponse(res, 400, 'USER_INACTIVE', '無法為已停用的使用者發送重設密碼郵件');
  }
  
  // 查詢工作區
  const tenant = await Tenant.findById(user.tenantId);
  
  if (!tenant) {
    return errorResponse(res, 404, 'TENANT_NOT_FOUND', '工作區不存在');
  }
  
  // 生成重設密碼 token
  const token = tokenService.generateResetPasswordToken({
    userId: user._id.toString(),
    tenantId: user.tenantId.toString(),
    email: user.email
  });
  
  // 構建重設密碼 URL
  const resetUrl = `${process.env.SITE_URL}/reset-password/${token}`;
  
  try {
    // 發送重設密碼郵件
    await emailService.sendResetPasswordEmail({
      to: user.email,
      name: user.name,
      resetUrl,
      tenantName: tenant.name
    });
    
    return successResponse(res, 200, '重設密碼郵件發送成功', {
      email: user.email
    });
  } catch (error) {
    console.error('發送重設密碼郵件失敗:', error);
    return errorResponse(res, 500, 'EMAIL_SEND_ERROR', '發送重設密碼郵件失敗，請稍後再試');
  }
});

/**
 * 重設密碼
 * @route POST /api/auth/reset-password/:token
 * @access Public
 */
exports.resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;
  
  // 驗證請求
  if (!password || !confirmPassword) {
    return errorResponse(res, 400, 'BAD_REQUEST', '請提供新密碼');
  }
  
  if (password !== confirmPassword) {
    return errorResponse(res, 400, 'PASSWORD_MISMATCH', '密碼不一致');
  }
  
  // 驗證 token
  const decoded = tokenService.verifyResetPasswordToken(token);
  
  if (!decoded) {
    return errorResponse(res, 400, 'INVALID_TOKEN', '重設密碼連結無效或已過期');
  }
  
  const { userId, email } = decoded;
  
  // 查詢使用者
  const user = await User.findById(userId);
  
  if (!user) {
    return errorResponse(res, 404, 'USER_NOT_FOUND', '使用者不存在');
  }
  
  if (user.email !== email) {
    return errorResponse(res, 400, 'EMAIL_MISMATCH', '電子郵件不匹配');
  }
  
  if (user.isDeleted) {
    return errorResponse(res, 400, 'USER_DELETED', '無法為已刪除的使用者重設密碼');
  }
  
  if (!user.isActive) {
    return errorResponse(res, 400, 'USER_INACTIVE', '無法為已停用的使用者重設密碼');
  }
  
  // 更新密碼
  user.passwordHash = password; // 模型中會自動雜湊
  user.isVerified = true; // 重設密碼後自動驗證
  await user.save();
  
  // 查詢工作區
  const tenant = await Tenant.findById(user.tenantId);
  
  // 發送密碼已變更通知
  try {
    await emailService.sendPasswordChangedEmail({
      to: user.email,
      name: user.name,
      tenantName: tenant ? tenant.name : 'AuthNexus'
    });
  } catch (error) {
    console.error('發送密碼變更通知失敗:', error);
    // 不中斷流程，僅記錄錯誤
  }
  
  // 導向密碼重設成功頁面 - 修改為前端路由
  const frontendUrl = process.env.SITE_URL || 'http://localhost:5173';
  return res.json({
  code: 'SUCCESS',
  message: '密碼重設成功',
  data: {
    redirectUrl: `${frontendUrl}/password-reset-success`
  }
});
});

// 測試郵件發送功能
exports.testEmailService = asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return errorResponse(res, 400, 'BAD_REQUEST', '請提供測試郵箱地址');
  }
  
  try {
    const result = await emailService.testEmailService(email);
    return successResponse(res, 200, '測試郵件發送成功', result);
  } catch (error) {
    console.error('測試郵件發送失敗:', error);
    return errorResponse(res, 500, 'EMAIL_SEND_ERROR', '測試郵件發送失敗，請檢查郵件服務配置');
  }
});