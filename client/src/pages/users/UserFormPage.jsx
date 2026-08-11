// src/pages/users/UserFormPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Heading,
  Button,
  Flex,
  useToast,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from '@chakra-ui/react';
import { ChevronRightIcon } from '@chakra-ui/icons';
import { FiArrowLeft } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useUI } from '../../contexts/UIContext';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import AlertMessage from '../../components/ui/AlertMessage';
import UserForm from '../../components/forms/UserForm';
import userService from '../../services/userService';
import tenantService from '../../services/tenantService';
import authService from '../../services/authService';

const UserFormPage = () => {
  const navigate = useNavigate();
  const { updatePageTitle } = useUI();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [tenants, setTenants] = useState([]);
  
  // 更新頁面標題
  useEffect(() => {
    updatePageTitle('新增使用者');
  }, [updatePageTitle]);
  
  // 獲取工作區資料
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        setLoading(true);
        const tenantsData = await tenantService.getAllTenants(1, 100);
        setTenants(tenantsData.tenants || []);
      } catch (error) {
        console.error('獲取工作區列表失敗', error);
        setError('無法載入工作區資料，請重新整理頁面或聯絡系統管理員');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTenants();
  }, []);
  
  // 提交表單
const handleSubmit = async (data, sendVerificationEmail) => {
  try {
    setSubmitting(true);
    setError(null);
    
    // 創建使用者
    const result = await userService.createUser(data);
    console.log('新建立的使用者:', result);
    
    toast({
      title: '使用者已建立',
      description: `使用者 "${result.user.name}" 已成功建立`,
      status: 'success',
      duration: 5000,
      isClosable: true,
    });
    
    // 如果需要發送驗證郵件
    if (sendVerificationEmail) {
      try {
        await authService.sendVerificationEmail(result.user._id);
        
        toast({
          title: '驗證郵件已發送',
          description: `驗證郵件已成功發送至 ${result.user.email}`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } catch (emailError) {
        console.error('發送驗證郵件失敗', emailError);
        
        toast({
          title: '驗證郵件發送失敗',
          description: emailError.response?.data?.message || '無法發送驗證郵件，使用者已建立',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
      }
    }
    
    // 返回列表頁面
    navigate('/users');
  } catch (error) {
    console.error('建立使用者失敗', error);
    setError(
      error.response?.data?.message || 
      '建立使用者時發生錯誤，請稍後再試'
    );
    
    toast({
      title: '建立失敗',
      description: error.response?.data?.message || '請檢查表單資料是否正確',
      status: 'error',
      duration: 5000,
      isClosable: true,
    });
  } finally {
    setSubmitting(false);
  }
};
  
  if (loading) {
    return <LoadingSpinner size="xl" />;
  }
  
  return (
    <Box>
      {/* 麵包屑導航 */}
      <Breadcrumb 
        separator={<ChevronRightIcon color="gray.500" />}
        mb={6}
      >
        <BreadcrumbItem>
          <BreadcrumbLink as={Link} to="/users">
            使用者管理
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink>
            新增使用者
          </BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>
      
      {/* 頁面標題 */}
      <Heading as="h1" size="xl" mb={6}>
        新增使用者
      </Heading>
      
      {/* 錯誤訊息 */}
      {error && (
        <AlertMessage
          status="error"
          title="操作失敗"
          message={error}
          mb={4}
        />
      )}
      
      {/* 使用者表單 */}
      <Card>
        <UserForm
          tenants={tenants}
          onSubmit={handleSubmit}
          isSubmitting={submitting}
          submitButtonText="建立使用者"
        />
        
        {/* 返回按鈕 */}
        <Flex mt={4} justifyContent="flex-start">
          <Button
            as={Link}
            to="/users"
            leftIcon={<FiArrowLeft />}
            variant="outline"
          >
            返回列表
          </Button>
        </Flex>
      </Card>
    </Box>
  );
};

export default UserFormPage;