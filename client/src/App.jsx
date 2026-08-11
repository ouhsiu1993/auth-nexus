// client/src/App.jsx - 確保所有路由都正確配置

import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import theme from './theme';
import { AuthProvider } from './contexts/AuthContext';
import { UIProvider } from './contexts/UIContext';
import { ErrorProvider } from './contexts/ErrorContext';
import PrivateRoute from './utils/PrivateRoute';

// 頁面引入
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import TenantsListPage from './pages/tenants/TenantsListPage';
import TenantFormPage from './pages/tenants/TenantFormPage';
import UsersListPage from './pages/users/UsersListPage';
import UserDetailPage from './pages/users/UserDetailPage';
import UserFormPage from './pages/users/UserFormPage';
import NotFoundPage from './pages/NotFoundPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

// 確保這些頁面被正確導入
import EmailVerifiedPage from './pages/auth/EmailVerifiedPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import PasswordResetSuccessPage from './pages/auth/PasswordResetSuccessPage';

// 添加郵件驗證失敗頁面
import EmailVerificationFailedPage from './pages/auth/EmailVerificationFailedPage';

// 佈局引入
import MainLayout from './layouts/MainLayout';

const App = () => {
  return (
    <ChakraProvider theme={theme}>
      <Router>
        <ErrorProvider>
          <UIProvider>
            <AuthProvider>
              <Routes>
                {/* 公開路由 */}
                <Route path="/login" element={<LoginPage />} />
                
                {/* 郵件驗證路由 */}
                <Route path="/verify-email/:token" element={<EmailVerifiedPage />} />
                <Route path="/email-verified" element={<EmailVerifiedPage />} />
                <Route path="/email-verification-failed" element={<EmailVerificationFailedPage />} />
                
                {/* 密碼重設路由 */}
                <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                <Route path="/password-reset-success" element={<PasswordResetSuccessPage />} />
                
                {/* 保護路由 - 需要登入 */}
                <Route element={<PrivateRoute requireAdmin={true} />}>
                  <Route element={<MainLayout />}>
                    {/* 儀表板 */}
                    <Route path="/dashboard" element={<DashboardPage />} />
                    
                    {/* 工作區管理 */}
                    <Route path="/tenants" element={<TenantsListPage />} />
                    <Route path="/tenants/new" element={<TenantFormPage />} />
                    <Route path="/tenants/:id" element={<TenantFormPage />} />
                    
                    {/* 使用者管理 */}
                    <Route path="/users" element={<UsersListPage />} />
                    <Route path="/users/new" element={<UserFormPage />} />
                    <Route path="/users/:id" element={<UserDetailPage />} />
                    
                    {/* 設定頁面 - 預留 */}
                    <Route path="/settings" element={<div>設定頁面</div>} />
                    
                    {/* 存取控制 - 預留 */}
                    <Route path="/access-control" element={<div>存取控制</div>} />
                  </Route>
                </Route>
                
                {/* 未授權頁面 */}
                <Route path="/unauthorized" element={<UnauthorizedPage />} />
                
                {/* 預設路由重定向到儀表板 */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                
                {/* 404 頁面 - 捕獲所有未匹配的路由 */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </AuthProvider>
          </UIProvider>
        </ErrorProvider>
      </Router>
    </ChakraProvider>
  );
};

export default App;