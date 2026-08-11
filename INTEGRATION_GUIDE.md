# Auth-Nexus 整合指南

本文件將指導您如何將 Auth-Nexus 認證系統整合到您的 Web 應用程式中。

## 目錄

1. [前置準備](#前置準備)
2. [工作區設定](#工作區設定)
3. [前端整合](#前端整合)
4. [後端整合](#後端整合)
5. [使用者註冊與登入流程](#使用者註冊與登入流程)
6. [受保護的 API 呼叫](#受保護的-api-呼叫)
7. [電子郵件驗證流程](#電子郵件驗證流程)
8. [重設密碼流程](#重設密碼流程)
9. [常見問題排解](#常見問題排解)

## 前置準備

在開始整合前，請確保您已獲得以下資訊：

- Auth-Nexus 管理後台的帳號與密碼
- Auth-Nexus API 端點 URL (例如：`https://auth-nexus-api.example.com`)

## 工作區設定

1. 使用管理員帳號登入 Auth-Nexus 管理後台
2. 點擊「工作區管理」並創建一個新的工作區
3. 創建後，您將獲得：
   - 工作區 ID (`tenantId`)
   - API Key (`apiKey`)

**請妥善保管這些資訊，它們將用於您的應用與 Auth-Nexus 通信**

## 前端整合

以下示範如何在 React 應用中整合 Auth-Nexus。

### 1. 安裝必要套件

```bash
npm install axios jwt-decode
```

### 2. 創建 AuthContext

創建一個 `src/contexts/AuthContext.jsx` 檔案：

```jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import jwtDecode from 'jwt-decode';

// 建立 Context
const AuthContext = createContext();

// 設定 API 和租戶
const API_URL = 'https://your-auth-nexus-api.com';
const TENANT_ID = 'your-tenant-id'; // 來自工作區設定

// HTTP 客戶端
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-tenant-id': TENANT_ID
  }
});

// 認證提供者
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // 檢查是否已登入
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          // JWT 有效性檢查
          const decoded = jwtDecode(token);
          const currentTime = Date.now() / 1000;
          
          if (decoded.exp < currentTime) {
            // Token 已過期
            localStorage.removeItem('auth_token');
            setUser(null);
          } else {
            // 從存儲的資料中恢復使用者狀態
            const userData = JSON.parse(localStorage.getItem('user_info') || '{}');
            setUser(userData);
            
            // 可選：向後端驗證 token 並獲取最新使用者資料
            // await refreshUserData();
          }
        } catch (err) {
          // Token 無效
          localStorage.removeItem('auth_token');
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // 刷新使用者資料
  const refreshUserData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await api.get('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const userData = response.data.data.user;
      setUser(userData);
      localStorage.setItem('user_info', JSON.stringify(userData));
    } catch (err) {
      console.error('刷新使用者資料失敗', err);
      if (err.response?.status === 401) {
        // 處理 token 無效的情況
        logout();
      }
    }
  };

  // 註冊功能
  const register = async (userData) => {
    try {
      setError(null);
      const response = await api.post('/api/auth/register', userData);
      
      const { token, user } = response.data.data;
      
      // 儲存認證資訊
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user_info', JSON.stringify(user));
      
      setUser(user);
      return { success: true, user };
    } catch (err) {
      setError(err.response?.data?.message || '註冊失敗');
      return { success: false, error: err.response?.data?.message || '註冊失敗' };
    }
  };

  // 登入功能
  const login = async (email, password) => {
    try {
      setError(null);
      const response = await api.post('/api/auth/login', { email, password });
      
      const { token, user } = response.data.data;
      
      // 儲存認證資訊
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user_info', JSON.stringify(user));
      
      setUser(user);
      return { success: true, user };
    } catch (err) {
      setError(err.response?.data?.message || '登入失敗');
      return { success: false, error: err.response?.data?.message || '登入失敗' };
    }
  };

  // 登出功能
  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
    setUser(null);
    navigate('/login');
  };
  
  // 取得 token
  const getToken = () => {
    return localStorage.getItem('auth_token');
  };
  
  // 檢查角色
  const hasRole = (role) => {
    return user?.roles?.includes(role) || false;
  };

  // Context 值
  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    refreshUserData,
    isAuthenticated: !!user,
    getToken,
    hasRole
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 使用 Context 的 Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth 必須在 AuthProvider 內使用');
  }
  return context;
};

export default AuthContext;
```

### 3. 設置認證路由守衛

創建 `src/components/PrivateRoute.jsx`：

```jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PrivateRoute = ({ requiredRole }) => {
  const { isAuthenticated, loading, user, hasRole } = useAuth();
  
  if (loading) {
    return <div>載入中...</div>;
  }
  
  // 檢查是否已認證
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // 如果需要特定角色，檢查用戶是否有此角色
  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <Outlet />;
};

export default PrivateRoute;
```

### 4. 創建認證相關頁面

#### 登入頁面 (Login.jsx)

```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(email, password);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

  return (
    <div>
      <h1>登入</h1>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>電子郵件</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>密碼</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">登入</button>
      </form>
    </div>
  );
};

export default LoginPage;
```

#### 註冊頁面 (Register.jsx)

```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('密碼不一致');
      return;
    }
    
    const result = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      confirmPassword: formData.confirmPassword
    });
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

  return (
    <div>
      <h1>註冊</h1>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>姓名</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>電子郵件</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>密碼</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>確認密碼</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit">註冊</button>
      </form>
    </div>
  );
};

export default RegisterPage;
```

### 5. 設置路由

在 `App.js` 中設置路由：

```jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import UnauthorizedPage from './pages/UnauthorizedPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* 公開路由 */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          
          {/* 保護路由 - 基本用戶 */}
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
          
          {/* 保護路由 - 需要特定角色 */}
          <Route element={<PrivateRoute requiredRole="admin" />}>
            <Route path="/admin" element={<AdminPanel />} />
          </Route>
          
          {/* 預設路由 */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
```

## 後端整合

如果您需要在自己的後端服務中驗證 Auth-Nexus 簽發的 token，請按照以下步驟進行整合。

### 1. 創建 Auth 中介軟體 (Node.js/Express 環境)

```javascript
const jwt = require('jsonwebtoken');
const axios = require('axios');

// Auth-Nexus 設定
const AUTH_NEXUS_API = 'https://your-auth-nexus-api.com';
const TENANT_ID = 'your-tenant-id';
const JWT_SECRET = 'your-jwt-secret'; // 與 Auth-Nexus 使用相同的 JWT 密鑰

// 驗證 JWT Token 的中介軟體
const authenticate = async (req, res, next) => {
  try {
    // 從 Authorization header 獲取 token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '未提供認證 token' });
    }

    const token = authHeader.split(' ')[1];
    
    // 驗證 token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 將使用者資訊附加到請求對象
    req.user = decoded;
    
    // 可選：向 Auth-Nexus 驗證 token 是否有效
    // const response = await axios.get(`${AUTH_NEXUS_API}/api/auth/verify-token`, {
    //   headers: {
    //     'Authorization': `Bearer ${token}`,
    //     'x-tenant-id': TENANT_ID
    //   }
    // });
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token 已過期' });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: '無效的 token' });
    }
    
    console.error('認證錯誤:', error);
    return res.status(500).json({ message: '認證過程中發生錯誤' });
  }
};

// 角色授權中介軟體
const authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: '需要認證' });
    }
    
    // 確保使用者有要求的角色
    const userRoles = req.user.roles || [];
    const hasRole = roles.some(role => userRoles.includes(role));
    
    if (!hasRole) {
      return res.status(403).json({ message: '無權訪問此資源' });
    }
    
    next();
  };
};

module.exports = { authenticate, authorize };
```

### 2. 在路由中使用中介軟體

```javascript
const express = require('express');
const { authenticate, authorize } = require('./auth.middleware');
const router = express.Router();

// 公開路由
router.get('/public', (req, res) => {
  res.json({ message: '這是公開資源' });
});

// 需要認證的路由
router.get('/protected', authenticate, (req, res) => {
  res.json({ 
    message: '這是受保護的資源',
    user: req.user
  });
});

// 需要特定角色的路由
router.get('/admin', authenticate, authorize(['admin']), (req, res) => {
  res.json({ message: '這是管理員資源' });
});

// 或者合併使用
router.get(
  '/super-admin',
  [authenticate, authorize(['super_admin'])],
  (req, res) => {
    res.json({ message: '這是超級管理員資源' });
  }
);

module.exports = router;
```

## 使用者註冊與登入流程

### 註冊流程

1. 使用者在您的應用中填寫註冊表單
2. 您的前端調用 Auth-Nexus 的 `/api/auth/register` API，傳送：
   - 姓名
   - 電子郵件
   - 密碼
   - 工作區 ID (在 HTTP 頭部 `x-tenant-id`)
3. 註冊成功後，Auth-Nexus 會返回：
   - JWT Token
   - 使用者資訊
4. 前端儲存 token 並將使用者重定向到受保護頁面

### 登入流程

1. 使用者在您的應用中填寫登入表單
2. 您的前端調用 Auth-Nexus 的 `/api/auth/login` API，傳送：
   - 電子郵件
   - 密碼
   - 工作區 ID (在 HTTP 頭部 `x-tenant-id`)
3. 登入成功後，Auth-Nexus 會返回：
   - JWT Token
   - 使用者資訊
4. 前端儲存 token 並將使用者重定向到受保護頁面

## 受保護的 API 呼叫

所有需要認證的請求都需要在 HTTP 頭部附加以下資訊：

```javascript
headers: {
  'Authorization': `Bearer ${token}`,  // JWT Token
  'x-tenant-id': TENANT_ID            // 工作區 ID
}
```

範例：

```javascript
// 使用 axios 發送認證請求
const fetchProtectedData = async () => {
  const token = localStorage.getItem('auth_token');
  
  try {
    const response = await axios.get('https://your-api.com/protected-resource', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-tenant-id': TENANT_ID
      }
    });
    
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      // Token 無效或過期，重定向到登入頁面
      logout();
    }
    throw error;
  }
};
```

## 電子郵件驗證流程

Auth-Nexus 提供電子郵件驗證功能，流程如下：

1. 使用者註冊成功後，系統會自動將狀態設為「未驗證」
2. 管理員可以通過管理後台對該使用者點擊「發送驗證郵件」
3. 使用者會收到包含驗證連結的電子郵件，格式為：
   `https://your-app.com/verify-email/:token`
4. 使用者點擊連結後，前端應捕獲 token 參數並呼叫 Auth-Nexus 的驗證 API
5. 驗證成功後，使用者狀態會被更新為「已驗證」

### 前端處理驗證連結

在您的路由中添加驗證路由：

```jsx
<Route path="/verify-email/:token" element={<EmailVerificationPage />} />
```

創建 `EmailVerificationPage.jsx`：

```jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'https://your-auth-nexus-api.com';
const TENANT_ID = 'your-tenant-id';

const EmailVerificationPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('正在驗證您的電子郵件...');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        await axios.get(`${API_URL}/api/auth/verify-email/${token}`, {
          headers: {
            'x-tenant-id': TENANT_ID
          }
        });
        
        setStatus('success');
        setMessage('電子郵件驗證成功！');
        
        // 3秒後重定向到登入頁面
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.message || '驗證失敗，請聯繫管理員');
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div>
      <h1>電子郵件驗證</h1>
      <div className={`status ${status}`}>
        <p>{message}</p>
      </div>
    </div>
  );
};

export default EmailVerificationPage;
```

## 重設密碼流程

Auth-Nexus 提供重設密碼功能，流程如下：

1. 管理員可以通過管理後台對使用者點擊「重設密碼」按鈕
2. 使用者會收到包含重設密碼連結的電子郵件，格式為：
   `https://your-app.com/reset-password/:token`
3. 使用者點擊連結後，前端應捕獲 token 參數並顯示密碼重設表單
4. 使用者填寫新密碼並提交後，前端呼叫 Auth-Nexus 的密碼重設 API
5. 重設成功後，使用者可以使用新密碼登入

### 前端處理重設密碼

在您的路由中添加重設密碼路由：

```jsx
<Route path="/reset-password/:token" element={<ResetPasswordPage />} />
```

創建 `ResetPasswordPage.jsx`：

```jsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'https://your-auth-nexus-api.com';
const TENANT_ID = 'your-tenant-id';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('密碼不一致');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      await axios.post(
        `${API_URL}/api/auth/reset-password/${token}`,
        { password, confirmPassword },
        {
          headers: {
            'x-tenant-id': TENANT_ID
          }
        }
      );
      
      // 重設成功，導向到成功頁面或登入頁面
      navigate('/password-reset-success');
    } catch (err) {
      setError(err.response?.data?.message || '重設密碼失敗，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1>重設密碼</h1>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>新密碼</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label>確認新密碼</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <button 
          type="submit" 
          disabled={isLoading}
        >
          {isLoading ? '處理中...' : '重設密碼'}
        </button>
      </form>
    </div>
  );
};

export default ResetPasswordPage;
```

## 常見問題排解

### Token 相關問題

1. **Token 無效或已過期**
   - 確保前端正確儲存了 token
   - 檢查 JWT_SECRET 是否在所有服務中保持一致
   - 檢查 JWT_EXPIRES_IN 設定（預設為 7 天）

2. **"無權訪問此資源" 錯誤**
   - 確保使用者擁有訪問該資源所需的角色
   - 檢查 `x-tenant-id` 是否正確

### 工作區相關問題

1. **"工作區不存在" 錯誤**
   - 確保您使用的 `tenantId` 是有效的
   - 檢查該工作區是否已被停用

2. **"此帳號已被停用" 錯誤**
   - 聯絡管理員重新啟用帳號
   - 確保使用者狀態為 `isActive: true`

### 電子郵件相關問題

1. **沒有收到驗證郵件**
   - 檢查垃圾郵件資料夾
   - 請管理員重新發送驗證郵件
   - 確認管理後台中的電子郵件設定是否正確

2. **驗證連結無效**
   - 確保連結未被修改
   - 驗證連結有效期為 24 小時，過期需重新發送
   - 確保前端正確處理了 token 參數

### 安全建議

1. **保護 JWT Token**
   - 僅在 HTTPS 環境下傳輸 token
   - 不要將 token 存儲在 localStorage（容易受到 XSS 攻擊）
   - 考慮使用 httpOnly cookie 存儲 token

2. **處理 CORS**
   - 確保 Auth-Nexus 後端設定了正確的 CORS 政策
   - 在生產環境中限制允許的來源域名

3. **監控可疑活動**
   - 實施速率限制以防止暴力破解攻擊
   - 監控異常登入行為
   - 對敏感操作實施二次認證

## 結論

通過遵循本指南，您應該能夠將 Auth-Nexus 無縫整合到您的 Web 應用中。如果您遇到任何未在本文檔中涵蓋的問題，請參考 Auth-Nexus 的完整 API 文檔或聯繫系統管理員。

Auth-Nexus 致力於提供安全、可靠的認證服務，並將持續更新以滿足您的認證需求。