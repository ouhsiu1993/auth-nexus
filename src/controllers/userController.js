// src/controllers/userController.js
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const { AppError, errorResponse, successResponse } = require('../utils/errorHandler');

/**
 * 建立新使用者
 * @route POST /api/users
 * @access Private/SuperAdmin
 */
exports.createUser = asyncHandler(async (req, res) => {
  const { name, email, password, roles, tenantId, isActive, isVerified } = req.body;
  
  // 檢查是否有相同 email 的用戶（包含已刪除）
  const existingUser = await User.findOne({ email, tenantId });
  
  // 如果存在且已被刪除，則恢復該用戶
  if (existingUser && existingUser.isDeleted) {
    // 更新用戶資訊
    existingUser.name = name;
    existingUser.passwordHash = password; // 模型中會自動雜湊
    existingUser.roles = roles || existingUser.roles;
    existingUser.isActive = isActive !== undefined ? isActive : true;
    existingUser.isVerified = isVerified !== undefined ? isVerified : false;
    existingUser.isDeleted = false;
    existingUser.deletedAt = null;
    
    // 儲存更新
    await existingUser.save();
    
    // 移除敏感資料
    existingUser.passwordHash = undefined;
    
    return successResponse(res, 200, '用戶已恢復並更新', {
      user: existingUser,
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
    roles,
    isActive: isActive !== undefined ? isActive : true,
    isVerified: isVerified !== undefined ? isVerified : false,
  });
  
  // 移除敏感資料
  user.passwordHash = undefined;
  
  return successResponse(res, 201, '使用者建立成功', {
    user,
  });
});

/**
 * 取得所有使用者（分頁）
 * @route GET /api/users
 * @access Private/SuperAdmin
 */
exports.getAllUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  
  // 查詢條件
  const filter = {};
  
  // 可依工作區過濾
  if (req.query.tenantId) {
    filter.tenantId = req.query.tenantId;
  }
  
  // 預設排除已刪除的使用者，除非明確要求包含
  if (req.query.includeDeleted !== 'true') {
    filter.isDeleted = { $ne: true };
  }
  
  // 計算總數與查詢使用者
  const total = await User.countDocuments(filter);
  const users = await User.find(filter)
    .select('-passwordHash') // 排除密碼雜湊
    .sort({ createdAt: -1 }) // 最新建立的排前面
    .skip(skip)
    .limit(limit)
    .populate('tenantId', 'name'); // 關聯工作區名稱
  
  // 計算分頁資訊
  const totalPages = Math.ceil(total / limit);
  
  return successResponse(res, 200, '取得使用者列表成功', {
    users,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
  });
});

/**
 * 取得特定使用者資訊
 * @route GET /api/users/:id
 * @access Private/SuperAdmin
 */
exports.getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('-passwordHash')
    .populate('tenantId', 'name');
  
  if (!user) {
    return errorResponse(res, 404, 'USER_NOT_FOUND', '使用者不存在');
  }
  
  return successResponse(res, 200, '取得使用者資訊成功', {
    user,
  });
});

/**
 * 更新使用者資訊
 * @route PUT /api/users/:id
 * @access Private/SuperAdmin
 */
exports.updateUser = asyncHandler(async (req, res) => {
  const { name, roles, isActive, isVerified } = req.body;
  
  // 查詢使用者
  let user = await User.findById(req.params.id);
  
  if (!user) {
    return errorResponse(res, 404, 'USER_NOT_FOUND', '使用者不存在');
  }
  
  // 更新使用者資訊
  user.name = name || user.name;
  
  // 僅當有提供時才更新這些欄位
  if (roles !== undefined) user.roles = roles;
  if (isActive !== undefined) user.isActive = isActive;
  if (isVerified !== undefined) user.isVerified = isVerified;
  
  // 儲存更新
  await user.save();
  
  // 移除敏感資料
  user.passwordHash = undefined;
  
  return successResponse(res, 200, '使用者資訊更新成功', {
    user,
  });
});

/**
 * 重設使用者密碼
 * @route POST /api/users/:id/reset-password
 * @access Private/SuperAdmin
 */
exports.resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  
  // 查詢使用者
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return errorResponse(res, 404, 'USER_NOT_FOUND', '使用者不存在');
  }
  
  // 更新密碼
  user.passwordHash = password; // 模型中會自動雜湊
  await user.save();
  
  return successResponse(res, 200, '密碼重設成功', null);
});

/**
 * 軟刪除使用者
 * @route DELETE /api/users/:id
 * @access Private/SuperAdmin
 */
exports.softDeleteUser = asyncHandler(async (req, res) => {
  // 查詢使用者
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return errorResponse(res, 404, 'USER_NOT_FOUND', '使用者不存在');
  }
  
  // 已經被刪除
  if (user.isDeleted) {
    return errorResponse(res, 400, 'USER_ALREADY_DELETED', '使用者已被刪除');
  }
  
  // 標記為已刪除
  user.isDeleted = true;
  user.deletedAt = new Date();
  await user.save();
  
  return successResponse(res, 200, '使用者已成功刪除', null);
});

/**
 * 恢復已刪除的使用者
 * @route POST /api/users/:id/restore
 * @access Private/SuperAdmin
 */
exports.restoreUser = asyncHandler(async (req, res) => {
  // 查詢使用者 (包括已刪除的)
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return errorResponse(res, 404, 'USER_NOT_FOUND', '使用者不存在');
  }
  
  // 未被刪除
  if (!user.isDeleted) {
    return errorResponse(res, 400, 'USER_NOT_DELETED', '使用者未被刪除');
  }
  
  // 恢復使用者
  user.isDeleted = false;
  user.deletedAt = null;
  await user.save();
  
  return successResponse(res, 200, '使用者已成功恢復', {
    user,
  });
});