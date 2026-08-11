const express = require('express');
const router = express.Router();
const { protect, superAdminOnly } = require('../middleware/authMiddleware');
const { validateRequest, userUpdateSchema, passwordResetSchema } = require('../utils/validators');
const userController = require('../controllers/userController');
const asyncHandler = require('express-async-handler');

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: 建立新使用者（管理員）
 *     tags: [Users]
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
 *               - email
 *               - password
 *               - tenantId
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               roles:
 *                 type: array
 *                 items:
 *                   type: string
 *               tenantId:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               isVerified:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: 使用者建立成功
 *       400:
 *         description: 資料驗證失敗
 *       401:
 *         description: 未授權
 *       403:
 *         description: 無權限
 *       409:
 *         description: Email 已存在
 */
router.post('/', protect, superAdminOnly, userController.createUser);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: 取得所有使用者（管理員）
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         schema:
 *           type: string
 *         description: 工作區 ID（可選，過濾特定工作區的使用者）
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
 *         description: 成功取得使用者列表
 *       401:
 *         description: 未授權
 *       403:
 *         description: 無權限
 */
router.get('/', protect, superAdminOnly, userController.getAllUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: 取得特定使用者資訊（管理員）
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: 使用者 ID
 *     responses:
 *       200:
 *         description: 成功取得使用者資訊
 *       401:
 *         description: 未授權
 *       403:
 *         description: 無權限
 *       404:
 *         description: 使用者不存在
 */
router.get('/:id', protect, superAdminOnly, userController.getUser);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: 更新使用者資訊（管理員）
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: 使用者 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: 張小明
 *               roles:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [super_admin, admin, editor, user, viewer]
 *                 example: ["user", "editor"]
 *               isActive:
 *                 type: boolean
 *                 example: true
 *               isVerified:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: 成功更新使用者資訊
 *       400:
 *         description: 資料驗證失敗
 *       401:
 *         description: 未授權
 *       403:
 *         description: 無權限
 *       404:
 *         description: 使用者不存在
 */
router.put('/:id', protect, superAdminOnly, validateRequest(userUpdateSchema), userController.updateUser);

/**
 * @swagger
 * /api/users/{id}/reset-password:
 *   post:
 *     summary: 重設使用者密碼（管理員）
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: 使用者 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *               - confirmPassword
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 example: NewPassword123!
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 example: NewPassword123!
 *     responses:
 *       200:
 *         description: 成功重設密碼
 *       400:
 *         description: 資料驗證失敗
 *       401:
 *         description: 未授權
 *       403:
 *         description: 無權限
 *       404:
 *         description: 使用者不存在
 */
router.post('/:id/reset-password', protect, superAdminOnly, validateRequest(passwordResetSchema), userController.resetPassword);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: 軟刪除使用者（管理員）
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: 使用者 ID
 *     responses:
 *       200:
 *         description: 成功刪除使用者
 *       401:
 *         description: 未授權
 *       403:
 *         description: 無權限
 *       404:
 *         description: 使用者不存在
 */
router.delete('/:id', protect, superAdminOnly, userController.softDeleteUser);

/**
 * @swagger
 * /api/users/{id}/restore:
 *   post:
 *     summary: 恢復已刪除的使用者（管理員）
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: 使用者 ID
 *     responses:
 *       200:
 *         description: 成功恢復使用者
 *       400:
 *         description: 使用者未被刪除
 *       401:
 *         description: 未授權
 *       403:
 *         description: 無權限
 *       404:
 *         description: 使用者不存在
 */
router.post('/:id/restore', protect, superAdminOnly, userController.restoreUser);

module.exports = router;