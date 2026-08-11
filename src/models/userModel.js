// src/models/userModel.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: [true, '工作區 ID 為必填'],
    },
    email: {
      type: String,
      required: [true, 'Email 為必填'],
      lowercase: true,
      trim: true,
      validate: {
        validator: function (v) {
          return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
        },
        message: (props) => `${props.value} 不是有效的 Email 格式`,
      },
      // 移除這裡的 unique: true 標記
    },
    passwordHash: {
      type: String,
      required: [true, '密碼為必填'],
    },
    name: {
      type: String,
      required: [true, '姓名為必填'],
      trim: true,
    },
    roles: {
      type: [String],
      default: ['user'],
      enum: ['super_admin', 'admin', 'editor', 'user', 'viewer'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// 建立複合部分索引：tenant + email 聯合唯一索引，但僅針對未刪除的用戶
userSchema.index(
  { email: 1, tenantId: 1 },
  { 
    unique: true,
    partialFilterExpression: { isDeleted: { $ne: true } } 
  }
);

// 密碼雜湊中介層
userSchema.pre('save', async function (next) {
  // 只有當密碼被修改時才重新雜湊
  if (!this.isModified('passwordHash')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 驗證密碼方法
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// 檢查是否為超級管理員
userSchema.methods.isSuperAdmin = function () {
  return this.roles.includes('super_admin');
};

const User = mongoose.model('User', userSchema);

module.exports = User;