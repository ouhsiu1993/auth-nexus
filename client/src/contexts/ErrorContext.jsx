// src/contexts/ErrorContext.jsx
import { createContext, useContext, useState, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';

// 建立上下文
const ErrorContext = createContext();

// 建立 Provider 元件
export const ErrorProvider = ({ children }) => {
  const toast = useToast();
  const [error, setError] = useState(null);

  // 顯示錯誤訊息
  const showError = useCallback((message, title = '錯誤') => {
    setError({ message, title });
    
    toast({
      title: title,
      description: message,
      status: 'error',
      duration: 5000,
      isClosable: true,
      position: 'top',
    });
  }, [toast]);

  // 顯示成功訊息
  const showSuccess = useCallback((message, title = '成功') => {
    toast({
      title: title,
      description: message,
      status: 'success',
      duration: 3000,
      isClosable: true,
      position: 'top',
    });
  }, [toast]);

  // 顯示提示訊息
  const showInfo = useCallback((message, title = '提示') => {
    toast({
      title: title,
      description: message,
      status: 'info',
      duration: 3000,
      isClosable: true,
      position: 'top',
    });
  }, [toast]);

  // 清除錯誤
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 提供的上下文值
  const value = {
    error,
    showError,
    showSuccess,
    showInfo,
    clearError,
  };

  return <ErrorContext.Provider value={value}>{children}</ErrorContext.Provider>;
};

// 自定義 Hook 方便使用
export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError 必須在 ErrorProvider 內使用');
  }
  return context;
};

export default ErrorContext;