const Joi = require('joi');
  
  // 使用者註冊資料驗證 Schema
  const registerSchema = Joi.object({
    name: Joi.string().min(2).max(50).required()
      .messages({
        'string.empty': '請填寫姓名',
        'string.min': '姓名至少需要 {#limit} 個字元',
        'string.max': '姓名不可超過 {#limit} 個字元',
        'any.required': '姓名為必填欄位'
      }),
    
    email: Joi.string().email().required()
      .messages({
        'string.empty': '請填寫 Email',
        'string.email': 'Email 格式不正確',
        'any.required': 'Email 為必填欄位'
      }),
    
    password: Joi.string().min(8).max(30).pattern(
      new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])')
    ).required()
      .messages({
        'string.empty': '請填寫密碼',
        'string.min': '密碼至少需要 {#limit} 個字元',
        'string.max': '密碼不可超過 {#limit} 個字元',
        'string.pattern.base': '密碼需包含大小寫字母、數字及特殊符號',
        'any.required': '密碼為必填欄位'
      }),
    
    confirmPassword: Joi.string().valid(Joi.ref('password')).required()
      .messages({
        'string.empty': '請再次確認密碼',
        'any.only': '密碼不一致',
        'any.required': '請再次確認密碼'
      }),
  });
  
  // 使用者登入資料驗證 Schema
  const loginSchema = Joi.object({
    email: Joi.string().email().required()
      .messages({
        'string.empty': '請填寫 Email',
        'string.email': 'Email 格式不正確',
        'any.required': 'Email 為必填欄位'
      }),
    
    password: Joi.string().required()
      .messages({
        'string.empty': '請填寫密碼',
        'any.required': '密碼為必填欄位'
      }),
  });
  
  // 工作區建立資料驗證 Schema
  const tenantSchema = Joi.object({
    name: Joi.string().min(2).max(100).required()
      .messages({
        'string.empty': '請填寫工作區名稱',
        'string.min': '工作區名稱至少需要 {#limit} 個字元',
        'string.max': '工作區名稱不可超過 {#limit} 個字元',
        'any.required': '工作區名稱為必填欄位'
      }),
  });
  
  // 用戶資料更新驗證 Schema
  const userUpdateSchema = Joi.object({
    name: Joi.string().min(2).max(50),
    roles: Joi.array().items(Joi.string().valid('super_admin', 'admin', 'editor', 'user', 'viewer')),
    isActive: Joi.boolean(),
    isVerified: Joi.boolean(),
  });
  
  // 密碼重設驗證 Schema
  const passwordResetSchema = Joi.object({
    password: Joi.string().min(8).max(30).pattern(
      new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])')
    ).required()
      .messages({
        'string.empty': '請填寫密碼',
        'string.min': '密碼至少需要 {#limit} 個字元',
        'string.max': '密碼不可超過 {#limit} 個字元',
        'string.pattern.base': '密碼需包含大小寫字母、數字及特殊符號',
        'any.required': '密碼為必填欄位'
      }),
    
    confirmPassword: Joi.string().valid(Joi.ref('password')).required()
      .messages({
        'string.empty': '請再次確認密碼',
        'any.only': '密碼不一致',
        'any.required': '請再次確認密碼'
      }),
  });
  
  module.exports = {
    registerSchema,
    loginSchema,
    tenantSchema,
    userUpdateSchema,
    passwordResetSchema,
    validateRequest: (schema) => (req, res, next) => {
      const { error } = schema.validate(req.body, { abortEarly: false });
      
      if (error) {
        const errorMessages = error.details.map(detail => detail.message);
        return res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: '資料驗證失敗',
          data: errorMessages,
        });
      }
      
      next();
    },
  };