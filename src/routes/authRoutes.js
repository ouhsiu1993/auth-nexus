const express = require('express');
const router = express.Router();
const { validateRequest, registerSchema, loginSchema } = require('../utils/validators');
const { protect, verifyTenant,superAdminOnly  } = require('../middleware/authMiddleware');
const authController = require('../controllers/authController');

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: 使用者註冊
 *     tags: [Authentication]
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
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
 *             required:
 *               - name
 *               - email
 *               - password
 *               - confirmPassword
 *             properties:
 *               name:
 *                 type: string
 *                 example: 張小明
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password123!
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 example: Password123!
 *     responses:
 *       201:
 *         description: 註冊成功
 *       400:
 *         description: 資料驗證失敗
 *       409:
 *         description: Email 已存在
 */
// 註冊路由
router.post('/register', validateRequest(registerSchema), authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: 使用者登入
 *     tags: [Authentication]
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
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
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password123!
 *     responses:
 *       200:
 *         description: 登入成功
 *       400:
 *         description: 資料驗證失敗
 *       401:
 *         description: 無效的憑證
 */
// 登入路由
router.post('/login', validateRequest(loginSchema), authController.login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: 取得當前使用者資訊
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         schema:
 *           type: string
 *         required: true
 *         description: 工作區 ID
 *     responses:
 *       200:
 *         description: 成功取得使用者資訊
 *       401:
 *         description: 未授權
 */
// 取得當前使用者資訊
router.get('/me', protect, verifyTenant, authController.getMe);

/**
 * @swagger
 * /api/auth/send-verification-email:
 *   post:
 *     summary: 發送驗證郵件
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
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
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 example: 60d21b4667d0d8992e610c85
 *     responses:
 *       200:
 *         description: 驗證郵件發送成功
 *       400:
 *         description: 資料驗證失敗或使用者狀態不允許發送
 *       401:
 *         description: 未授權
 *       404:
 *         description: 使用者或工作區不存在
 *       500:
 *         description: 郵件發送失敗
 */
// 發送驗證郵件
router.post('/send-verification-email', protect, verifyTenant, authController.sendVerificationEmail);

/**
 * @swagger
 * /api/auth/verify-email/{token}:
 *   get:
 *     summary: 驗證電子郵件
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: 驗證 Token
 *     responses:
 *       302:
 *         description: 重定向到驗證成功頁面
 *       400:
 *         description: 無效或過期的 Token
 *       404:
 *         description: 使用者不存在
 */
// 郵件驗證路由 - 公開訪問，不需要 JWT 或租戶 ID
router.get('/verify-email/:token', authController.verifyEmail);

/**
 * @swagger
 * /api/auth/send-reset-password-email:
 *   post:
 *     summary: 發送重設密碼郵件
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
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
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 example: 60d21b4667d0d8992e610c85
 *     responses:
 *       200:
 *         description: 重設密碼郵件發送成功
 *       400:
 *         description: 資料驗證失敗或使用者狀態不允許發送
 *       401:
 *         description: 未授權
 *       404:
 *         description: 使用者或工作區不存在
 *       500:
 *         description: 郵件發送失敗
 */
// 發送重設密碼郵件
router.post('/send-reset-password-email', protect, verifyTenant, authController.sendResetPasswordEmail);

/**
 * @swagger
 * /api/auth/reset-password/{token}:
 *   post:
 *     summary: 重設密碼
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: 重設密碼 Token
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
 *       302:
 *         description: 重定向到密碼重設成功頁面
 *       400:
 *         description: 資料驗證失敗或 Token 無效
 *       404:
 *         description: 使用者不存在
 */
// 重設密碼
router.post('/reset-password/:token', authController.resetPassword);

/**
 * @swagger
 * /api/auth/test-email:
 *   post:
 *     summary: 測試郵件發送功能
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
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
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: test@example.com
 *     responses:
 *       200:
 *         description: 測試郵件發送成功
 *       400:
 *         description: 資料驗證失敗
 *       401:
 *         description: 未授權
 *       500:
 *         description: 郵件發送失敗
 */
// 測試郵件服務
router.post('/test-email', protect, superAdminOnly, authController.testEmailService);

module.exports = router;