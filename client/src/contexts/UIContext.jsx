// src/contexts/UIContext.jsx - 更新支持 Hotjar 風格
import { createContext, useContext, useState, useCallback, useEffect } from 'react';

// 建立 Context
const UIContext = createContext();

// 建立 Provider 元件
export const UIProvider = ({ children }) => {
  // 從 localStorage 讀取側邊欄狀態，預設展開
  const getSavedSidebarState = () => {
    const savedState = localStorage.getItem('sidebar_state');
    return savedState ? JSON.parse(savedState) : true;
  };
  
  // 側邊欄狀態管理
  const [isSidebarOpen, setIsSidebarOpen] = useState(getSavedSidebarState);
  
  // 全域載入狀態管理
  const [isLoading, setIsLoading] = useState(false);
  
  // 當前頁面標題管理
  const [pageTitle, setPageTitle] = useState('');
  
  // 切換側邊欄狀態
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => {
      const newState = !prev;
      localStorage.setItem('sidebar_state', JSON.stringify(newState));
      return newState;
    });
  }, []);
  
  // 關閉側邊欄
  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
    localStorage.setItem('sidebar_state', 'false');
  }, []);
  
  // 開啟側邊欄
  const openSidebar = useCallback(() => {
    setIsSidebarOpen(true);
    localStorage.setItem('sidebar_state', 'true');
  }, []);
  
  // 開始全域載入
  const startLoading = useCallback(() => {
    setIsLoading(true);
  }, []);
  
  // 結束全域載入
  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);
  
  // 設置頁面標題
  const updatePageTitle = useCallback((title) => {
    setPageTitle(title);
    // 同時更新瀏覽器標題
    document.title = `${title} | ${import.meta.env.VITE_APP_NAME || 'Auth Nexus'}`;
  }, []);
  
  // 行動裝置的側邊欄自動關閉處理
  const handleNavigation = useCallback(() => {
    if (window.innerWidth < 768) {
      closeSidebar();
    }
  }, [closeSidebar]);

  // 監聽視窗大小變化
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && isSidebarOpen) {
        closeSidebar();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen, closeSidebar]);
  
  // 提供的上下文值
  const value = {
    isSidebarOpen,
    toggleSidebar,
    closeSidebar,
    openSidebar,
    isLoading,
    startLoading,
    stopLoading,
    pageTitle,
    updatePageTitle,
    handleNavigation,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

// 自定義 Hook 方便使用
export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI 必須在 UIProvider 內使用');
  }
  return context;
};

export default UIContext;