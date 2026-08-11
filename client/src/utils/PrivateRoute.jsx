// client/src/utils/PrivateRoute.jsx - 修改路由保護元件
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';

/**
 * 保護路由元件
 * @param {Object} props
 * @param {boolean} props.requireAdmin - 是否需要管理員權限
 */
const PrivateRoute = ({ requireAdmin = false }) => {
  const { isAuthenticated, hasManagementRole, loading } = useAuth();
  const location = useLocation();
  
  // 檢查是否正在載入
  if (loading) {
    return <LoadingSpinner size="xl" />;
  }
  
  // 未登入，重定向到登入頁面
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // 需要管理員權限但不是管理角色，拒絕存取
  if (requireAdmin && !hasManagementRole()) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  // 通過驗證，渲染路由
  return <Outlet />;
};

export default PrivateRoute;