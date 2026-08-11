// client/src/pages/auth/LoginPage.jsx - 修改登入頁面增加展示用帳號
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
  FormErrorMessage,
  InputGroup,
  InputRightElement,
  useToast,
  Alert,
  AlertIcon,
  Text,
  Flex,
  Divider,
  Image,
  VStack,
  HStack,
  Badge,
  useColorModeValue,
  Heading,
  Icon,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { FiInfo, FiLogIn } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';
import { useError } from '../../contexts/ErrorContext';
import AuthLayout from '../../layouts/AuthLayout';

// 登入表單驗證 Schema
const loginSchema = yup.object().shape({
    email: yup
      .string()
      .required('請輸入電子郵件')
      .email('請輸入有效的電子郵件格式'),
    password: yup.string().required('請輸入密碼'),
    tenantId: yup.string().required('請輸入工作區 ID'), 
  });

const LoginPage = () => {
  const { login, isAuthenticated } = useAuth();
  const { updatePageTitle } = useUI();
  const { showError } = useError();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  
  // 來源頁面（若有）
  const from = location.state?.from?.pathname || '/dashboard';
  
  // 表單狀態
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue
  } = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      tenantId: '', 
    },
  });
  
  // 密碼顯示開關
  const [showPassword, setShowPassword] = useState(false);
  
  // 錯誤訊息
  const [loginError, setLoginError] = useState('');

  // 展示用帳號資訊
  const demoAccount = {
    email: 'admin@authnexus.com',
    password: 'Admin123!',
    tenantId: '6818461cc4e93d9c70a49684'
  };
  
  // 更新頁面標題
  useEffect(() => {
    updatePageTitle('登入');
  }, [updatePageTitle]);
  
  // 若已登入，重定向到目標頁面
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);
  
  // 自動填入展示帳號
  const fillDemoAccount = () => {
    setValue('email', demoAccount.email);
    setValue('password', demoAccount.password);
    setValue('tenantId', demoAccount.tenantId);
    
    toast({
      title: '已填入展示帳號',
      description: '您可以直接點擊「登入」按鈕繼續',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };
  
  // 提交表單
  const onSubmit = async (data) => {
    try {
      setLoginError('');
      const success = await login(data.email, data.password, data.tenantId || null);
      
      if (success) {
        // 登入成功，將由 AuthContext 自動重定向
      } else {
        setLoginError('登入失敗，請檢查您的認證資訊');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || '登入失敗，請稍後再試';
      setLoginError(errorMessage);
      
      // 使用 ErrorContext 顯示錯誤
      showError(errorMessage, '登入失敗');
    }
  };

  // 強調框背景色
  const demoBgColor = useColorModeValue('blue.50', 'blue.900');
  const demoBorderColor = useColorModeValue('blue.200', 'blue.700');
  
  return (
    <AuthLayout title="登入系統">
      {/* 展示系統提示 */}
      <Box 
        mb={6} 
        p={5} 
        bg={demoBgColor} 
        borderRadius="lg" 
        border="1px solid" 
        borderColor={demoBorderColor}
        position="relative"
      >
        <HStack spacing={2} mb={3}>
          <Icon as={FiInfo} color="blue.500" boxSize="20px" />
          <Heading size="sm">這是一個展示系統</Heading>
          <Badge colorScheme="blue" fontSize="0.8em">DEMO</Badge>
        </HStack>
        
        <VStack align="start" spacing={1} mb={4}>
          <Text fontWeight="medium">請點擊使用預設管理員帳號：</Text>
        </VStack>
        
        <Button
          leftIcon={<FiLogIn />}
          colorScheme="blue"
          size="sm"
          onClick={fillDemoAccount}
          mb={1}
          width="full"
        >
          自動填入展示帳號
        </Button>
        
        <Text fontSize="xs" color="gray.500" mt={1}>
          注意：展示系統中的所有資料僅供功能展示，不會儲存敏感資訊
        </Text>
      </Box>
      
      {/* 錯誤提示 */}
      {loginError && (
        <Alert status="error" mb={4} borderRadius="md">
          <AlertIcon />
          {loginError}
        </Alert>
      )}
      
      {/* 登入表單 */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={4}>
          {/* 電子郵件 */}
          <FormControl isInvalid={!!errors.email} isRequired>
            <FormLabel>電子郵件</FormLabel>
            <Input
              type="email"
              placeholder="請輸入電子郵件"
              {...register('email')}
            />
            <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
          </FormControl>
          
          {/* 密碼 */}
          <FormControl isInvalid={!!errors.password} isRequired>
            <FormLabel>密碼</FormLabel>
            <InputGroup>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="請輸入密碼"
                {...register('password')}
              />
              <InputRightElement width="3rem">
                <Button
                  h="1.5rem"
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <ViewOffIcon /> : <ViewIcon />}
                </Button>
              </InputRightElement>
            </InputGroup>
            <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
          </FormControl>
          
         {/* 工作區 ID */}
         <FormControl isInvalid={!!errors.tenantId} isRequired>
            <FormLabel>工作區 ID</FormLabel>
            <Input
              placeholder="請輸入工作區 ID"
              {...register('tenantId')}
            />
            <FormErrorMessage>{errors.tenantId?.message}</FormErrorMessage>
          </FormControl>
          
          {/* 提交按鈕 */}
          <Button
            type="submit"
            colorScheme="brand"
            size="lg"
            isLoading={isSubmitting}
            loadingText="登入中..."
            mt={2}
          >
            登入
          </Button>
        </Stack>
      </form>
      
      {/* 其他資訊 */}
      <Flex direction="column" mt={8} align="center">
        <Divider mb={4} />
        <Text fontSize="sm" color="gray.500" mt={1}>
          © {new Date().getFullYear()} Auth Nexus
        </Text>
      </Flex>
    </AuthLayout>
  );
};

export default LoginPage;