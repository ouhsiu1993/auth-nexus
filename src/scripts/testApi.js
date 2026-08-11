// src/scripts/testApi.js
require('dotenv').config();
const axios = require('axios');

// API 端點
const API_URL = process.env.NODE_ENV === 'production' 
  ? process.env.SITE_URL 
  : `http://localhost:${process.env.PORT || 3000}`;

// 測試資料
let adminToken = '';
let tenantId = '';
let userId = '';
let userToken = '';

// 請求輔助函數
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 設置認證 Token
const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// 設置工作區 ID
const setTenantId = (id) => {
  if (id) {
    api.defaults.headers.common['x-tenant-id'] = id;
  } else {
    delete api.defaults.headers.common['x-tenant-id'];
  }
};

// 獲取系統工作區 ID
const getSystemTenantId = async () => {
  try {
    console.log('🔍 嘗試獲取系統工作區...');
    
    // 使用管理員登入
    const loginResponse = await api.post('/api/auth/login', {
      email: 'admin@authnexus.com',
      password: 'Admin123!',
    }, {
      headers: {
        'x-tenant-id': '6818461cc4e93d9c70a49687' // 這是初始化腳本創建的工作區 ID，應替換為您實際的值
      }
    });
    
    adminToken = loginResponse.data.data.token;
    console.log('✅ 使用初始認證獲取 token 成功');
    
    // 設置認證 token
    setAuthToken(adminToken);
    
    // 獲取工作區列表
    const tenantsResponse = await api.get('/api/tenants');
    if (tenantsResponse.data.data.tenants && tenantsResponse.data.data.tenants.length > 0) {
      tenantId = tenantsResponse.data.data.tenants[0]._id;
      console.log(`✅ 獲取系統工作區 ID 成功: ${tenantId}`);
      return tenantId;
    } else {
      throw new Error('未找到任何工作區');
    }
  } catch (error) {
    console.error('❌ 獲取系統工作區失敗:', error.response?.data || error.message);
    // 使用一個合理的預設值
    console.log('⚠️ 使用預設工作區 ID，請確保這個 ID 存在於您的系統中');
    return '6818461cc4e93d9c70a49684'; // 請使用您初始化腳本輸出的工作區 ID
  }
};

// 測試管理員登入
const testAdminLogin = async () => {
  try {
    console.log('\n🔑 測試管理員登入...');
    
    // 首先獲取系統工作區 ID
    tenantId = await getSystemTenantId();
    
    // 設置工作區 ID
    setTenantId(tenantId);
    
    // 管理員登入
    const loginResponse = await api.post('/api/auth/login', {
      email: 'admin@authnexus.com',
      password: 'Admin123!',
    });
    
    adminToken = loginResponse.data.data.token;
    setAuthToken(adminToken);
    
    console.log('✅ 管理員登入成功');
    console.log(`🔒 Token: ${adminToken.substring(0, 15)}...`);
    
    return true;
  } catch (error) {
    console.error('❌ 管理員登入失敗:', error.response?.data || error.message);
    return false;
  }
};

// 測試創建新工作區
const testCreateTenant = async () => {
  try {
    console.log('\n🏢 測試創建新工作區...');
    
    const response = await api.post('/api/tenants', {
      name: `測試工作區 ${new Date().toISOString().split('T')[0]}`,
    });
    
    tenantId = response.data.data.tenant._id;
    console.log(`✅ 工作區創建成功，ID: ${tenantId}`);
    console.log(`📝 工作區名稱: ${response.data.data.tenant.name}`);
    console.log(`🔑 API Key: ${response.data.data.tenant.apiKey}`);
    
    return true;
  } catch (error) {
    console.error('❌ 工作區創建失敗:', error.response?.data || error.message);
    return false;
  }
};

// 測試創建使用者
const testRegisterUser = async () => {
  try {
    console.log('\n👤 測試創建使用者...');
    
    // 設置工作區 ID
    setTenantId(tenantId);
    
    // 移除管理員 Token
    setAuthToken('');
    
    const response = await api.post('/api/auth/register', {
      name: '測試使用者',
      email: `test${Date.now()}@example.com`,
      password: 'Test123!',
      confirmPassword: 'Test123!',
    });
    
    userId = response.data.data.user._id;
    userToken = response.data.data.token;
    
    console.log(`✅ 使用者創建成功，ID: ${userId}`);
    console.log(`📧 Email: ${response.data.data.user.email}`);
    console.log(`🔒 Token: ${userToken.substring(0, 15)}...`);
    
    return true;
  } catch (error) {
    console.error('❌ 使用者創建失敗:', error.response?.data || error.message);
    return false;
  }
};

