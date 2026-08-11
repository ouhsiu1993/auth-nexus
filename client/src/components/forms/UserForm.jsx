import { useState, useEffect, useRef } from 'react';
import { Controller ,useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  Switch,
  HStack,
  Stack,
  Checkbox,
  Text,
  InputGroup,
  InputLeftElement,
  Select,
  useToast,
  Badge,
  Tooltip,
  useDisclosure ,
  InputRightElement
} from '@chakra-ui/react';
import { FiSave, FiUser, FiMail, FiLock,FiEye, FiEyeOff } from 'react-icons/fi';

/**
 * 表單驗證 Schema
 */
const userSchema = yup.object().shape({
  name: yup
    .string()
    .required('使用者姓名為必填')
    .min(2, '使用者姓名至少需要 2 個字元')
    .max(50, '使用者姓名不可超過 50 個字元'),
  email: yup
    .string()
    .email('請輸入有效的電子郵件')
    .required('電子郵件為必填'),
  password: yup
    .string()
    .when('isEditMode', {
      is: false,
      then: schema => schema.required('密碼為必填')
        .min(8, '密碼至少需要 8 個字元')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/, '密碼需包含大小寫字母、數字及特殊符號'),
      otherwise: schema => schema
    }),
  confirmPassword: yup
    .string()
    .when('password', {
      is: val => val && val.length > 0,
      then: schema => schema.required('請確認密碼')
        .oneOf([yup.ref('password')], '密碼不一致'),
    }),
  roles: yup.array().of(yup.string()).min(1, '至少需要選擇一個角色'),
  tenantId: yup.string().required('請選擇所屬工作區'),
  isActive: yup.boolean().default(true),
  isVerified: yup.boolean().default(false),
  isEditMode: yup.boolean(),
  sendVerificationEmail: yup.boolean().default(true),
});


// 角色選項
const roleOptions = [
  { value: 'super_admin', label: '超級管理員', description: '完整系統存取權限' },
  { value: 'admin', label: '管理員', description: '工作區內的管理權限', comingSoon: true },
  { value: 'editor', label: '編輯者', description: '可新增與編輯內容', comingSoon: true },
  { value: 'user', label: '一般使用者', description: '基本存取權限' },
  { value: 'viewer', label: '檢視者', description: '唯讀存取權限', comingSoon: true },
];


/**
 * 使用者表單組件
 */
