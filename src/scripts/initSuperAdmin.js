require('dotenv').config();
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/userModel');
const Tenant = require('../models/tenantModel');

// 超級管理員設定
const superAdmin = {
  name: '系統管理員',
  email: 'admin@authnexus.com',
  password: 'Admin123!', // 初始密碼，建議首次登入後立即更改
  roles: ['super_admin'],
};

// 系統工作區設定
const systemTenant = {
  name: '系統管理',
  apiKey: uuidv4(),
};

/**
 * 初始化超級管理員
 */
const initSuperAdmin = async () => {
  try {
    console.log('🔄 連接資料庫...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ 資料庫連接成功');

    // 檢查是否已有系統工作區
    let tenant = await Tenant.findOne({ name: systemTenant.name });
    
    if (!tenant) {
      console.log('🔄 建立系統工作區...');
      tenant = await Tenant.create(systemTenant);
      console.log(`✅ 系統工作區建立成功: ${tenant._id}`);
    } else {
      console.log(`ℹ️ 系統工作區已存在: ${tenant._id}`);
    }

    // 檢查是否已有超級管理員
    const existingAdmin = await User.findOne({ 
      email: superAdmin.email,
      tenantId: tenant._id
    });
    
    if (!existingAdmin) {
      console.log('🔄 建立超級管理員...');
      const admin = await User.create({
        ...superAdmin,
        tenantId: tenant._id,
        passwordHash: superAdmin.password, // 模型中會自動雜湊
        isActive: true,
        isVerified: true,
      });
      console.log(`✅ 超級管理員建立成功: ${admin._id}`);
      console.log(`📧 Email: ${superAdmin.email}`);
      console.log(`🔑 密碼: ${superAdmin.password} (請首次登入後立即更改)`);
    } else {
      console.log(`ℹ️ 超級管理員已存在: ${existingAdmin._id}`);
    }

    console.log('✨ 初始化完成');
    process.exit(0);
  } catch (error) {
    console.error('❌ 初始化失敗:', error);
    process.exit(1);
  }
};

// 執行初始化
initSuperAdmin();