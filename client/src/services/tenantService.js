// src/services/tenantService.js
import apiClient from './apiClient';

// 獲取所有工作區（支援分頁）
const getAllTenants = async (page = 1, limit = 10, includeDeleted = false) => {
    try {
      const params = { 
        page, 
        limit,
        includeDeleted: includeDeleted ? 'true' : 'false'
      };
      
      const response = await apiClient.get('/api/tenants', {
        params
      });
      
      // 根據後端 API 的實際回應結構調整
      return {
        tenants: response.data.data.tenants || [],
        pagination: response.data.data.pagination || {
          page,
          limit,
          total: 0,
          totalPages: 0
        },
      };
    } catch (error) {
      console.error('獲取工作區列表失敗:', error.response?.data || error.message);
      throw error;
    }
  };

// 獲取特定工作區
const getTenant = async (id) => {
  try {
    const response = await apiClient.get(`/api/tenants/${id}`);
    return response.data.data.tenant;
  } catch (error) {
    console.error('獲取工作區資料失敗:', error.response?.data || error.message);
    throw error;
  }
};

// 建立新工作區
const createTenant = async (tenantData) => {
  try {
    const response = await apiClient.post('/api/tenants', tenantData);
    return response.data.data.tenant;
  } catch (error) {
    console.error('建立工作區失敗:', error.response?.data || error.message);
    throw error;
  }
};

// 更新工作區資訊
const updateTenant = async (id, tenantData) => {
  try {
    const response = await apiClient.put(`/api/tenants/${id}`, tenantData);
    return response.data.data.tenant;
  } catch (error) {
    console.error('更新工作區失敗:', error.response?.data || error.message);
    throw error;
  }
};

// 重新產生 API Key
const refreshApiKey = async (id) => {
  try {
    const response = await apiClient.post(`/api/tenants/${id}/apikey/refresh`);
    return response.data.data.tenant;
  } catch (error) {
    console.error('重新產生 API Key 失敗:', error.response?.data || error.message);
    throw error;
  }
};

// 獲取特定工作區的所有使用者
const getTenantUsers = async (tenantId, page = 1, limit = 10) => {
  try {
    const response = await apiClient.get(`/api/tenants/${tenantId}/users`, {
      params: { page, limit },
    });
    
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
    console.error('獲取工作區使用者失敗:', error.response?.data || error.message);
    throw error;
  }
};

// 軟刪除工作區
const softDeleteTenant = async (id) => {
    try {
      const response = await apiClient.delete(`/api/tenants/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('刪除工作區失敗:', error.response?.data || error.message);
      throw error;
    }
  };
  
  // 恢復已刪除的工作區
  const restoreTenant = async (id) => {
    try {
      const response = await apiClient.post(`/api/tenants/${id}/restore`);
      return response.data.data;
    } catch (error) {
      console.error('恢復工作區失敗:', error.response?.data || error.message);
      throw error;
    }
  };
  
  const tenantService = {
    getAllTenants,
    getTenant,
    createTenant,
    updateTenant,
    refreshApiKey,
    getTenantUsers,
    softDeleteTenant,
    restoreTenant
  };
  
  export default tenantService;