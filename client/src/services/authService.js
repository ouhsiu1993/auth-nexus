// client/src/services/authService.js - 修改認證服務
import apiClient from './apiClient';
import jwtDecode from 'jwt-decode';

const AUTH_TOKEN_KEY = 'auth_token';
const USER_INFO_KEY = 'user_info';
const TENANT_ID_KEY = 'tenant_id';

// 登入服務
const login = async (email, password, tenantId) => {
    if (!tenantId) {
      throw new Error('工作區 ID 為必填欄位');
    }
    
    try {
        const response = await apiClient.post(
            '/api/auth/login',
            { email, password },
            {
              headers: {
                'x-tenant-id': tenantId,
              },
            }
          );
      
      if (response.data && response.data.data.token) {
        // 儲存 token 和使用者資訊到 localStorage
        localStorage.setItem(AUTH_TOKEN_KEY, response.data.data.token);
        localStorage.setItem(USER_INFO_KEY, JSON.stringify(response.data.data.user));
        
        // 儲存工作區 ID
        localStorage.setItem(TENANT_ID_KEY, tenantId);
        
        return response.data.data;
      }
      
      return null;
    } catch (error) {
      console.error('登入失敗:', error.response?.data || error.message);
      throw error;
    }
  };

// 註冊服務
const register = async (userData, tenantId) => {
    if (!tenantId) {
      throw new Error('工作區 ID 為必填欄位');
    }
    
    try {
        const response = await apiClient.post(
            '/api/auth/register',
            userData,
            {
              headers: {
                'x-tenant-id': tenantId,
              },
            }
          );
      
      if (response.data && response.data.data.token) {
        // 儲存 token 和使用者資訊
        localStorage.setItem(AUTH_TOKEN_KEY, response.data.data.token);
        localStorage.setItem(USER_INFO_KEY, JSON.stringify(response.data.data.user));
        
        // 儲存工作區 ID
        localStorage.setItem(TENANT_ID_KEY, tenantId);
        
        return response.data.data;
      }
      
      return null;
    } catch (error) {
      console.error('註冊失敗:', error.response?.data || error.message);
      throw error;
    }
  };

// 登出服務
const logout = () => {
  // 清除所有認證相關資訊
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(USER_INFO_KEY);
  localStorage.removeItem(TENANT_ID_KEY);
  
  // 重新整理頁面或導向到登入頁面
  window.location.href = '/login';
};

// 獲取目前使用者資訊
const getCurrentUser = () => {
  const userInfoString = localStorage.getItem(USER_INFO_KEY);
  return userInfoString ? JSON.parse(userInfoString) : null;
};

// 獲取目前 token
const getToken = () => {
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

// 獲取目前工作區 ID
const getTenantId = () => {
  return localStorage.getItem(TENANT_ID_KEY);
};

// 檢查使用者是否已登入
const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;
  
  try {
    // 解析 JWT token
    const decodedToken = jwtDecode(token);
    
    // 檢查 token 是否已過期
    const currentTime = Date.now() / 1000;
    if (decodedToken.exp < currentTime) {
      // Token 已過期
      logout();
      return false;
    }
    
    return true;
  } catch (error) {
    // JWT 解析錯誤，視為未登入
    return false;
  }
};

// 檢查使用者是否為超級管理員
const isSuperAdmin = () => {
  const user = getCurrentUser();
  return user && user.roles && user.roles.includes('super_admin');
};

// 檢查使用者是否為管理員
const isAdmin = () => {
  const user = getCurrentUser();
  return user && user.roles && user.roles.includes('admin');
};

// 檢查使用者是否有管理權限（super_admin 或 admin）
const hasManagementRole = () => {
  const user = getCurrentUser();
  if (!user || !user.roles) return false;
  return user.roles.some(role => ['super_admin', 'admin'].includes(role));
};

// 檢查使用者是否有特定角色
const hasRole = (role) => {
  const user = getCurrentUser();
  return user && user.roles && user.roles.includes(role);
};

// 獲取使用者個人資料
const getProfile = async () => {
    const tenantId = getTenantId();
    if (!tenantId) {
      throw new Error('找不到工作區 ID');
    }
    
    try {
        const response = await apiClient.get('/api/auth/me', {
            headers: {
              'x-tenant-id': tenantId,
            },
          });
      return response.data.data.user;
    } catch (error) {
      console.error('獲取個人資料失敗:', error.response?.data || error.message);
      throw error;
    }
  };

/**
 * 發送驗證郵件
 * @param {string} userId - 使用者 ID
 * @returns {Promise} - API 回應
 */
const sendVerificationEmail = async (userId) => {
  try {
    const tenantId = localStorage.getItem(TENANT_ID_KEY);
    
    if (!tenantId) {
      throw new Error('找不到工作區 ID');
    }
    
    const response = await apiClient.post(
      '/api/auth/send-verification-email',
      { userId },
      {
        headers: {
          'x-tenant-id': tenantId,
        },
      }
    );
    
    return response.data.data;
  } catch (error) {
    console.error('發送驗證郵件失敗:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * 發送重設密碼郵件
 * @param {string} userId - 使用者 ID
 * @returns {Promise} - API 回應
 */
const sendResetPasswordEmail = async (userId) => {
  try {
    const tenantId = localStorage.getItem(TENANT_ID_KEY);
    
    if (!tenantId) {
      throw new Error('找不到工作區 ID');
    }
    
    const response = await apiClient.post(
      '/api/auth/send-reset-password-email',
      { userId },
      {
        headers: {
          'x-tenant-id': tenantId,
        },
      }
    );
    
    return response.data.data;
  } catch (error) {
    console.error('發送重設密碼郵件失敗:', error.response?.data || error.message);
    throw error;
  }
};

const authService = {
  login,
  register,
  logout,
  getCurrentUser,
  getToken,
  getTenantId,
  isAuthenticated,
  isSuperAdmin,
  isAdmin,
  hasManagementRole,
  hasRole,
  getProfile,
  sendVerificationEmail,
  sendResetPasswordEmail
};

export default authService;