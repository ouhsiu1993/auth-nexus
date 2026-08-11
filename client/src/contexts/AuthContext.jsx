// client/src/contexts/AuthContext.jsx - 修改認證上下文
import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { useToast } from '@chakra-ui/react';

// 建立 Context
const AuthContext = createContext();

// 建立 Provider 元件
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const toast = useToast();

  // 初始化：檢查使用者是否已登入
  useEffect(() => {
    const initAuth = async () => {
      // 檢查本地儲存是否有 token 和使用者資訊
      if (authService.isAuthenticated()) {
        try {
          // 從本地儲存獲取使用者資訊
          const currentUser = authService.getCurrentUser();
          setUser(currentUser);
          
          // 透過 API 獲取最新使用者資訊
          const latestUserData = await authService.getProfile();
          
          // 更新使用者資訊
          setUser(latestUserData);
          localStorage.setItem('user_info', JSON.stringify(latestUserData));
        } catch (error) {
          console.error('獲取使用者資訊失敗', error);
          // 驗證失敗，清除本地資訊
          authService.logout();
          setUser(null);
        }
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  // 登入函數
  const login = async (email, password, tenantId = null) => {
    try {
      setLoading(true);
      const data = await authService.login(email, password, tenantId);
      
      if (data) {
        setUser(data.user);
        
        // 直接導航到儀表板頁面
        navigate('/dashboard');
        
        toast({
          title: '登入成功',
          description: `歡迎回來，${data.user.name}`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('登入失敗', error);
      
      toast({
        title: '登入失敗',
        description: error.response?.data?.message || '請檢查您的帳號密碼',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 註冊函數
  const register = async (userData, tenantId = null) => {
    try {
      setLoading(true);
      const data = await authService.register(userData, tenantId);
      
      if (data) {
        setUser(data.user);
        
        navigate('/dashboard');
        
        toast({
          title: '註冊成功',
          description: '您的帳號已成功建立',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('註冊失敗', error);
      
      toast({
        title: '註冊失敗',
        description: error.response?.data?.message || '請檢查您的註冊資訊',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 登出函數
  const logout = () => {
    authService.logout();
    setUser(null);
    navigate('/login');
  };
  
  // 檢查使用者是否有管理權限（super_admin 或 admin）
  const hasManagementRole = () => {
    if (!user || !user.roles) return false;
    return user.roles.some(role => ['super_admin', 'admin'].includes(role));
  };

  // 提供的上下文值
  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isSuperAdmin: user ? authService.isSuperAdmin() : false,
    hasRole: (role) => (user ? authService.hasRole(role) : false),
    hasManagementRole
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 自定義 Hook 方便使用
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth 必須在 AuthProvider 內使用');
  }
  return context;
};

export default AuthContext;