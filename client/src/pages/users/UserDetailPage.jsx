// src/pages/users/UserDetailPage.jsx
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
  Text,
  Badge,
  Grid,
  GridItem,
  VStack,
  Divider,
  Avatar,
  Stack,
  Checkbox,
  CheckboxGroup,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import { ChevronRightIcon } from '@chakra-ui/icons';
import { InputGroup, InputLeftElement } from '@chakra-ui/react';
// 導入所需圖標
import { FiSave, FiArrowLeft, FiLock, FiUser, FiMail, FiUserX, FiUserCheck, FiAlertCircle, FiTrash2, FiRotateCcw } from 'react-icons/fi';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link } from 'react-router-dom';
import { useUI } from '../../contexts/UIContext';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import AlertMessage from '../../components/ui/AlertMessage';
import userService from '../../services/userService';
import tenantService from '../../services/tenantService';
import authService from '../../services/authService';

// 表單驗證 Schema
const userUpdateSchema = yup.object().shape({
  name: yup
    .string()
    .required('使用者姓名為必填')
    .min(2, '使用者姓名至少需要 2 個字元')
    .max(50, '使用者姓名不可超過 50 個字元'),
  roles: yup.array().of(yup.string()).min(1, '至少需要選擇一個角色'),
  isActive: yup.boolean(),
  isVerified: yup.boolean(),
});

const UserDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { updatePageTitle } = useUI();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  
// 重設密碼對話框
const {
  isOpen: isResetPasswordOpen,
  onOpen: onResetPasswordOpen,
  onClose: onResetPasswordClose
} = useDisclosure();

