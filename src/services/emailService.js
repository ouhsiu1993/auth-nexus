// src/services/emailService.js
const axios = require('axios');
const path = require('path');
const fs = require('fs');

/**
 * Brevo (原 Sendinblue) 郵件服務
 * 透過 Brevo API 發送電子郵件
 */
class EmailService {
  /**
   * 初始化 EmailService
   */
  constructor() {
    this.apiKey = process.env.BREVO_API_KEY;
    this.senderEmail = process.env.BREVO_SENDER_EMAIL || 'no-reply@zanvoai.com';
    this.senderName = process.env.BREVO_SENDER_NAME || 'AuthNexus';
    this.apiBaseUrl = 'https://api.brevo.com/v3';
    
    if (!this.apiKey) {
      console.error('BREVO_API_KEY 環境變數未設置，無法發送郵件');
    }
    
    // 初始化 HTTP Client
    this.client = axios.create({
      baseURL: this.apiBaseUrl,
      headers: {
        'api-key': this.apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    // 加載郵件模板
    this.loadEmailTemplates();
  }
  
  /**
   * 加載郵件模板
   */
  loadEmailTemplates() {
    try {
      // 模板目錄
      const templatesDir = path.join(__dirname, '../templates/emails');
      
      // 讀取可用模板
      this.templates = {
        verification: fs.readFileSync(path.join(templatesDir, 'verification.html'), 'utf8'),
        resetPassword: fs.readFileSync(path.join(templatesDir, 'reset-password.html'), 'utf8'),
        accountCreated: fs.readFileSync(path.join(templatesDir, 'account-created.html'), 'utf8'),
        passwordChanged: fs.readFileSync(path.join(templatesDir, 'password-changed.html'), 'utf8'),
        accountStatusChanged: fs.readFileSync(path.join(templatesDir, 'account-status-changed.html'), 'utf8')
      };
      
      console.log('郵件模板加載成功');
    } catch (error) {
      console.error('郵件模板加載失敗', error);
      
      // 使用備用模板字符串
      this.templates = {
        verification: '<h1>驗證您的電子郵件</h1><p>請點擊下方按鈕驗證您的電子郵件：</p><a href="{{verificationUrl}}">驗證電子郵件</a>',
        resetPassword: '<h1>重設您的密碼</h1><p>請點擊下方按鈕重設您的密碼：</p><a href="{{resetUrl}}">重設密碼</a>',
        accountCreated: '<h1>帳戶已創建</h1><p>您的 AuthNexus 帳戶已創建。</p>',
        passwordChanged: '<h1>密碼已變更</h1><p>您的密碼已成功變更。</p>',
        accountStatusChanged: '<h1>帳戶狀態已變更</h1><p>您的帳戶狀態已變更為: {{status}}。</p>'
      };
    }
  }
  
  /**
   * 替換模板中的變數
   * @param {string} template - 模板內容
   * @param {Object} variables - 變數鍵值對
   * @returns {string} - 替換後的內容
   */
  parseTemplate(template, variables = {}) {
    let parsedTemplate = template;
    
    // 替換變數
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      parsedTemplate = parsedTemplate.replace(regex, variables[key]);
    });
    
    return parsedTemplate;
  }
  
  /**
   * 發送郵件
   * @param {Object} options - 郵件選項
   * @param {string} options.to - 收件人郵箱
   * @param {string} options.subject - 郵件主題
   * @param {string} options.htmlContent - HTML 郵件內容
   * @param {string} options.textContent - 純文本郵件內容
   * @returns {Promise} - API 回應
   */
  async sendEmail({ to, subject, htmlContent, textContent = '' }) {
    if (!this.apiKey) {
      throw new Error('BREVO_API_KEY 環境變數未設置，無法發送郵件');
    }
    
    try {
      const response = await this.client.post('/smtp/email', {
        sender: {
          name: this.senderName,
          email: this.senderEmail
        },
        to: [
          {
            email: to
          }
        ],
        subject,
        htmlContent,
        textContent
      });
      
      return response.data;
    } catch (error) {
      console.error('郵件發送失敗:', error.response?.data || error.message);
      throw error;
    }
  }
  
  /**
   * 發送驗證郵件
   * @param {Object} options - 選項
   * @param {string} options.to - 收件人郵箱
   * @param {string} options.name - 收件人姓名
   * @param {string} options.verificationUrl - 驗證連結
   * @param {string} options.tenantName - 工作區名稱
   * @returns {Promise} - 郵件發送結果
   */
  async sendVerificationEmail({ to, name, verificationUrl, tenantName }) {
    const subject = '請驗證您的 AuthNexus 電子郵件';
    
    // 替換模板變數
    const htmlContent = this.parseTemplate(this.templates.verification, {
      name,
      verificationUrl,
      tenantName,
      year: new Date().getFullYear()
    });
    
    return this.sendEmail({
      to,
      subject,
      htmlContent,
      textContent: `請點擊以下連結驗證您的電子郵件：${verificationUrl}`
    });
  }
  
  /**
   * 發送重設密碼郵件
   * @param {Object} options - 選項
   * @param {string} options.to - 收件人郵箱
   * @param {string} options.name - 收件人姓名
   * @param {string} options.resetUrl - 重設密碼連結
   * @param {string} options.tenantName - 工作區名稱
   * @returns {Promise} - 郵件發送結果
   */
  async sendResetPasswordEmail({ to, name, resetUrl, tenantName }) {
    const subject = '重設您的 AuthNexus 密碼';
    
    // 替換模板變數
    const htmlContent = this.parseTemplate(this.templates.resetPassword, {
      name,
      resetUrl,
      tenantName,
      year: new Date().getFullYear()
    });
    
    return this.sendEmail({
      to,
      subject,
      htmlContent,
      textContent: `請點擊以下連結重設您的密碼：${resetUrl}`
    });
  }
  
  /**
   * 發送帳戶創建通知
   * @param {Object} options - 選項
   * @param {string} options.to - 收件人郵箱
   * @param {string} options.name - 收件人姓名
   * @param {string} options.loginUrl - 登入連結
   * @param {string} options.tenantName - 工作區名稱
   * @returns {Promise} - 郵件發送結果
   */
  async sendAccountCreatedEmail({ to, name, loginUrl, tenantName }) {
    const subject = '您的 AuthNexus 帳戶已創建';
    
    // 替換模板變數
    const htmlContent = this.parseTemplate(this.templates.accountCreated, {
      name,
      loginUrl,
      tenantName,
      year: new Date().getFullYear()
    });
    
    return this.sendEmail({
      to,
      subject,
      htmlContent,
      textContent: `您的 AuthNexus 帳戶已創建。請點擊以下連結登入：${loginUrl}`
    });
  }
  
  /**
   * 發送密碼變更通知
   * @param {Object} options - 選項
   * @param {string} options.to - 收件人郵箱
   * @param {string} options.name - 收件人姓名
   * @param {string} options.tenantName - 工作區名稱
   * @returns {Promise} - 郵件發送結果
   */
  async sendPasswordChangedEmail({ to, name, tenantName }) {
    const subject = '您的 AuthNexus 密碼已變更';
    
    // 替換模板變數
    const htmlContent = this.parseTemplate(this.templates.passwordChanged, {
      name,
      tenantName,
      year: new Date().getFullYear()
    });
    
    return this.sendEmail({
      to,
      subject,
      htmlContent,
      textContent: '您的 AuthNexus 密碼已變更。如果您沒有進行此操作，請立即聯繫管理員。'
    });
  }
  
  /**
   * 發送帳戶狀態變更通知
   * @param {Object} options - 選項
   * @param {string} options.to - 收件人郵箱
   * @param {string} options.name - 收件人姓名
   * @param {string} options.status - 新狀態
   * @param {string} options.tenantName - 工作區名稱
   * @returns {Promise} - 郵件發送結果
   */
  async sendAccountStatusChangedEmail({ to, name, status, tenantName }) {
    const subject = '您的 AuthNexus 帳戶狀態已變更';
    
    // 轉換狀態文字
    const statusText = status === 'active' ? '已啟用' : 
                      status === 'inactive' ? '已停用' : 
                      status === 'verified' ? '已驗證' : 
                      status === 'deleted' ? '已刪除' : status;
    
    // 替換模板變數
    const htmlContent = this.parseTemplate(this.templates.accountStatusChanged, {
      name,
      status: statusText,
      tenantName,
      year: new Date().getFullYear()
    });
    
    return this.sendEmail({
      to,
      subject,
      htmlContent,
      textContent: `您的 AuthNexus 帳戶狀態已變更為: ${statusText}。`
    });
  }
  
  /**
   * 測試郵件服務是否正常工作
   * @param {string} testEmail - 測試郵件接收地址
   * @returns {Promise} - 測試結果
   */
  async testEmailService(testEmail) {
    try {
      const subject = 'AuthNexus 郵件服務測試';
      const htmlContent = `
        <h1>郵件服務測試</h1>
        <p>這是一封測試郵件，用於確認 AuthNexus 的郵件服務是否正常工作。</p>
        <p>時間: ${new Date().toISOString()}</p>
      `;
      
      const result = await this.sendEmail({
        to: testEmail,
        subject,
        htmlContent
      });
      
      console.log('測試郵件發送成功:', result);
      return { success: true, message: '測試郵件發送成功', data: result };
    } catch (error) {
      console.error('測試郵件發送失敗:', error);
      return { success: false, message: '測試郵件發送失敗', error };
    }
  }
}

// 創建郵件服務實例
const emailService = new EmailService();

module.exports = emailService;