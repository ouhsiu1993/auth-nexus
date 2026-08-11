const express = require('express');
const router = express.Router();
const { protect, superAdminOnly } = require('../middleware/authMiddleware');
const { validateRequest, tenantSchema } = require('../utils/validators');
const tenantController = require('../controllers/tenantController');

/**
 * @swagger
 * /api/tenants:
 *   get:
 *     summary: 取得所有工作區（管理員）
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 每頁數量
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 頁碼
 *     responses:
 *       200:
 *         description: 成功取得工作區列表
 *       401:
 *         description: 未授權
 *       403:
 *         description: 無權限
 */
router.get('/', protect, superAdminOnly, tenantController.getAllTenants);

/**
 * @swagger
 * /api/tenants:
 *   post:
 *     summary: 建立新工作區（管理員）
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: 台北業務部
 *     responses:
 *       201:
 *         description: 成功建立工作區
 *       400:
 *         description: 資料驗證失敗
 *       401:
 *         description: 未授權
 *       403:
 *         description: 無權限
 */
router.post('/', protect, superAdminOnly, validateRequest(tenantSchema), tenantController.createTenant);

/**
 * @swagger
 * /api/tenants/{id}:
 *   get:
 *     summary: 取得特定工作區資訊（管理員）
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: 工作區 ID
 *     responses:
 *       200:
 *         description: 成功取得工作區資訊
 *       401:
 *         description: 未授權
 *       403:
 *         description: 無權限
 *       404:
 *         description: 工作區不存在
 */
router.get('/:id', protect, superAdminOnly, tenantController.getTenant);

/**
 * @swagger
 * /api/tenants/{id}:
 *   put:
 *     summary: 更新工作區資訊（管理員）
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: 工作區 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: 新北業務部
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: 成功更新工作區資訊
 *       400:
 *         description: 資料驗證失敗
 *       401:
 *         description: 未授權
 *       403:
 *         description: 無權限
 *       404:
 *         description: 工作區不存在
 */
router.put('/:id', protect, superAdminOnly, tenantController.updateTenant);

/**
 * @swagger
 * /api/tenants/{id}/apikey/refresh:
 *   post:
 *     summary: 重新產生工作區的 API Key（管理員）
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: 工作區 ID
 *     responses:
 *       200:
 *         description: 成功重新產生 API Key
 *       401:
 *         description: 未授權
 *       403:
 *         description: 無權限
 *       404:
 *         description: 工作區不存在
 */
router.post('/:id/apikey/refresh', protect, superAdminOnly, tenantController.refreshApiKey);

/**
 * @swagger
 * /api/tenants/{id}/users:
 *   get:
 *     summary: 取得特定工作區的所有使用者（管理員）
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: 工作區 ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 每頁數量
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 頁碼
 *       - in: query
 *         name: includeDeleted
 *         schema:
 *           type: boolean
 *           default: false
 *         description: 是否包含已刪除的使用者
 *     responses:
 *       200:
 *         description: 成功取得使用者列表
 *       401:
 *         description: 未授權
 *       403:
 *         description: 無權限
 *       404:
 *         description: 工作區不存在
 */
router.get('/:id/users', protect, superAdminOnly, tenantController.getTenantUsers);

/**
 * @swagger
 * /api/tenants/{id}:
 *   delete:
 *     summary: 軟刪除工作區（管理員）
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: 工作區 ID
 *     responses:
 *       200:
 *         description: 成功刪除工作區
 *       401:
 *         description: 未授權
 *       403:
 *         description: 無權限
 *       404:
 *         description: 工作區不存在
 */
router.delete('/:id', protect, superAdminOnly, tenantController.softDeleteTenant);

/**
 * @swagger
 * /api/tenants/{id}/restore:
 *   post:
 *     summary: 恢復已刪除的工作區（管理員）
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: 工作區 ID
 *     responses:
 *       200:
 *         description: 成功恢復工作區
 *       400:
 *         description: 工作區未被刪除
 *       401:
 *         description: 未授權
 *       403:
 *         description: 無權限
 *       404:
 *         description: 工作區不存在
 */
router.post('/:id/restore', protect, superAdminOnly, tenantController.restoreTenant);

module.exports = router;