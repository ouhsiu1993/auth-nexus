// src/models/tenantModel.js
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const tenantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, '工作區名稱為必填'],
      trim: true,
    },
    apiKey: {
      type: String,
      default: () => uuidv4(), // 自動生成 UUID 作為 API Key
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: true,
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

// 虛擬屬性：工作區 ID（用於前端顯示）
tenantSchema.virtual('tenantId').get(function () {
  return this._id.toString();
});

const Tenant = mongoose.model('Tenant', tenantSchema);

module.exports = Tenant;