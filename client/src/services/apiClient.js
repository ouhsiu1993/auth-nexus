// src/services/apiClient.js
import axios from 'axios';

// 建立 axios 實例
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 請求攔截器 - 添加認證 token
apiClient.interceptors.request.use(
  (config) => {
    // 從本地儲存獲取 token
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // 開發測試用，打印請求資訊
    if (import.meta.env.MODE !== 'production') {
      console.log('API 請求:', {
        url: config.url,
        method: config.method,
        data: config.data,
        headers: config.headers
      });
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 回應攔截器 - 處理常見錯誤
apiClient.interceptors.response.use(
  (response) => {
    // 打印回應數據（僅開發環境）
    if (import.meta.env.MODE !== 'production') {
      console.log('API 回應成功:', {
        url: response.config.url,
        method: response.config.method,
        status: response.status,
        data: response.data
      });
    }
    return response;
  },
  (error) => {
    // 打印錯誤信息（僅開發環境）
    if (import.meta.env.MODE !== 'production') {
      console.error('API 請求錯誤:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      });
    }

    // 處理常見錯誤
    if (error.response) {
      // 服務器響應錯誤
      switch (error.response.status) {
        case 401:
          // 未認證，清除本地存儲的認證信息
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_info');
          
          // 如果不是在登入頁面，重定向到登入頁面
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          break;
        
        case 403:
          // 無權限訪問
          console.error('無權限訪問資源:', error.response.data);
          break;
        
        case 404:
          // 資源不存在
          console.error('請求的資源不存在:', error.response.data);
          break;
        
        case 500:
          // 服務器錯誤
          console.error('伺服器內部錯誤:', error.response.data);
          break;
        
        default:
          // 其他錯誤
          console.error(`HTTP 錯誤 ${error.response.status}:`, error.response.data);
      }
    } else if (error.request) {
      // 請求發送但未收到響應
      console.error('未收到伺服器回應:', error.request);
    } else {
      // 請求設置出錯
      console.error('請求設置錯誤:', error.message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;