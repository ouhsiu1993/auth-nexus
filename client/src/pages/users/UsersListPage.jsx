// src/pages/users/UsersListPage.jsx - 修復使用者停用功能
import { useState, useEffect } from 'react';
import { 
  Box, 
  Heading, 
  Button, 
  Flex, 
  useToast, 
  Badge, 
  IconButton, 
  HStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Text,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  VStack,
  Tooltip,
} from '@chakra-ui/react';
import { 
  FiPlus, 
  FiEdit, 
  FiMoreVertical, 
  FiLock, 
  FiSearch,
  FiUserX,
  FiUserCheck,
  FiAlertCircle,
  FiTrash2,
  FiRefreshCw,
  FiMail
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useUI } from '../../contexts/UIContext';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import AlertMessage from '../../components/ui/AlertMessage';
import userService from '../../services/userService';
import tenantService from '../../services/tenantService';
import authService from '../../services/authService';

const UsersListPage = () => {
  const { updatePageTitle } = useUI();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  // 改為單一狀態過濾
  const [statusFilter, setStatusFilter] = useState('active');
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [confirmAction, setConfirmAction] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserEmail, setSelectedUserEmail] = useState('');
  const { 
    isOpen: isConfirmOpen, 
    onOpen: onConfirmOpen, 
    onClose: onConfirmClose 
  } = useDisclosure();

  const openConfirmDialog = (actionType, user) => {
    setConfirmAction(actionType);
    setSelectedUserId(user._id);
    setSelectedUserEmail(user.email);
    onConfirmOpen();
  };

  const handleConfirmedAction = async () => {
    try {
      setLoading(true);
      
      if (confirmAction === 'reset-password') {
        await authService.sendResetPasswordEmail(selectedUserId);
        toast({
          title: '重設密碼郵件已發送',
          description: `重設密碼郵件已成功發送至 ${selectedUserEmail}`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else if (confirmAction === 'verify-email') {
        await authService.sendVerificationEmail(selectedUserId);
        toast({
          title: '驗證郵件已發送',
          description: `驗證郵件已成功發送至 ${selectedUserEmail}`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      }
      
      onConfirmClose();
    } catch (error) {
      console.error('操作失敗', error);
      toast({
        title: '操作失敗',
        description: error.response?.data?.message || '無法完成操作，請稍後再試',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // 狀態變更對話框
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedUser, setSelectedUser] = useState(null);
  const [updatingUser, setUpdatingUser] = useState(false);
  const [actionType, setActionType] = useState('');
  
  // 刪除對話框
  const { 
    isOpen: isDeleteOpen, 
    onOpen: onDeleteOpen, 
    onClose: onDeleteClose 
  } = useDisclosure();
  

  // 獲取工作區資料
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const data = await tenantService.getAllTenants(1, 100);
        console.log('工作區選項資料:', data);
        setTenants(data.tenants);
      } catch (error) {
        console.error('獲取工作區列表失敗', error);
      }
    };
    
    fetchTenants();
  }, []);
  
  // 更新頁面標題
  useEffect(() => {
    updatePageTitle('使用者管理');
  }, [updatePageTitle]);
  
  // 獲取使用者資料
  const fetchUsers = async (page = 1, limit = 10, tenantId = null) => {
    try {
      setLoading(true);
      setError(null);
      
      // 構建查詢參數
      // 如果狀態過濾為 deleted 或 all，則從後端獲取已刪除使用者
      const includeDeleted = statusFilter === 'deleted' || statusFilter === 'all';
      
      const data = await userService.getAllUsers(page, limit, tenantId, includeDeleted);
      
      // 根據選擇的過濾條件過濾使用者
      let filteredUsers = [...data.users]; // 複製一份以避免修改原始資料
      
      // 如果有選擇過濾條件且不是"全部"，則進行過濾
      if (statusFilter !== 'all') {
        filteredUsers = filteredUsers.filter(user => {
          switch (statusFilter) {
            case 'active':
              return user.isActive && !user.isDeleted;
            case 'inactive':
              return !user.isActive && !user.isDeleted;
            case 'deleted':
              return user.isDeleted;
            default:
              return true;
          }
        });
      }
      
      setUsers(filteredUsers);
      setPagination({
        page: data.pagination.page,
        limit: data.pagination.limit,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages,
      });

    } catch (error) {
      console.error('獲取使用者列表失敗', error);
      setError('無法載入使用者資料，請重新整理頁面或聯絡系統管理員');
    } finally {
      setLoading(false);
    }
  };
  
  // 刷新使用者資料
  const refreshUserData = () => {
    fetchUsers(pagination.page, pagination.limit, selectedTenantId || null);

    toast({
      title: '資料已更新',
      description: '已成功獲取最新使用者資料',
      status: 'success',
      duration: 2000,
      isClosable: true,
      position: 'top-right',
    });
  };
  
  // 初始化時獲取資料
  useEffect(() => {
    fetchUsers(pagination.page, pagination.limit, selectedTenantId || null);
  }, [selectedTenantId]);
  
  // 當 statusFilter 變更時重新獲取資料
  useEffect(() => {
    fetchUsers(pagination.page, pagination.limit, selectedTenantId || null);
  }, [statusFilter]);
  
  // 處理頁碼變更
  const handlePageChange = (newPage) => {
    fetchUsers(newPage, pagination.limit, selectedTenantId || null);
  };
  
  // 處理每頁筆數變更
  const handleLimitChange = (newLimit) => {
    fetchUsers(1, newLimit, selectedTenantId || null);
  };
  
  // 處理工作區變更
  const handleTenantChange = (event) => {
    setSelectedTenantId(event.target.value);
  };
  
  // 處理狀態過濾變更
  const handleStatusFilterChange = (e) => {
    console.log('狀態過濾變更為:', e.target.value);
    setStatusFilter(e.target.value);
  };
  
  // 處理使用者狀態變更
  const handleUserStateChange = async () => {
    if (!selectedUser) return;
    
    try {
      setUpdatingUser(true);
      
      let updateData = {};
      
      // 根據操作類型設定更新數據
      if (actionType === 'activate') {
        updateData = { isActive: true };
      } else if (actionType === 'deactivate') {
        updateData = { isActive: false };
      }
      
      // 更新使用者
      const updatedUser = await userService.updateUser(selectedUser._id, updateData);
      console.log('更新後的使用者資料:', updatedUser);
      
      // 更新本地狀態
      const updatedUsers = users.map((user) => 
        user._id === updatedUser._id ? updatedUser : user
      );
      
      setUsers(updatedUsers);
      onClose();
      
      toast({
        title: actionType === 'activate' ? '使用者已啟用' : '使用者已停用',
        description: `使用者 "${updatedUser.name}" 的狀態已更新`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // 重新獲取使用者列表以確保狀態一致
      fetchUsers(pagination.page, pagination.limit, selectedTenantId);
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
      setUpdatingUser(false);
    }
  };

  const handleSendResetPasswordEmail = async (userId) => {
    try {
      setLoading(true);
      // 發送重設密碼郵件
      await authService.sendResetPasswordEmail(userId);
      
      toast({
        title: '重設密碼郵件已發送',
        description: '重設密碼郵件已成功發送給用戶',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('發送重設密碼郵件失敗', error);
      
      toast({
        title: '發送失敗',
        description: error.response?.data?.message || '無法發送重設密碼郵件，請稍後再試',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // 處理軟刪除使用者
  const handleSoftDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      setUpdatingUser(true);
      
      // 軟刪除使用者
      await userService.softDeleteUser(selectedUser._id);
      
      toast({
        title: '使用者已刪除',
        description: `使用者 "${selectedUser.name}" 已成功刪除`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // 關閉對話框
      onDeleteClose();
      
      // 強制設置 loading 狀態以提供視覺反饋
      setLoading(true);
      
      // 添加短暫延遲確保 API 更新已完成
      setTimeout(() => {
        // 重新加載數據
        fetchUsers(pagination.page, pagination.limit, selectedTenantId);
      }, 300);
      
    } catch (error) {
      console.error('刪除使用者失敗', error);
      
      toast({
        title: '刪除失敗',
        description: error.response?.data?.message || '無法刪除使用者，請稍後再試',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUpdatingUser(false);
    }
  };
  
  // 恢復用戶對話框
  const { 
    isOpen: isRestoreOpen, 
    onOpen: onRestoreOpen, 
    onClose: onRestoreClose 
  } = useDisclosure();
  
  // 處理恢復已刪除的使用者
  const handleRestoreUser = async () => {
    if (!selectedUser) return;
    
    try {
      setUpdatingUser(true);
      
      // 恢復使用者
      await userService.restoreUser(selectedUser._id);
      
      toast({
        title: '使用者已恢復',
        description: `使用者 "${selectedUser.name}" 已成功恢復`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // 關閉對話框
      onRestoreClose();
      
      // 重新加載數據，設置加載狀態提供視覺反饋
      setLoading(true);
      setTimeout(() => {
        fetchUsers(pagination.page, pagination.limit, selectedTenantId);
      }, 300);
      
    } catch (error) {
      console.error('恢復使用者失敗', error);
      
      toast({
        title: '恢復失敗',
        description: error.response?.data?.message || '無法恢復使用者，請稍後再試',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUpdatingUser(false);
    }
  };
  
  // 開啟恢復對話框
  const openRestoreModal = (user) => {
    setSelectedUser(user);
    onRestoreOpen();
  };
  
  // 開啟狀態變更對話框
  const openStateChangeModal = (user, type) => {
    setSelectedUser(user);
    setActionType(type);
    onOpen();
  };
  
  // 開啟刪除對話框
  const openDeleteModal = (user) => {
    setSelectedUser(user);
    onDeleteOpen();
  };
  
  // 搜尋結果過濾
  const filteredUsers = searchQuery
    ? users.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user._id.includes(searchQuery)
      )
    : users;

  // 表格欄位定義
  const columns = [
    {
      header: '姓名',
      key: 'name',
      width: '160px', 
      minWidth: '160px', // 確保最小寬度一致
      render: (user) => (
        <Text 
          textDecoration={user.isDeleted ? 'line-through' : 'none'}
          color={user.isDeleted ? 'gray.500' : 'inherit'}
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
        >
          {user.name}
        </Text>
      ),
    },
    {
      header: 'Email',
      key: 'email',
      width: '220px', 
      minWidth: '220px', // Email通常較長，確保寬度足夠
      render: (user) => (
        <Text 
          color={user.isDeleted ? 'gray.500' : 'inherit'}
          fontStyle={user.isDeleted ? 'italic' : 'normal'}
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
        >
          {user.email}
        </Text>
      ),
    },
    {
      header: '工作區',
      key: 'tenantId',
      width: '150px',
      minWidth: '150px',
      render: (user) => {
        // 改進尋找工作區的邏輯
        const getTenantName = () => {
          // 嘗試從 tenants 陣列中找到匹配的工作區
          const tenantId = typeof user.tenantId === 'object' ? user.tenantId._id : user.tenantId;
          
          // 如果已經有工作區名稱，直接返回
          if (typeof user.tenantId === 'object' && user.tenantId.name) {
            return user.tenantId.name;
          }
          
          // 從 tenants 列表中查找
          const tenant = tenants.find(t => t._id === tenantId);
          if (tenant) {
            return tenant.name;
          }
          
          // 如果沒有找到，返回 ID 或提示訊息
          return typeof tenantId === 'string' ? 
            `ID: ${tenantId.substring(0, 8)}...` : 
            '[無效工作區]';
        };
        
        return (
          <Text 
            overflow="hidden"
            textOverflow="ellipsis"
            whiteSpace="nowrap"
            title={getTenantName()} // 添加 title 屬性，方便懸停查看完整資訊
          >
            {getTenantName()}
          </Text>
        );
      },
    },
    {
      header: '角色',
      key: 'roles',
      width: '180px',
      minWidth: '180px', // 角色欄位容易導致表格跳動，確保足夠寬度
      render: (user) => (
        <Box maxW="180px" overflow="hidden">
          <HStack spacing={1} flexWrap="wrap">
            {user.roles.map((role) => (
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
                mb={1}
              >
                {role}
              </Badge>
            ))}
          </HStack>
        </Box>
      ),
    },
    {
      header: '狀態',
      key: 'isActive',
      width: '90px',
      minWidth: '90px', 
      align: 'center',
      render: (user) => (
        user.isDeleted ? (
          <Badge
            colorScheme="gray"
            variant="solid"
            borderRadius="full"
            px={2}
          >
            已刪除
          </Badge>
        ) : (
          <Badge
            colorScheme={user.isActive ? 'green' : 'red'}
            variant="solid"
            borderRadius="full"
            px={2}
          >
            {user.isActive ? '啟用' : '停用'}
          </Badge>
        )
      ),
    },
    {
      header: '驗證',
      key: 'isVerified',
      width: '90px',
      minWidth: '90px',
      align: 'center',
      render: (user) => (
        <Badge
          colorScheme={user.isVerified ? 'green' : 'orange'}
          variant="outline"
          borderRadius="full"
          px={2}
        >
          {user.isVerified ? '已驗證' : '未驗證'}
        </Badge>
      ),
    },
    {
      header: '操作',
      align: 'center',
      width: '80px',
      minWidth: '80px',
      render: (user) => (
        <Menu>
          <MenuButton
            as={IconButton}
            icon={<FiMoreVertical />}
            variant="ghost"
            size="sm"
          />
          <MenuList>
            <MenuItem
              as={Link}
              to={`/users/${user._id}`}
              icon={<FiEdit />}
            >
              查看詳情
            </MenuItem>
            
            <MenuItem
              icon={<FiLock />}
              onClick={() => openConfirmDialog('reset-password', user)}
              isDisabled={user.isDeleted || !user.isActive}
            >
              重設密碼
            </MenuItem>
            
            {!user.isVerified && !user.isDeleted && user.isActive && (
              <MenuItem
                icon={<FiMail />}
                onClick={() => openConfirmDialog('verify-email', user)}
                color="blue.500"
              >
                發送驗證郵件
              </MenuItem>
            )}
            
            {!user.isDeleted ? (
              <>
                {user.isActive ? (
                  <MenuItem
                    icon={<FiUserX />}
                    onClick={() => openStateChangeModal(user, 'deactivate')}
                    color="orange.500"
                  >
                    停用使用者
                  </MenuItem>
                ) : (
                  <MenuItem
                    icon={<FiUserCheck />}
                    onClick={() => openStateChangeModal(user, 'activate')}
                    color="green.500"
                  >
                    啟用使用者
                  </MenuItem>
                )}
                
                <MenuItem
                  icon={<FiTrash2 />}
                  onClick={() => openDeleteModal(user)}
                  color="red.500"
                >
                  刪除使用者
                </MenuItem>
              </>
            ) : (
              <MenuItem
                icon={<FiRefreshCw />}
                onClick={() => openRestoreModal(user)}
                color="blue.500"
              >
                恢復使用者
              </MenuItem>
            )}
          </MenuList>
        </Menu>
      ),
    },
  ];
  
  return (
    <Box>
      <Box 
        h={{ base: "16px", md: "24px" }} 
        mb={{ base: 4, md: 6 }}
      ></Box>
      
      {/* 頁面標題與操作 */}
      <Flex 
        justifyContent="space-between" 
        alignItems="center" 
        mb={6}
        direction={{ base: 'column', md: 'row' }}
        gap={{ base: 4, md: 0 }}
      >
        <Heading as="h1" size="xl">
          使用者管理
        </Heading>
        
        <Button
          as={Link}
          to="/users/new"
          leftIcon={<FiPlus />}
          colorScheme="brand"
        >
          新增使用者
        </Button>
      </Flex>
      
      {/* 錯誤提示 */}
      {error && (
        <AlertMessage 
          status="error" 
          title="載入失敗" 
          message={error} 
        />
      )}
      
      {/* 搜尋和過濾 - 使用與TenantsListPage一致的佈局 */}
      <Card mb={6}>
        {/* 桌面版布局 - 水平排列 */}
        <Flex 
          direction="row"
          gap={4}
          display={{ base: 'none', md: 'flex' }}
        >
          {/* 左側搜尋區塊 */}
          <Box flex={1}>
            <Text fontSize="sm" fontWeight="medium" mb={2}>
              搜尋使用者
            </Text>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <FiSearch color="gray.300" />
              </InputLeftElement>
              <Input
                placeholder="搜尋使用者姓名、Email 或 ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </InputGroup>
          </Box>
          
          {/* 中間工作區選擇 */}
          <Box width="220px">
            <Text fontSize="sm" fontWeight="medium" mb={2}>
              工作區
            </Text>
            <Select
              value={selectedTenantId}
              onChange={handleTenantChange}
              placeholder="全部工作區"
            >
              {tenants.map((tenant) => (
                <option key={tenant._id} value={tenant._id}>
                  {tenant.name}
                </option>
              ))}
            </Select>
          </Box>
          
          {/* 右側狀態選擇器 */}
          <Box width="140px">
            <Text fontSize="sm" fontWeight="medium" mb={2}>
              使用者狀態
            </Text>
            <Select 
              value={statusFilter} 
              onChange={handleStatusFilterChange}
            >
              <option value="active">已啟用</option>
              <option value="inactive">已停用</option>
              <option value="deleted">已刪除</option>
              <option value="all">全部</option>
            </Select>
          </Box>
          
          {/* 刷新按鈕 */}
          <Box width="60px">
            <Text fontSize="sm" fontWeight="medium" mb={2}>
              刷新資料
            </Text>
            <Button
              colorScheme="blue"
              variant="outline"
              size="md"
              isLoading={loading}
              onClick={refreshUserData}
              width="full"
              display="flex"
              justifyContent="center"
              alignItems="center"
            >
              <FiRefreshCw />
            </Button>
          </Box>
        </Flex>
        
        {/* 移動版布局 - 垂直排列 */}
        <VStack 
          spacing={4} 
          align="stretch" 
          display={{ base: 'flex', md: 'none' }}
        >
          {/* 搜尋區塊 */}
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={2}>
              搜尋使用者
            </Text>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <FiSearch color="gray.300" />
              </InputLeftElement>
              <Input
                placeholder="搜尋使用者姓名、Email 或 ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </InputGroup>
          </Box>
          
          {/* 工作區選擇 */}
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={2}>
              工作區
            </Text>
            <Select
              value={selectedTenantId}
              onChange={handleTenantChange}
              placeholder="全部工作區"
            >
              {tenants.map((tenant) => (
                <option key={tenant._id} value={tenant._id}>
                  {tenant.name}
                </option>
              ))}
            </Select>
          </Box>
          
          {/* 狀態選擇器 */}
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={2}>
              使用者狀態
            </Text>
            <Select 
              value={statusFilter} 
              onChange={handleStatusFilterChange}
            >
              <option value="active">已啟用</option>
              <option value="inactive">已停用</option>
              <option value="deleted">已刪除</option>
              <option value="all">全部</option>
            </Select>
          </Box>
          
          {/* 刷新按鈕（移動版） */}
          <Box>
            <Button
              leftIcon={<FiRefreshCw />}
              colorScheme="blue"
              variant="outline"
              size="md"
              isLoading={loading}
              onClick={refreshUserData}
              width="full"
            >
              刷新資料
            </Button>
          </Box>
        </VStack>
      </Card>
      
      {/* 使用者列表 */}
      <DataTable
        columns={columns}
        data={filteredUsers}
        isLoading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        emptyMessage="目前沒有任何使用者"
      />
      
      {/* 確認操作對話框 */}
      <Modal isOpen={isConfirmOpen} onClose={onConfirmClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {confirmAction === 'reset-password' ? '發送重設密碼郵件' : '發送驗證郵件'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              {confirmAction === 'reset-password' 
                ? `確定要發送重設密碼郵件至 ${selectedUserEmail} 嗎？` 
                : `確定要發送驗證郵件至 ${selectedUserEmail} 嗎？`}
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onConfirmClose}>
              取消
            </Button>
            <Button 
              colorScheme={confirmAction === 'reset-password' ? 'orange' : 'blue'}
              onClick={handleConfirmedAction}
              isLoading={loading}
            >
              確認發送
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* 狀態變更對話框 */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {actionType === 'activate' ? '啟用使用者' : '停用使用者'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <HStack color={actionType === 'deactivate' ? "orange.500" : "green.500"} mb={4}>
              <FiAlertCircle />
              <Text fontWeight="medium">
                {actionType === 'activate' ? '確認啟用' : '警告'}
              </Text>
            </HStack>
            <Text mb={2}>
              {actionType === 'activate'
                ? `您即將啟用使用者 "${selectedUser?.name}"。`
                : `您即將停用使用者 "${selectedUser?.name}"。`}
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
              colorScheme={actionType === 'activate' ? 'green' : 'orange'} 
              onClick={handleUserStateChange}
              isLoading={updatingUser}
              loadingText="處理中..."
            >
              {actionType === 'activate' ? '確認啟用' : '確認停用'}
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
              您即將刪除使用者 "{selectedUser?.name}"。
            </Text>
            <Text fontWeight="medium" mb={2}>
              刪除後，該使用者將不會出現在常規列表中，但資料仍會保留在系統中。
            </Text>
            <Text>
              您可以通過選擇顯示已刪除使用者來查看並恢復。
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onDeleteClose}>
              取消
            </Button>
            <Button 
              colorScheme="red" 
              onClick={handleSoftDeleteUser}
              isLoading={updatingUser}
              loadingText="處理中..."
            >
              確認刪除
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* 恢復確認對話框 */}
      <Modal isOpen={isRestoreOpen} onClose={onRestoreClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>恢復使用者</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <HStack color="blue.500" mb={4}>
              <FiRefreshCw />
              <Text fontWeight="medium">確認恢復</Text>
            </HStack>
            <Text mb={2}>
              您即將恢復使用者 "{selectedUser?.name}"。
            </Text>
            <Text>
              恢復後，該使用者將重新出現在使用者列表中，並可被重新啟用。
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onRestoreClose}>
              取消
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleRestoreUser}
              isLoading={updatingUser}
              loadingText="處理中..."
            >
              確認恢復
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default UsersListPage;