const UserForm = ({ 
  defaultValues = {}, 
  tenants = [],
  onSubmit, 
  isSubmitting = false,
  submitButtonText = '保存',
  isEditMode = false,
  readOnlyFields = []
}) => {
  const toast = useToast();
  const [showVerificationConfirm, setShowVerificationConfirm] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 設置預設值
  const methods = useForm({
    resolver: yupResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      roles: ['user'],
      tenantId: '',
      isActive: true,
      isVerified: false,
      isEditMode,
      sendVerificationEmail: true,
      ...defaultValues
    }
  });

  const { formState: { errors }, getValues, setValue, watch } = methods;

  // 確認是否要發送驗證郵件的彈窗
  const SendVerificationEmailModal = () => (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>發送驗證郵件</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text>
            要發送驗證郵件給使用者嗎？使用者需要點擊驗證郵件中的連結才能完成驗證。
          </Text>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" mr={3} onClick={() => {
            setValue('sendVerificationEmail', false);
            onClose();
            methods.handleSubmit(handleFormSubmit)();
          }}>
            否
          </Button>
          <Button 
            colorScheme="brand" 
            onClick={() => {
              setValue('sendVerificationEmail', true);
              onClose();
              methods.handleSubmit(handleFormSubmit)();
            }}
          >
            是
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );

    // 表單提交處理
  const handleFormSubmit = (data) => {
    // 處理表單數據
    const formData = { ...data };
    
    // 刪除一些不需要提交的欄位
    delete formData.isEditMode;
    delete formData.sendVerificationEmail;
    
    // 如果是編輯模式，不需要提交密碼相關欄位
    if (isEditMode) {
      delete formData.password;
      delete formData.confirmPassword;
    }
    
    // 調用提交回調
    onSubmit(formData, data.sendVerificationEmail);
  };

  // 處理表單提交
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 如果不是編輯模式，而且驗證狀態是未驗證，打開確認對話框
    if (!isEditMode && !getValues('isVerified')) {
      onOpen();
    } else {
      // 否則直接提交
      methods.handleSubmit(handleFormSubmit)();
    }
  };

  // 🔍 監聽 roles 改變
  useEffect(() => {
    console.log('🔍 現在 roles 的值:', methods.getValues('roles'));
    const subscription = methods.watch((value, { name }) => {
      if (name === 'roles') {
        console.log('🟡 監聽到 roles 改變:', value.roles);
      }
    });
    return () => subscription.unsubscribe();
  }, [methods]);

  // 取得所選角色
  const selectedRoles = methods.watch('roles', ['user']);

  return (
    <FormProvider {...methods}>       
      <form onSubmit={handleSubmit} noValidate autoComplete="off">
        <Stack spacing={4}>
          {/* 使用者姓名 */}
          <FormControl isInvalid={!!errors.name} isRequired>
            <FormLabel htmlFor="name">使用者姓名</FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <FiUser color="gray.300" />
              </InputLeftElement>
              <Input
                id="name"
                placeholder="輸入使用者姓名"
                {...methods.register('name')}
                isReadOnly={readOnlyFields.includes('name')}
              />
            </InputGroup>
            <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
          </FormControl>

          {/* 使用者電子郵件 */}
          <FormControl isInvalid={!!errors.email} isRequired>
            <FormLabel htmlFor="email">電子郵件</FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <FiMail color="gray.300" />
              </InputLeftElement>
              <Input
                id="email"
                placeholder="輸入電子郵件"
                {...methods.register('email')}
                isReadOnly={readOnlyFields.includes('email')}
              />
            </InputGroup>
            <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
          </FormControl>

          {/* 密碼 (僅在新增模式下顯示) */}
          {!isEditMode && (
            <>
<FormControl isInvalid={!!errors.password} isRequired>
  <FormLabel htmlFor="password">密碼</FormLabel>
  <InputGroup>
    <InputLeftElement pointerEvents="none">
      <FiLock color="gray.300" />
    </InputLeftElement>
    <Input
      id="password"
      type={showPassword ? "text" : "password"}
      placeholder="輸入密碼"
      {...methods.register('password')}
      autoComplete="new-password"
    />
    <InputRightElement width="3rem">
<Button
  h="1.5rem"
  size="sm"
  onClick={() => setShowPassword(!showPassword)}
  variant="ghost"
>
  {showPassword ? <FiEyeOff /> : <FiEye />}
</Button>
    </InputRightElement>
  </InputGroup>
  <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
</FormControl>

<FormControl isInvalid={!!errors.confirmPassword} isRequired>
  <FormLabel htmlFor="confirmPassword">確認密碼</FormLabel>
  <InputGroup>
    <InputLeftElement pointerEvents="none">
      <FiLock color="gray.300" />
    </InputLeftElement>
    <Input
      id="confirmPassword"
      type={showConfirmPassword ? "text" : "password"}
      placeholder="再次輸入密碼"
      {...methods.register('confirmPassword')}
      autoComplete="new-password"
    />
    <InputRightElement width="3rem">
<Button
  h="1.5rem"
  size="sm"
  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
  variant="ghost"
>
  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
</Button>
    </InputRightElement>
  </InputGroup>
  <FormErrorMessage>{errors.confirmPassword?.message}</FormErrorMessage>
</FormControl>
            </>
          )}

          {/* 工作區選擇 */}
          <FormControl isInvalid={!!errors.tenantId} isRequired>
            <FormLabel htmlFor="tenantId">所屬工作區</FormLabel>
            <Select
              id="tenantId"
              placeholder="選擇工作區"
              {...methods.register('tenantId')}
              isDisabled={readOnlyFields.includes('tenantId')}
            >
              {tenants.map(tenant => (
                <option key={tenant._id} value={tenant._id}>
                  {tenant.name}
                </option>
              ))}
            </Select>
            <FormErrorMessage>{errors.tenantId?.message}</FormErrorMessage>
          </FormControl>

          {/* 使用者角色 */}
          <FormControl isInvalid={!!errors.roles} isRequired>
            <FormLabel>使用者角色</FormLabel>
            <Controller
              name="roles"
              control={methods.control}
              render={({ field }) => (
                <Stack spacing={3}>
                  {roleOptions.map((role) => (
                    <Box key={role.value}>
                      {role.comingSoon ? (
                        <Tooltip label="功能開發中" placement="right" hasArrow>
                          <Flex opacity={0.6}>
                            <Checkbox
                              isChecked={false}
                              isDisabled={true}
                            >
                              <Flex direction="column">
                                <Flex align="center">
                                  <Text fontWeight="medium">{role.label}</Text>
                                  <Badge ml={2} colorScheme="orange" fontSize="2xs">
                                    即將上線
                                  </Badge>
                                </Flex>
                                <Text fontSize="sm" color="gray.500">
                                  {role.description}
                                </Text>
                              </Flex>
                            </Checkbox>
                          </Flex>
                        </Tooltip>
                      ) : (
                        <Checkbox
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
                          isDisabled={readOnlyFields.includes('roles')}
                        >
                          <Flex direction="column">
                            <Text fontWeight="medium">
                              {role.label}
                            </Text>
                            <Text fontSize="sm" color="gray.600">
                              {role.description}
                            </Text>
                          </Flex>
                        </Checkbox>
                      )}
                    </Box>
                  ))}
                </Stack>
              )}
              rules={{ required: "至少需要選擇一個角色" }}
            />
            <FormErrorMessage>{errors.roles?.message}</FormErrorMessage>
          </FormControl>

          {/* 驗證狀態 */}
          <FormControl>
            <FormLabel htmlFor="isVerified">驗證狀態</FormLabel>
            <HStack>
              <Switch
                id="isVerified"
                colorScheme="green"
                size="lg"
                {...methods.register('isVerified')}
                isDisabled={!isEditMode} // 新創建時不能修改
              />
              <Box>
                {methods.watch('isVerified') ? '已驗證' : '未驗證'}
              </Box>
            </HStack>
            {!isEditMode && (
              <Text fontSize="sm" color="gray.500" mt={1}>
                新使用者預設為「未驗證」狀態，創建後可發送驗證郵件
              </Text>
            )}
          </FormControl>

          {/* 啟用狀態 */}
          <FormControl>
            <FormLabel htmlFor="isActive">啟用狀態</FormLabel>
            <HStack>
              <Switch
                id="isActive"
                colorScheme="green"
                size="lg"
                {...methods.register('isActive')}
                isDisabled={readOnlyFields.includes('isActive')}
              />
              <Box>
                {methods.watch('isActive') ? '已啟用' : '已停用'}
              </Box>
            </HStack>
          </FormControl>

          {/* 提交按鈕 */}
          <Button
            type="submit"
            colorScheme="brand"
            leftIcon={<FiSave />}
            isLoading={isSubmitting}
            loadingText="處理中..."
            mt={4}
          >
            {submitButtonText}
          </Button>
        </Stack>
      </form>
      
      {/* 驗證郵件確認對話框 */}
      <SendVerificationEmailModal />
    </FormProvider>
  );
};

export default UserForm;