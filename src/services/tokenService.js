// src/services/tokenService.js
const jwt = require('jsonwebtoken');

/**
 * Token 類型
 */
const TokenType = {
  VERIFICATION: 'verification',
  RESET_PASSWORD: 'reset_password'
};

/**
 * Token 服務類
 * 用於處理驗證和重設密碼等 token 相關操作
 */
class TokenService {
  /**
   * 初始化 TokenService
   */
  constructor() {
    this.secret = process.env.JWT_SECRET;
    this.expiresIn = {
      verification: '24h',     // 驗證郵件 token 有效期 24 小時
      resetPassword: '24h'     // 重設密碼 token 有效期 24 小時
    };
    
    if (!this.secret) {
      console.error('JWT_SECRET 環境變數未設置，token 驗證將無法正常工作');
    }
  }
  
  /**
   * 生成驗證郵件 token
   * @param {Object} payload - token 數據
   * @param {string} payload.userId - 使用者 ID
   * @param {string} payload.tenantId - 工作區 ID
   * @param {string} payload.email - 使用者郵箱
   * @returns {string} - JWT token
   */
  generateVerificationToken(payload) {
    return this.generateToken({
      ...payload,
      type: TokenType.VERIFICATION
    }, this.expiresIn.verification);
  }
  
  /**
   * 生成重設密碼 token
   * @param {Object} payload - token 數據
   * @param {string} payload.userId - 使用者 ID
   * @param {string} payload.tenantId - 工作區 ID
   * @param {string} payload.email - 使用者郵箱
   * @returns {string} - JWT token
   */
  generateResetPasswordToken(payload) {
    return this.generateToken({
      ...payload,
      type: TokenType.RESET_PASSWORD
    }, this.expiresIn.resetPassword);
  }
  
  /**
   * 生成 JWT token
   * @param {Object} payload - token 數據
   * @param {string} expiresIn - 過期時間
   * @returns {string} - JWT token
   */
  generateToken(payload, expiresIn) {
    return jwt.sign(payload, this.secret, { expiresIn });
  }
  
  /**
   * 驗證 token
   * @param {string} token - 要驗證的 token
   * @returns {Object|null} - 驗證結果，成功則返回 payload，失敗則返回 null
   */
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.secret);
      return decoded;
    } catch (error) {
      console.error('Token 驗證失敗:', error.message);
      return null;
    }
  }
  
  /**
   * 驗證並確認是驗證郵件 token
   * @param {string} token - 要驗證的 token
   * @returns {Object|null} - 驗證結果，成功則返回 payload，失敗則返回 null
   */
  verifyVerificationToken(token) {
    const decoded = this.verifyToken(token);
    
    if (!decoded || decoded.type !== TokenType.VERIFICATION) {
      return null;
    }
    
    return decoded;
  }
  
  /**
   * 驗證並確認是重設密碼 token
   * @param {string} token - 要驗證的 token
   * @returns {Object|null} - 驗證結果，成功則返回 payload，失敗則返回 null
   */
  verifyResetPasswordToken(token) {
    const decoded = this.verifyToken(token);
    
    if (!decoded || decoded.type !== TokenType.RESET_PASSWORD) {
      return null;
    }
    
    return decoded;
  }
}

// 創建 token 服務實例
const tokenService = new TokenService();

module.exports = {
  tokenService,
  TokenType
};//