// 驗證郵件對話框
const {
  isOpen: isVerificationEmailOpen,
  onOpen: onVerificationEmailOpen,
  onClose: onVerificationEmailClose
} = useDisclosure();

  // 狀態變更對話框
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [actionType, setActionType] = useState('');
  
  // 刪除對話框
  const { 
    isOpen: isDeleteOpen, 
    onOpen: onDeleteOpen, 
    onClose: onDeleteClose 
  } = useDisclosure();
  
  // React Hook Form 設定
  const methods = useForm({
    resolver: yupResolver(userUpdateSchema),
    defaultValues: {
      name: '',
      roles: ['user'],
      isActive: true,
      isVerified: false,
    },
  });
  
  const { handleSubmit, formState: { errors }, reset, setValue, watch, control } = methods;
  
  // 取得所選角色
  const selectedRoles = watch('roles', []);
  
  // 角色選項
  const roleOptions = [
    { value: 'super_admin', label: '超級管理員', description: '完整系統存取權限' },
    { value: 'admin', label: '管理員', description: '工作區內的管理權限（即將上線）', disabled: true },
    { value: 'editor', label: '編輯者', description: '可新增與編輯內容（即將上線）', disabled: true },
    { value: 'user', label: '一般使用者', description: '基本存取權限' },
    { value: 'viewer', label: '檢視者', description: '唯讀存取權限（即將上線）', disabled: true },
  ];
  
  // 判斷角色是否可編輯
  const canEditSuperAdmin = user?.roles?.includes('super_admin');
  
  // 更新頁面標題
  useEffect(() => {
    updatePageTitle('使用者詳情');
  }, [updatePageTitle]);
  
  // 獲取使用者資料
  useEffect(() => {
    const fetchUser = async () => {
      // 如果是新增使用者頁面，不需要獲取資料
      if (id === "new") {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // 獲取使用者資料
        const userData = await userService.getUser(id);
        console.log('使用者詳細資料:', userData);
        setUser(userData);
        
        // 安全地取得 tenantId
        const tenantId =
          typeof userData.tenantId === 'object'
            ? userData.tenantId._id
            : userData.tenantId;
        
        if (!tenantId) {
          console.warn('tenantId 為空');
          return;
        }
        
        // 獲取關聯的工作區資料
        const tenantData = await tenantService.getTenant(tenantId);
        console.log('工作區資料:', tenantData);
        setTenant(tenantData);
        
        // 設置表單預設值
        reset({
          name: userData.name,
          roles: userData.roles,
          isActive: userData.isActive,
          isVerified: userData.isVerified,
        });
      } catch (error) {
        console.error('獲取使用者資料失敗', error);
        setError('無法載入使用者資料，請檢查 ID 是否正確或聯絡系統管理員');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
  }, [id, reset]);
  
  // 提交表單
  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      setError(null);
      
      // 更新使用者
      const updatedUser = await userService.updateUser(id, data);
      console.log('更新後的使用者資料:', updatedUser);
      
      // 更新本地狀態
      setUser(updatedUser);
      
      toast({
        title: '使用者已更新',
        description: `使用者 "${updatedUser.name}" 的資料已成功更新`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('更新使用者失敗', error);
      
      setError(
        error.response?.data?.message || 
        '更新使用者時發生錯誤，請稍後再試'
      );
      
      toast({
        title: '更新失敗',
        description: error.response?.data?.message || '請檢查表單資料是否正確',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 處理使用者狀態變更
  const handleUserStateChange = async () => {
    try {
      setSubmitting(true);
      setError(null);
      
      let updateData = {};
      
      // 根據操作類型設定更新數據
      if (actionType === 'activate') {
        updateData = { isActive: true };
      } else if (actionType === 'deactivate') {
        updateData = { isActive: false };
      }
      
      // 更新使用者
      const updatedUser = await userService.updateUser(id, updateData);
      console.log('更新後的使用者資料:', updatedUser);
      
      // 更新本地狀態
      setUser(updatedUser);
      onClose();
      
      toast({
        title: actionType === 'activate' ? '使用者已啟用' : '使用者已停用',
        description: `使用者 "${updatedUser.name}" 的狀態已更新`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('更新使用者狀態失敗', error);
      
      setError(
        error.response?.data?.message || 
        '無法更新使用者狀態，請稍後再試'
      );
      
      toast({
        title: '操作失敗',
        description: error.response?.data?.message || '無法更新使用者狀態，請稍後再試',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  // 發送驗證郵件
  const handleSendVerificationEmail = async () => {
    try {
      setSubmitting(true);
      setError(null);
      
      // 發送驗證郵件
      await authService.sendVerificationEmail(user._id);
      
      toast({
        title: '驗證郵件已發送',
        description: `驗證郵件已成功發送至 ${user.email}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('發送驗證郵件失敗', error);
      
      setError(
        error.response?.data?.message || 
        '發送驗證郵件時發生錯誤，請稍後再試'
      );
      
      toast({
        title: '發送失敗',
        description: error.response?.data?.message || '無法發送驗證郵件，請稍後再試',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 發送重設密碼郵件
  const handleSendResetPasswordEmail = async () => {
    try {
      setSubmitting(true);
      setError(null);
      
      // 發送重設密碼郵件
      await authService.sendResetPasswordEmail(user._id);
      
      toast({
        title: '重設密碼郵件已發送',
        description: `重設密碼郵件已成功發送至 ${user.email}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('發送重設密碼郵件失敗', error);
      
      setError(
        error.response?.data?.message || 
        '發送重設密碼郵件時發生錯誤，請稍後再試'
      );
      
      toast({
        title: '發送失敗',
        description: error.response?.data?.message || '無法發送重設密碼郵件，請稍後再試',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  // 開啟狀態變更對話框
  const openStateChangeModal = (type) => {
    setActionType(type);
    onOpen();
  };
  
  // 處理狀態變更操作
  const handleStatusChange = async () => {
    if (!user) return;
    
    try {
      setSubmitting(true);
      
      let updateData = {};
      
      // 根據操作類型設定更新數據
      if (actionType === 'activate') {
        updateData = { isActive: true };
      } else if (actionType === 'deactivate') {
        updateData = { isActive: false };
      }
      
      // 更新使用者
      const updatedUser = await userService.updateUser(id, updateData);
      console.log('更新後的使用者狀態:', updatedUser);
      
      // 更新本地狀態
      setUser(updatedUser);
      
      // 更新表單狀態
      setValue('isActive', updatedUser.isActive);
      
      onClose();
      
      toast({
        title: actionType === 'activate' ? '使用者已啟用' : '使用者已停用',
        description: `使用者 "${updatedUser.name}" 的狀態已更新`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('更新使用者狀態失敗', error);
      
      toast({
        title: '操作失敗',
        description: error.response?.data?.message || '無法更新使用者狀態，請稍後再試',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 處理軟刪除使用者
  const handleSoftDeleteUser = async () => {
    try {
      setSubmitting(true);
      setError(null);
      
      // 軟刪除使用者
      await userService.softDeleteUser(id);
      
      toast({
        title: '使用者已刪除',
        description: `使用者 "${user.name}" 已成功刪除`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // 重新獲取使用者資料以更新狀態
      const userData = await userService.getUser(id);
      setUser(userData);
      
      // 關閉對話框
      onDeleteClose();
    } catch (error) {
      console.error('刪除使用者失敗', error);
      
      setError(
        error.response?.data?.message || 
        '刪除使用者時發生錯誤，請稍後再試'
      );
      
      toast({
        title: '刪除失敗',
        description: error.response?.data?.message || '請稍後再試',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  // 處理恢復已刪除的使用者
  const handleRestoreUser = async () => {
    try {
      setSubmitting(true);
      setError(null);
      
      // 恢復使用者
      await userService.restoreUser(id);
      
      toast({
        title: '使用者已恢復',
        description: `使用者 "${user.name}" 已成功恢復`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // 重新獲取使用者資料以更新狀態
      const userData = await userService.getUser(id);
      setUser(userData);
    } catch (error) {
      console.error('恢復使用者失敗', error);
      
      setError(
        error.response?.data?.message || 
        '恢復使用者時發生錯誤，請稍後再試'
      );
      
      toast({
        title: '恢復失敗',
        description: error.response?.data?.message || '請稍後再試',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  // 開啟刪除對話框
  const openDeleteModal = () => {
    onDeleteOpen();
  };
  
  // 載入中
  if (loading) {
    return <LoadingSpinner size="xl" />;
  }
  
  // 找不到使用者
  if (!user && !loading) {
    return (
      <AlertMessage
        status="error"
        title="找不到使用者"
        message="無法找到指定的使用者，請檢查 ID 是否正確"
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
          <BreadcrumbLink as={Link} to="/users">
            使用者管理
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink>
            使用者詳情
          </BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>
      
      {/* 頁面標題 */}
      <Heading as="h1" size="xl" mb={6}>
        使用者詳情
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
      
      {/* 使用者資訊卡片 */}
      <Card mb={6}>
        <Flex direction={{ base: 'column', md: 'row' }} gap={6}>
          {/* 使用者頭像 */}
          <Flex 
            justifyContent="center" 
            alignItems="center" 
            minW={{ base: 'full', md: '200px' }}
          >
            <Avatar 
              size="2xl" 
              name={user?.name} 
              bg="brand.500"
              color="white"
            />
          </Flex>
          
          {/* 使用者基本資訊 */}
          <Box flex={1}>
            <Grid 
              templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} 
              gap={4}
            >
              <GridItem>
                <VStack align="start" spacing={1}>
                  <Text color="gray.500" fontSize="sm">姓名</Text>
                  <Text fontSize="lg" fontWeight="medium">{user?.name}</Text>
                </VStack>
              </GridItem>
              
              <GridItem>
                <VStack align="start" spacing={1}>
                  <Text color="gray.500" fontSize="sm">Email</Text>
                  <Text fontSize="lg">{user?.email}</Text>
                </VStack>
              </GridItem>
              
              <GridItem>
                <VStack align="start" spacing={1}>
                  <Text color="gray.500" fontSize="sm">使用者 ID</Text>
                  <Text fontSize="sm" fontFamily="mono">{user?._id}</Text>
                </VStack>
              </GridItem>
              
              <GridItem>
                <VStack align="start" spacing={1}>
                  <Text color="gray.500" fontSize="sm">工作區</Text>
                  <Text fontSize="md">{tenant?.name || '未知工作區'}</Text>
                </VStack>
              </GridItem>
              
              <GridItem>
                <VStack align="start" spacing={1}>
                  <Text color="gray.500" fontSize="sm">狀態</Text>
                  {user?.isDeleted ? (
                    <Badge
                      colorScheme="red"
                      variant="solid"
                      borderRadius="full"
                      px={2}
                    >
                      已刪除
                    </Badge>
                  ) : (
                    <Badge
                      colorScheme={user?.isActive ? 'green' : 'red'}
                      variant="solid"
                      borderRadius="full"
                      px={2}
                    >
                      {user?.isActive ? '啟用' : '停用'}
                    </Badge>
                  )}
                </VStack>
              </GridItem>
              
              <GridItem>
                <VStack align="start" spacing={1}>
                  <Text color="gray.500" fontSize="sm">驗證狀態</Text>
                  <Badge
                    colorScheme={user?.isVerified ? 'green' : 'orange'}
                    variant="outline"
                    borderRadius="full"
                    px={2}
                  >
                    {user?.isVerified ? '已驗證' : '未驗證'}
                  </Badge>
                </VStack>
              </GridItem>
              
              <GridItem>
                <VStack align="start" spacing={1}>
                  <Text color="gray.500" fontSize="sm">建立時間</Text>
                  <Text fontSize="sm">
                    {new Date(user?.createdAt).toLocaleString()}
                  </Text>
                </VStack>
              </GridItem>
              
              <GridItem>
                <VStack align="start" spacing={1}>
                  <Text color="gray.500" fontSize="sm">角色</Text>
                  <HStack spacing={1}>
                    {user?.roles.map((role) => (
                      <Badge 
                        key={role} 
                        colorScheme={
                          role === 'super_admin' 
                            ? 'red' 
                            : role === 'admin' 
                              ? 'purple' 
                              : role === 'editor' 
                                ? 'blue' 
                                : 'gray'
                        }
                        variant="subtle"
                        borderRadius="full"
                        px={2}
                      >
                        {role}
                      </Badge>
                    ))}
                  </HStack>
                </VStack>
              </GridItem>
            </Grid>
            
            {/* 操作按鈕 */}
            <Divider my={6} />
            
            <HStack spacing={4}>
              {!user?.isDeleted ? (
                <>
                  {user?.isActive ? (
                    <Button
                      leftIcon={<FiUserX />}
                      colorScheme="red"
                      variant="outline"
                      size="sm"
                      onClick={() => openStateChangeModal('deactivate')}
                    >
                      停用使用者
                    </Button>
                  ) : (
                    <Button
                      leftIcon={<FiUserCheck />}
                      colorScheme="green"
                      variant="outline"
                      size="sm"
                      onClick={() => openStateChangeModal('activate')}
                    >
                      啟用使用者
                    </Button>
                  )}
                  
<Button
  leftIcon={<FiLock />}
  colorScheme="orange"
  variant="outline"
  size="sm"
  onClick={onResetPasswordOpen}  // 修改此處
  isDisabled={user?.isDeleted || !user?.isActive}
>
  重設密碼
</Button>
                  
                  {!user?.isVerified && (
<Button
  leftIcon={<FiMail />}
  colorScheme="blue"
  variant="outline"
  size="sm"
  onClick={onVerificationEmailOpen}  // 修改此處
  isDisabled={user?.isDeleted || !user?.isActive}
>
  發送驗證郵件
</Button>
                  )}
                  
                  <Button
                    leftIcon={<FiTrash2 />}
                    colorScheme="red"
                    variant="outline"
                    size="sm"
                    onClick={() => openDeleteModal()}
                  >
                    刪除使用者
                  </Button>
                </>
              ) : (
                <Button
                  leftIcon={<FiRotateCcw />}
                  colorScheme="blue"
                  variant="outline"
                  size="sm"
                  onClick={handleRestoreUser}
                >
                  恢復使用者
                </Button>
              )}
            </HStack>
          </Box>
        </Flex>
      </Card>
      
      {/* 使用者編輯表單 */}
      <Card>
        <Heading as="h2" size="md" mb={6}>
          編輯使用者資料
        </Heading>
        
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* 使用者姓名 */}
            <FormControl isInvalid={!!errors.name} isRequired mb={4}>
              <FormLabel htmlFor="name">使用者姓名</FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <FiUser color="gray.300" />
                </InputLeftElement>
                <Input
                  id="name"
                  placeholder="輸入使用者姓名"
                  {...methods.register('name')}
                />
              </InputGroup>
              <FormErrorMessage>
                {errors.name?.message}
              </FormErrorMessage>
            </FormControl>
            
            {/* 使用者電子郵件（唯讀） */}
            <FormControl mb={4}>
              <FormLabel htmlFor="email">電子郵件</FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <FiMail color="gray.300" />
                </InputLeftElement>
                <Input
                  id="email"
                  value={user?.email || ''}
                  isReadOnly
                />
              </InputGroup>
            </FormControl>
            
            {/* 使用者角色 */}
            <FormControl isInvalid={!!errors.roles} isRequired mb={4}>
              <FormLabel>使用者角色</FormLabel>
              <Controller
                name="roles"
                control={control}
                render={({ field }) => (
                  <Stack spacing={3}>
                    {roleOptions.map((role) => (
                      <Checkbox
                        key={role.value}
                        isChecked={field.value.includes(role.value)}
                        onChange={(e) => {
                          let newValue = [...field.value];
                          
                          if (e.target.checked) {
                            // 添加角色（避免重複）
                            if (!newValue.includes(role.value)) {
                              newValue.push(role.value);
                            }
                          } else {
                            // 移除角色，但確保至少保留一個
                            if (newValue.length > 1) {
                              newValue = newValue.filter(r => r !== role.value);
                            } else {
                              toast({
                                title: '無法移除',
                                description: '至少需要選擇一個角色',
                                status: 'warning',
                                duration: 3000,
                                isClosable: true,
                              });
                              return;
                            }
                          }
                          
                          field.onChange(newValue);
                        }}
                        isDisabled={
                          (role.value === 'super_admin' && !canEditSuperAdmin) ||
                          role.disabled
                        }
                        opacity={role.disabled ? 0.6 : 1}
                      >
                        <Flex direction="column">
                          <Flex align="center">
                            <Text fontWeight="medium">{role.label}</Text>
                            {role.disabled && (
                              <Badge ml={2} colorScheme="orange" variant="outline" fontSize="xs">
                                功能開發中
                              </Badge>
                            )}
                          </Flex>
                          <Text fontSize="sm" color={role.disabled ? "gray.500" : "gray.600"}>
                            {role.description}
                          </Text>
                        </Flex>
                      </Checkbox>
                    ))}
                  </Stack>
                )}
              />
              <FormErrorMessage>
                {errors.roles?.message}
              </FormErrorMessage>
            </FormControl>
            
            {/* 驗證狀態 */}
            <FormControl mb={4}>
              <FormLabel htmlFor="isVerified">驗證狀態</FormLabel>
              <HStack>
                <Switch
                  id="isVerified"
                  colorScheme="green"
                  size="lg"
                  {...methods.register('isVerified')}
                />
                <Box>
                  {methods.watch('isVerified') ? '已驗證' : '未驗證'}
                </Box>
              </HStack>
            </FormControl>
            
            {/* 表單按鈕 */}
            <Flex mt={6} justifyContent="space-between">
              <Button
                as={Link}
                to="/users"
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
                loadingText="儲存中..."
              >
                儲存變更
              </Button>
            </Flex>
          </form>
        </FormProvider>
      </Card>
      
      {/* 狀態變更對話框 */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {actionType === 'activate' ? '啟用使用者' : '停用使用者'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {actionType === 'deactivate' && (
              <HStack color="orange.500" mb={4}>
                <FiAlertCircle />
                <Text fontWeight="medium">警告</Text>
              </HStack>
            )}
            <Text mb={2}>
              {actionType === 'activate'
                ? `您即將啟用使用者 "${user?.name}"。`
                : `您即將停用使用者 "${user?.name}"。`}
            </Text>
            <Text fontWeight={actionType === 'deactivate' ? 'medium' : 'normal'}>
              {actionType === 'activate'
                ? '啟用後，該使用者將能夠登入系統。'
                : '停用後，該使用者將無法登入系統。'}
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onClose}>
              取消
            </Button>
            <Button 
              colorScheme={actionType === 'activate' ? 'green' : 'red'} 
              onClick={handleUserStateChange}
              isLoading={submitting}
              loadingText="處理中..."
            >
              {actionType === 'activate' ? '啟用' : '停用'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* 刪除確認對話框 */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>刪除使用者</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <HStack color="red.500" mb={4}>
              <FiAlertCircle />
              <Text fontWeight="medium">警告</Text>
            </HStack>
            <Text mb={2}>
              您即將刪除使用者 "{user?.name}"。
            </Text>
            <Text fontWeight="medium" mb={2}>
              刪除後，該使用者將不會出現在常規列表中，但資料仍會保留在系統中。
            </Text>
            <Text>
              您可以通過查看已刪除使用者來恢復此帳號。
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onDeleteClose}>
              取消
            </Button>
            <Button 
              colorScheme="red" 
              onClick={handleSoftDeleteUser}
              isLoading={submitting}
              loadingText="處理中..."
            >
              確認刪除
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 重設密碼對話框 */}
<Modal isOpen={isResetPasswordOpen} onClose={onResetPasswordClose}>
  <ModalOverlay />
  <ModalContent>
    <ModalHeader>發送重設密碼郵件</ModalHeader>
    <ModalCloseButton />
    <ModalBody>
      <Text mb={4}>
        您即將發送重設密碼郵件給使用者 "{user?.name}" ({user?.email})。
      </Text>
      <Text>
        使用者將收到一封包含重設密碼連結的電子郵件，該連結有效期為 24 小時。
      </Text>
    </ModalBody>
    <ModalFooter>
      <Button variant="outline" mr={3} onClick={onResetPasswordClose}>
        取消
      </Button>
      <Button 
        colorScheme="blue" 
        onClick={() => {
          handleSendResetPasswordEmail();
          onResetPasswordClose();
        }}
        isLoading={submitting}
        loadingText="發送中..."
      >
        發送郵件
      </Button>
    </ModalFooter>
  </ModalContent>
</Modal>

{/* 驗證郵件對話框 */}
<Modal isOpen={isVerificationEmailOpen} onClose={onVerificationEmailClose}>
  <ModalOverlay />
  <ModalContent>
    <ModalHeader>發送驗證郵件</ModalHeader>
    <ModalCloseButton />
    <ModalBody>
      <Text mb={4}>
        您即將發送驗證郵件給使用者 "{user?.name}" ({user?.email})。
      </Text>
      <Text>
        使用者將收到一封包含驗證帳號連結的電子郵件，該連結有效期為 24 小時。
      </Text>
    </ModalBody>
    <ModalFooter>
      <Button variant="outline" mr={3} onClick={onVerificationEmailClose}>
        取消
      </Button>
      <Button 
        colorScheme="blue" 
        onClick={() => {
          handleSendVerificationEmail();
          onVerificationEmailClose();
        }}
        isLoading={submitting}
        loadingText="發送中..."
      >
        發送郵件
      </Button>
    </ModalFooter>
  </ModalContent>
</Modal>
    </Box>
  );
};

export default UserDetailPage;