// src/controllers/tenantController.js
const asyncHandler = require('express-async-handler');
const { v4: uuidv4 } = require('uuid');
const Tenant = require('../models/tenantModel');
const User = require('../models/userModel');
const { AppError, errorResponse, successResponse } = require('../utils/errorHandler');

/**
 * 取得所有工作區（分頁）
 * @route GET /api/tenants
 * @access Private/SuperAdmin
 */

exports.getAllTenants = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  
  // 查詢條件
  const filter = {};
  
  // 預設排除已刪除的工作區，除非明確要求包含
  if (req.query.includeDeleted !== 'true') {
    filter.isDeleted = { $ne: true };
  }
  
  // 計算總數與查詢工作區
  const total = await Tenant.countDocuments(filter);
  const tenants = await Tenant.find(filter)
    .sort({ createdAt: -1 }) // 最新建立的排前面
    .skip(skip)
    .limit(limit);
  
  // 計算分頁資訊
  const totalPages = Math.ceil(total / limit);
  
  return successResponse(res, 200, '取得工作區列表成功', {
    tenants,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
  });
});

/**
 * 建立新工作區
 * @route POST /api/tenants
 * @access Private/SuperAdmin
 */
exports.createTenant = asyncHandler(async (req, res) => {
  const { name } = req.body;
  
  // 建立工作區
  const tenant = await Tenant.create({
    name,
    apiKey: uuidv4(), // 產生隨機 UUID 作為 API Key
    isActive: true,
  });
  
  return successResponse(res, 201, '工作區建立成功', {
    tenant,
  });
});

/**
 * 取得特定工作區資訊
 * @route GET /api/tenants/:id
 * @access Private/SuperAdmin
 */
exports.getTenant = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findById(req.params.id);
  
  if (!tenant) {
    return errorResponse(res, 404, 'TENANT_NOT_FOUND', '工作區不存在');
  }
  
  return successResponse(res, 200, '取得工作區資訊成功', {
    tenant,
  });
});

/**
 * 更新工作區資訊
 * @route PUT /api/tenants/:id
 * @access Private/SuperAdmin
 */
exports.updateTenant = asyncHandler(async (req, res) => {
  const { name, isActive } = req.body;
  
  // 查詢工作區
  let tenant = await Tenant.findById(req.params.id);
  
  if (!tenant) {
    return errorResponse(res, 404, 'TENANT_NOT_FOUND', '工作區不存在');
  }
  
  // 更新工作區資訊
  tenant.name = name || tenant.name;
  
  // 僅當有提供時才更新此欄位
  if (isActive !== undefined) tenant.isActive = isActive;
  
  // 儲存更新
  await tenant.save();
  
  return successResponse(res, 200, '工作區資訊更新成功', {
    tenant,
  });
});

/**
 * 重新產生工作區的 API Key
 * @route POST /api/tenants/:id/apikey/refresh
 * @access Private/SuperAdmin
 */
exports.refreshApiKey = asyncHandler(async (req, res) => {
  // 查詢工作區
  const tenant = await Tenant.findById(req.params.id);
  
  if (!tenant) {
    return errorResponse(res, 404, 'TENANT_NOT_FOUND', '工作區不存在');
  }
  
  // 產生新的 API Key
  tenant.apiKey = uuidv4();
  await tenant.save();
  
  return successResponse(res, 200, 'API Key 重新產生成功', {
    tenant,
  });
});

/**
 * 取得特定工作區的所有使用者
 * @route GET /api/tenants/:id/users
 * @access Private/SuperAdmin
 */
exports.getTenantUsers = asyncHandler(async (req, res) => {
  const tenantId = req.params.id;
  
  // 檢查工作區是否存在
  const tenant = await Tenant.findById(tenantId);
  if (!tenant) {
    return errorResponse(res, 404, 'TENANT_NOT_FOUND', '工作區不存在');
  }
  
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  
  // 預設只查詢未刪除的用戶
  const query = { 
    tenantId,
    isDeleted: false 
  };
  
  // 如果有 includeDeleted 參數，則查詢所有用戶
  if (req.query.includeDeleted === 'true') {
    delete query.isDeleted;
  }
  
  // 查詢該工作區的所有使用者
  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .select('-passwordHash') // 排除密碼雜湊
    .sort({ createdAt: -1 }) // 最新建立的排前面
    .skip(skip)
    .limit(limit);
  
  // 計算分頁資訊
  const totalPages = Math.ceil(total / limit);
  
  return successResponse(res, 200, '取得工作區使用者列表成功', {
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
 * 軟刪除工作區
 * @route DELETE /api/tenants/:id
 * @access Private/SuperAdmin
 */
exports.softDeleteTenant = asyncHandler(async (req, res) => {
  // 查詢工作區
  const tenant = await Tenant.findById(req.params.id);
  
  if (!tenant) {
    return errorResponse(res, 404, 'TENANT_NOT_FOUND', '工作區不存在');
  }
  
  // 已經被刪除
  if (tenant.isDeleted) {
    return errorResponse(res, 400, 'TENANT_ALREADY_DELETED', '工作區已被刪除');
  }
  
  // 標記為已刪除
  tenant.isDeleted = true;
  tenant.deletedAt = new Date();
  await tenant.save();
  
  return successResponse(res, 200, '工作區已成功刪除', null);
});

/**
 * 恢復已刪除的工作區
 * @route POST /api/tenants/:id/restore
 * @access Private/SuperAdmin
 */
exports.restoreTenant = asyncHandler(async (req, res) => {
  // 查詢工作區 (包括已刪除的)
  const tenant = await Tenant.findById(req.params.id);
  
  if (!tenant) {
    return errorResponse(res, 404, 'TENANT_NOT_FOUND', '工作區不存在');
  }
  
  // 未被刪除
  if (!tenant.isDeleted) {
    return errorResponse(res, 400, 'TENANT_NOT_DELETED', '工作區未被刪除');
  }
  
  // 恢復工作區
  tenant.isDeleted = false;
  tenant.deletedAt = null;
  await tenant.save();
  
  return successResponse(res, 200, '工作區已成功恢復', {
    tenant,
  });
});