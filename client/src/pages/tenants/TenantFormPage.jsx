// src/pages/tenants/TenantFormPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Heading,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  Switch,
  HStack,
  useToast,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from '@chakra-ui/react';
import { ChevronRightIcon } from '@chakra-ui/icons';
import { FiSave, FiArrowLeft } from 'react-icons/fi';
import { useForm, FormProvider } from 'react-hook-form';
import FormInput from '../../components/forms/FormInput';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link } from 'react-router-dom';
import { useUI } from '../../contexts/UIContext';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import AlertMessage from '../../components/ui/AlertMessage';
import tenantService from '../../services/tenantService';


// 表單驗證 Schema
const tenantSchema = yup.object().shape({
  name: yup
    .string()
    .required('工作區名稱為必填')
    .min(2, '工作區名稱至少需要 2 個字元')
    .max(100, '工作區名稱不可超過 100 個字元'),
  isActive: yup.boolean(),
});

const TenantFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { updatePageTitle } = useUI();
  const toast = useToast();
  const [loading, setLoading] = useState(id ? true : false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [tenant, setTenant] = useState(null);
  
  const isEditMode = !!id;
  
  // React Hook Form 設定
  const methods = useForm({
    resolver: yupResolver(tenantSchema),
    defaultValues: {
      name: '',
      isActive: true,
    },
  });
  
  const { handleSubmit, formState: { errors }, reset, setValue } = methods;
  
  // 更新頁面標題
  useEffect(() => {
    updatePageTitle(isEditMode ? '編輯工作區' : '新增工作區');
  }, [updatePageTitle, isEditMode]);
  
  // 獲取工作區資料（編輯模式）
  useEffect(() => {
    const fetchTenant = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const data = await tenantService.getTenant(id);
        console.log('工作區詳細資料:', data);
        setTenant(data);
        
        // 設置表單預設值
        reset({
          name: data.name,
          isActive: data.isActive,
        });
      } catch (error) {
        console.error('獲取工作區資料失敗', error);
        setError('無法載入工作區資料，請檢查 ID 是否正確或聯絡系統管理員');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTenant();
  }, [id, reset]);
  
// 提交表單
const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      setError(null);
      
      let submitData;
      let result;
      
      if (isEditMode) {
        // 編輯模式下可包含 isActive
        submitData = {
          name: data.name
        };
        
        // 只有在編輯模式下才添加 isActive
        if (data.isActive !== undefined) {
          submitData.isActive = data.isActive;
        }
        
        // 更新工作區
        result = await tenantService.updateTenant(id, submitData);
        console.log('更新後的工作區資料:', result);
      } else {
        // 建立模式下只傳送 name
        submitData = { name: data.name };
        
        // 建立新工作區
        result = await tenantService.createTenant(submitData);
        console.log('新建立的工作區資料:', result);
      }
      
      toast({
        title: isEditMode ? '工作區已更新' : '工作區已建立',
        description: `工作區 "${result.name}" ${isEditMode ? '已成功更新' : '已成功建立'}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // 返回列表頁面
      navigate('/tenants');
    } catch (error) {
      console.error(isEditMode ? '更新工作區失敗' : '建立工作區失敗', error);
      
      setError(
        error.response?.data?.message || 
        `${isEditMode ? '更新' : '建立'}工作區時發生錯誤，請稍後再試`
      );
      
      toast({
        title: isEditMode ? '更新失敗' : '建立失敗',
        description: error.response?.data?.message || '請檢查表單資料是否正確',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  // 載入中
  if (loading) {
    return <LoadingSpinner size="xl" />;
  }
  
  // 編輯模式但找不到工作區
  if (isEditMode && !tenant && !loading) {
    return (
      <AlertMessage
        status="error"
        title="找不到工作區"
        message="無法找到指定的工作區，請檢查 ID 是否正確"
        mb={4}
      />
    );
  }
  
  return (
    <Box>
      {/* 麵包屑導航 */}
      <Breadcrumb 
        separator={<ChevronRightIcon color="gray.500" />}
        mb={6}
      >
        <BreadcrumbItem>
          <BreadcrumbLink as={Link} to="/tenants">
            工作區管理
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink>
            {isEditMode ? '編輯工作區' : '新增工作區'}
          </BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>
      
      {/* 頁面標題 */}
      <Heading as="h1" size="xl" mb={6}>
        {isEditMode ? '編輯工作區' : '新增工作區'}
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
      
      {/* 工作區表單 */}
      <Card>
      <FormProvider {...methods}>
  <form onSubmit={methods.handleSubmit(onSubmit)}noValidate>
    {/* 工作區名稱 */}
    <FormInput
      name="name"
      label="工作區名稱"
      placeholder="輸入工作區名稱"
      isRequired
    />
    
    {/* 工作區狀態（僅編輯模式顯示） */}
    {isEditMode && (
      <FormControl mb={4}>
        <FormLabel htmlFor="isActive">啟用狀態</FormLabel>
        <HStack>
          <Switch
            id="isActive"
            colorScheme="brand"
            size="lg"
            {...methods.register('isActive')}
          />
          <Box>
            {methods.watch('isActive') ? '已啟用' : '已停用'}
          </Box>
        </HStack>
      </FormControl>
    )}
    
    {/* API Key 顯示（僅編輯模式顯示） */}
    {isEditMode && tenant?.apiKey && (
      <FormControl mb={4}>
        <FormLabel>API Key</FormLabel>
        <Input
          value={tenant.apiKey}
          isReadOnly
          fontFamily="mono"
        />
      </FormControl>
    )}
    
    {/* 表單按鈕 */}
    <Flex mt={6} justifyContent="space-between">
      <Button
        as={Link}
        to="/tenants"
        leftIcon={<FiArrowLeft />}
        variant="outline"
      >
        返回列表
      </Button>
      
      <Button
        type="submit"
        colorScheme="brand"
        leftIcon={<FiSave />}
        isLoading={submitting}
        loadingText={isEditMode ? '儲存中...' : '建立中...'}
      >
        {isEditMode ? '儲存變更' : '建立工作區'}
      </Button>
    </Flex>
  </form>
</FormProvider>
      </Card>
    </Box>
  );
};

export default TenantFormPage;