// client/src/services/userService.js
import apiClient from './apiClient';

// 獲取所有使用者（支援分頁和工作區過濾）
const getAllUsers = async (page = 1, limit = 10, tenantId = null, includeDeleted = false) => {
    try {
      let url = '/api/users';
      const params = { page, limit };
      
      // 如果有工作區 ID，添加到查詢參數
      if (tenantId) {
        params.tenantId = tenantId;
      }
      
      // 是否包含已刪除的使用者
      if (includeDeleted) {
        params.includeDeleted = true;
      }
      
      const response = await apiClient.get(url, { params });
      
      // 根據後端 API 的實際回應結構調整
      return {
        users: response.data.data.users || [],
        pagination: response.data.data.pagination || {
          page,
          limit,
          total: 0,
          totalPages: 0
        },
      };
    } catch (error) {
      console.error('獲取使用者列表失敗:', error.response?.data || error.message);
      throw error;
    }
  };

// 獲取特定使用者
const getUser = async (id) => {
  try {
    const response = await apiClient.get(`/api/users/${id}`);
    return response.data.data.user;
  } catch (error) {
    console.error('獲取使用者資料失敗:', error.response?.data || error.message);
    throw error;
  }
};

// 創建新使用者
const createUser = async (userData) => {
  try {
    const response = await apiClient.post('/api/users', userData);
    
    // 判斷是新建立還是恢復（由後端回傳 restored 標記）
    if (response.data.data.restored) {
      return {
        user: response.data.data.user,
        restored: true
      };
    }
    
    // 標準化返回格式，始終包含 user 屬性
    return {
      user: response.data.data.user,
      restored: false
    };
  } catch (error) {
    console.error('建立使用者失敗:', error.response?.data || error.message);
    throw error;
  }
};

// 更新使用者資訊
const updateUser = async (id, userData) => {
  try {
    const response = await apiClient.put(`/api/users/${id}`, userData);
    return response.data.data.user;
  } catch (error) {
    console.error('更新使用者失敗:', error.response?.data || error.message);
    throw error;
  }
};

// 重設使用者密碼
const resetPassword = async (id, passwordData) => {
  try {
    const response = await apiClient.post(`/api/users/${id}/reset-password`, passwordData);
    return response.data.data;
  } catch (error) {
    console.error('重設密碼失敗:', error.response?.data || error.message);
    throw error;
  }
};

// 軟刪除使用者
const softDeleteUser = async (id) => {
    try {
      const response = await apiClient.delete(`/api/users/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('刪除使用者失敗:', error.response?.data || error.message);
      throw error;
    }
  };
  
// 恢復已刪除的使用者
const restoreUser = async (id) => {
  try {
    const response = await apiClient.post(`/api/users/${id}/restore`);
    return response.data.data;
  } catch (error) {
    console.error('恢復使用者失敗:', error.response?.data || error.message);
    throw error;
  }
};
  
const userService = {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  resetPassword,
  softDeleteUser,
  restoreUser
};
  
export default userService;