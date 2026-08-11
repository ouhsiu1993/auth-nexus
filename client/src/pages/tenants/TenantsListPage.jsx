// src/pages/tenants/TenantsListPage.jsx - 修正RWD布局
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
  useClipboard,
  Tooltip,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Text,
  useDisclosure,
  Select,
  VStack,
} from '@chakra-ui/react';
import { 
  FiPlus, 
  FiRefreshCw, 
  FiEdit, 
  FiCopy, 
  FiSearch,
  FiAlertCircle,
  FiTrash2,
  FiRotateCcw,
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useUI } from '../../contexts/UIContext';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import AlertMessage from '../../components/ui/AlertMessage';
import tenantService from '../../services/tenantService';

const TenantsListPage = () => {
  const { updatePageTitle } = useUI();
  const toast = useToast();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  // 改用單一狀態值作為過濾條件，預設為 'active'
  const [statusFilter, setStatusFilter] = useState('active');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  
  // API Key 複製功能
  const { hasCopied, onCopy } = useClipboard('');
  
  // 重新產生 API Key 對話框
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [refreshingApiKey, setRefreshingApiKey] = useState(false);

  // 刪除對話框
  const { 
    isOpen: isDeleteOpen, 
    onOpen: onDeleteOpen, 
    onClose: onDeleteClose 
  } = useDisclosure();
  
  // 更新頁面標題
  useEffect(() => {
    updatePageTitle('工作區管理');
  }, [updatePageTitle]);
  
  // 獲取工作區資料
  const fetchTenants = async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      setError(null);
      
      // 根據狀態過濾決定是否顯示已刪除項目
      const includeDeleted = statusFilter === 'deleted' || statusFilter === 'all';
      
      const data = await tenantService.getAllTenants(page, limit, includeDeleted);
      console.log('工作區資料:', data);
      
      let filteredTenants = [...data.tenants]; // 複製一份以避免修改原始資料
      
      // 根據選擇的過濾條件進行篩選
      if (statusFilter !== 'all') {
        filteredTenants = filteredTenants.filter(tenant => {
          switch (statusFilter) {
            case 'active':
              return tenant.isActive && !tenant.isDeleted;
            case 'inactive':
              return !tenant.isActive && !tenant.isDeleted;
            case 'deleted':
              return tenant.isDeleted;
            default:
              return true;
          }
        });
      }
      
      console.log('篩選後工作區資料:', filteredTenants);
      
      setTenants(filteredTenants);
      setPagination({
        page: data.pagination.page,
        limit: data.pagination.limit,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages,
      });
    } catch (error) {
      console.error('獲取工作區列表失敗', error);
      setError('無法載入工作區資料，請重新整理頁面或聯絡系統管理員');
    } finally {
      setLoading(false);
    }
  };
  
  // 初始化時獲取資料
  useEffect(() => {
    fetchTenants(pagination.page, pagination.limit);
  }, []);
  
  // 當 statusFilter 變更時重新獲取資料
  useEffect(() => {
    fetchTenants(pagination.page, pagination.limit);
  }, [statusFilter]);
  
  // 處理狀態篩選變更
  const handleStatusFilterChange = (e) => {
    console.log('狀態篩選變更為:', e.target.value);
    setStatusFilter(e.target.value);
  };
  
  // 處理頁碼變更
  const handlePageChange = (newPage) => {
    fetchTenants(newPage, pagination.limit);
  };
  
  // 處理每頁筆數變更
  const handleLimitChange = (newLimit) => {
    fetchTenants(1, newLimit);
  };
  
  // 處理重新產生 API Key
  const handleRefreshApiKey = async () => {
    if (!selectedTenant) return;
    
    try {
      setRefreshingApiKey(true);
      
      const updatedTenant = await tenantService.refreshApiKey(selectedTenant._id);
      console.log('更新後的工作區資料:', updatedTenant);
      
      // 更新本地狀態
      const updatedTenants = tenants.map((tenant) => 
        tenant._id === updatedTenant._id ? updatedTenant : tenant
      );
      
      setTenants(updatedTenants);
      onClose();
      
      toast({
        title: 'API Key 已重新產生',
        description: `工作區 "${updatedTenant.name}" 的 API Key 已成功更新`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('重新產生 API Key 失敗', error);
      
      toast({
        title: '操作失敗',
        description: error.response?.data?.message || '無法重新產生 API Key，請稍後再試',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setRefreshingApiKey(false);
    }
  };
  
  // 處理軟刪除工作區
  const handleSoftDeleteTenant = async () => {
    if (!selectedTenant) return;
    
    try {
      setRefreshingApiKey(true); // 重用現有狀態
      
      // 軟刪除工作區
      await tenantService.softDeleteTenant(selectedTenant._id);
      
      toast({
        title: '工作區已刪除',
        description: `工作區 "${selectedTenant.name}" 已成功刪除`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // 強制設置 loading 狀態以提供視覺反饋
      setLoading(true);
      
      // 添加短暫延遲確保 API 更新已完成
      setTimeout(() => {
        // 重新加載數據
        fetchTenants(pagination.page, pagination.limit);
      }, 300);
      
      // 關閉對話框
      onDeleteClose();
    } catch (error) {
      console.error('刪除工作區失敗', error);
      
      toast({
        title: '刪除失敗',
        description: error.response?.data?.message || '無法刪除工作區，請稍後再試',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setRefreshingApiKey(false);
    }
  };
  
  // 處理恢復已刪除的工作區
  const handleRestoreTenant = async (tenantId) => {
    try {
      setLoading(true);
      
      // 恢復工作區
      await tenantService.restoreTenant(tenantId);
      
      toast({
        title: '工作區已恢復',
        description: '工作區已成功恢復',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // 重新加載數據
      fetchTenants(pagination.page, pagination.limit);
    } catch (error) {
      console.error('恢復工作區失敗', error);
      
      toast({
        title: '恢復失敗',
        description: error.response?.data?.message || '無法恢復工作區，請稍後再試',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // 開啟重新產生 API Key 對話框
  const openRefreshApiKeyModal = (tenant) => {
    setSelectedTenant(tenant);
    onOpen();
  };
  
  // 開啟刪除對話框
  const openDeleteModal = (tenant) => {
    setSelectedTenant(tenant);
    onDeleteOpen();
  };
  
  // 搜尋結果過濾
  const filteredTenants = searchQuery
    ? tenants.filter(tenant => 
        tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant._id.includes(searchQuery)
      )
    : tenants;
  
  // 表格欄位定義
// 只展示 TenantsListPage.jsx 中修改的欄位定義部分

// 表格欄位定義 - 修改後版本，具有明確的寬度設定
const columns = [
  {
    header: '工作區名稱',
    key: 'name',
    width: '200px',
    minWidth: '200px', // 確保最小寬度一致
    render: (tenant) => (
      <Text 
        textDecoration={tenant.isDeleted ? 'line-through' : 'none'}
        color={tenant.isDeleted ? 'gray.500' : 'inherit'}
        overflow="hidden"
        textOverflow="ellipsis"
        whiteSpace="nowrap"
      >
        {tenant.name}
      </Text>
    ),
  },
  {
    header: '工作區 ID',
    key: '_id',
    width: '220px',
    minWidth: '220px',
    // 工作區 ID 列
render: (tenant) => (
  <HStack spacing={1}>
    <Text 
      color={tenant.isDeleted ? 'gray.500' : 'inherit'}
      maxW="170px"
      overflow="hidden"
      textOverflow="ellipsis"
      whiteSpace="nowrap"
    >
      {tenant._id}
    </Text>
    <Tooltip label="複製 ID" hasArrow>
      <IconButton
        aria-label="複製 ID"
        icon={<FiCopy />}
        size="xs"
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation();
          navigator.clipboard.writeText(tenant._id)
            .then(() => {
              toast({
                title: 'ID 已複製到剪貼簿',
                status: 'success',
                duration: 2000,
              });
            })
            .catch(err => {
              console.error('複製失敗:', err);
              toast({
                title: '複製失敗',
                status: 'error',
                duration: 2000,
              });
            });
        }}
      />
    </Tooltip>
  </HStack>
),
  },
  {
    header: 'API Key',
    key: 'apiKey',
    width: '220px',
    minWidth: '220px',
    render: (tenant) => (
  <HStack spacing={1}>
    <Text 
      color={tenant.isDeleted ? 'gray.500' : 'inherit'}
      maxW="140px"
      overflow="hidden"
      textOverflow="ellipsis"
      whiteSpace="nowrap"
    >
      {tenant.apiKey.substring(0, 8)}...{tenant.apiKey.substring(tenant.apiKey.length - 8)}
    </Text>
    <Tooltip label="複製 API Key" hasArrow>
      <IconButton
        aria-label="複製 API Key"
        icon={<FiCopy />}
        size="xs"
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation();
          navigator.clipboard.writeText(tenant.apiKey)
            .then(() => {
              toast({
                title: 'API Key 已複製到剪貼簿',
                status: 'success',
                duration: 2000,
              });
            })
            .catch(err => {
              console.error('複製失敗:', err);
              toast({
                title: '複製失敗',
                status: 'error',
                duration: 2000,
              });
            });
        }}
      />
    </Tooltip>
    <Tooltip label="重新產生 API Key" hasArrow>
      <IconButton
        aria-label="重新產生 API Key"
        icon={<FiRefreshCw />}
        size="xs"
        variant="ghost"
        colorScheme="orange"
        onClick={(e) => {
          e.stopPropagation();
          openRefreshApiKeyModal(tenant);
        }}
      />
    </Tooltip>
  </HStack>
),
  },
  {
    header: '狀態',
    key: 'isActive',
    width: '120px',
    minWidth: '120px',
    align: 'center',
    render: (tenant) => (
      tenant.isDeleted ? (
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
          colorScheme={tenant.isActive ? 'green' : 'red'}
          variant="solid"
          borderRadius="full"
          px={2}
        >
          {tenant.isActive ? '啟用' : '停用'}
        </Badge>
      )
    ),
  },
  {
    header: '建立時間',
    key: 'createdAt',
    width: '180px',
    minWidth: '180px',
    render: (tenant) => (
      <Text 
        color={tenant.isDeleted ? 'gray.500' : 'inherit'}
        fontSize="sm"
      >
        {new Date(tenant.createdAt).toLocaleString()}
      </Text>
    ),
  },
  {
    header: '操作',
    align: 'center',
    width: '100px',
    minWidth: '100px',
    render: (tenant) => (
      <HStack spacing={2} justifyContent="center">
        <IconButton
          as={Link}
          to={`/tenants/${tenant._id}`}
          icon={<FiEdit />}
          aria-label="編輯工作區"
          size="sm"
          colorScheme="brand"
          variant="ghost"
        />
        {!tenant.isDeleted && (
          <IconButton
            icon={<FiTrash2 />}
            aria-label="刪除工作區"
            size="sm"
            colorScheme="red"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              openDeleteModal(tenant);
            }}
          />
        )}
        {tenant.isDeleted && (
          <IconButton
            icon={<FiRotateCcw />}
            aria-label="恢復工作區"
            size="sm"
            colorScheme="blue"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              handleRestoreTenant(tenant._id);
            }}
          />
        )}
      </HStack>
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
          工作區管理
        </Heading>
        
        <Button
          as={Link}
          to="/tenants/new"
          leftIcon={<FiPlus />}
          colorScheme="brand"
        >
          新增工作區
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
      
      {/* 搜尋和過濾 - 桌面版與移動版使用不同布局 */}
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
              搜尋工作區
            </Text>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <FiSearch color="gray.300" />
              </InputLeftElement>
              <Input
                placeholder="搜尋工作區名稱或 ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </InputGroup>
          </Box>
          
          {/* 右側狀態選擇器 */}
          <Box width="360px">
            <Text fontSize="sm" fontWeight="medium" mb={2}>
              工作區狀態
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
              搜尋工作區
            </Text>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <FiSearch color="gray.300" />
              </InputLeftElement>
              <Input
                placeholder="搜尋工作區名稱或 ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </InputGroup>
          </Box>
          
          {/* 狀態選擇器 */}
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={2}>
              工作區狀態
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
        </VStack>
      </Card>
      
      {/* 工作區列表 */}
      <DataTable
        columns={columns}
        data={filteredTenants}
        isLoading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        emptyMessage="目前沒有任何工作區"
      />
      
      {/* 重新產生 API Key 對話框 */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>重新產生 API Key</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <HStack color="orange.500" mb={4}>
              <FiAlertCircle />
              <Text fontWeight="medium">警告</Text>
            </HStack>
            <Text mb={2}>
              您即將重新產生工作區 "{selectedTenant?.name}" 的 API Key。
            </Text>
            <Text fontWeight="medium" mb={2}>
              此操作會使目前的 API Key 失效，無法還原。
            </Text>
            <Text>
              確定要繼續嗎？
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onClose}>
              取消
            </Button>
            <Button 
              colorScheme="red" 
              onClick={handleRefreshApiKey}
              isLoading={refreshingApiKey}
              loadingText="處理中..."
            >
              重新產生
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* 刪除確認對話框 */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>刪除工作區</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <HStack color="red.500" mb={4}>
              <FiAlertCircle />
              <Text fontWeight="medium">警告</Text>
            </HStack>
            <Text mb={2}>
              您即將刪除工作區 "{selectedTenant?.name}"。
            </Text>
            <Text fontWeight="medium" mb={2}>
              刪除後，該工作區將不會出現在常規列表中，但資料仍會保留在系統中。
            </Text>
            <Text>
              您可以通過選擇顯示已刪除工作區來查看並恢復。
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onDeleteClose}>
              取消
            </Button>
            <Button 
              colorScheme="red" 
              onClick={handleSoftDeleteTenant}
              isLoading={refreshingApiKey}
              loadingText="處理中..."
            >
              確認刪除
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default TenantsListPage;