// 測試使用者登入
const testUserLogin = async () => {
  try {
    console.log('\n🔑 測試使用者登入...');
    
    // 取得使用者 Email
    setAuthToken(adminToken);
    const userResponse = await api.get(`/api/users/${userId}`);
    const userEmail = userResponse.data.data.user.email;
    
    // 移除管理員 Token
    setAuthToken('');
    
    // 使用者登入
    const response = await api.post('/api/auth/login', {
      email: userEmail,
      password: 'Test123!',
    });
    
    userToken = response.data.data.token;
    setAuthToken(userToken);
    
    console.log('✅ 使用者登入成功');
    console.log(`🔒 Token: ${userToken.substring(0, 15)}...`);
    
    return true;
  } catch (error) {
    console.error('❌ 使用者登入失敗:', error.response?.data || error.message);
    return false;
  }
};

// 測試取得使用者資料
const testGetUserInfo = async () => {
  try {
    console.log('\n👤 測試取得使用者資料...');
    
    // 設置使用者 Token
    setAuthToken(userToken);
    
    const response = await api.get('/api/auth/me');
    
    console.log('✅ 取得使用者資料成功');
    console.log(`📝 姓名: ${response.data.data.user.name}`);
    console.log(`📧 Email: ${response.data.data.user.email}`);
    console.log(`🧢 角色: ${response.data.data.user.roles.join(', ')}`);
    
    return true;
  } catch (error) {
    console.error('❌ 取得使用者資料失敗:', error.response?.data || error.message);
    return false;
  }
};

// 測試管理員更新使用者
const testUpdateUser = async () => {
  try {
    console.log('\n✏️ 測試管理員更新使用者...');
    
    // 設置管理員 Token
    setAuthToken(adminToken);
    
    const response = await api.put(`/api/users/${userId}`, {
      name: '已更新的測試使用者',
      roles: ['user', 'editor'],
      isVerified: true,
    });
    
    console.log('✅ 更新使用者成功');
    console.log(`📝 新姓名: ${response.data.data.user.name}`);
    console.log(`🧢 新角色: ${response.data.data.user.roles.join(', ')}`);
    console.log(`✅ 驗證狀態: ${response.data.data.user.isVerified ? '已驗證' : '未驗證'}`);
    
    return true;
  } catch (error) {
    console.error('❌ 更新使用者失敗:', error.response?.data || error.message);
    return false;
  }
};

// 執行所有測試
const runTests = async () => {
  console.log('🧪 開始執行 API 測試...');
  
  const tests = [
    { name: '管理員登入', fn: testAdminLogin },
    { name: '創建工作區', fn: testCreateTenant },
    { name: '註冊使用者', fn: testRegisterUser },
    { name: '使用者登入', fn: testUserLogin },
    { name: '取得使用者資料', fn: testGetUserInfo },
    { name: '更新使用者', fn: testUpdateUser },
  ];
  
  let passCount = 0;
  let failCount = 0;
  
  for (const test of tests) {
    const result = await test.fn();
    if (result) {
      passCount++;
    } else {
      failCount++;
      // 若某些測試失敗，可能影響後續測試，視情況考慮中斷
      if (['管理員登入', '創建工作區'].includes(test.name)) {
        console.error(`❌ ${test.name} 失敗，中斷後續測試`);
        break;
      }
    }
  }
  
  console.log('\n📊 測試結果摘要');
  console.log(`✅ 通過: ${passCount}`);
  console.log(`❌ 失敗: ${failCount}`);
  console.log(`📈 通過率: ${Math.round((passCount / tests.length) * 100)}%`);
  
  if (failCount === 0) {
    console.log('🎉 所有測試通過！');
  } else {
    console.log('⚠️ 部分測試失敗，請檢查錯誤訊息');
  }
};

// 執行測試
runTests();