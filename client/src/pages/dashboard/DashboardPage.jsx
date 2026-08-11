// src/pages/dashboard/DashboardPage.jsx
import { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Heading,
  Text,
  Flex,
  Icon,
  SimpleGrid,
  Button,
  Badge,
} from '@chakra-ui/react';
import { FiUsers, FiDatabase, FiCheckCircle, FiAlertCircle, FiActivity, FiShield, FiSettings } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useUI } from '../../contexts/UIContext';
import { useError } from '../../contexts/ErrorContext';
import Card from '../../components/ui/Card';
import DashboardCard from '../../components/ui/DashboardCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

// 服務導入
import tenantService from '../../services/tenantService';
import userService from '../../services/userService';

const DashboardPage = () => {
  const { updatePageTitle } = useUI();
  const { showError } = useError();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTenants: 0,
    activeTenants: 0,
    totalUsers: 0,
    activeUsers: 0,
  });
  const [error, setError] = useState(null);
  
  // 更新頁面標題
  useEffect(() => {
    updatePageTitle('系統儀表板');
  }, [updatePageTitle]);
  
  // 獲取儀表板資料
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 獲取工作區資料
        const tenantsData = await tenantService.getAllTenants(1, 100);
        console.log('工作區統計資料:', tenantsData);
        
        // 獲取使用者資料
        const usersData = await userService.getAllUsers(1, 100);
        console.log('使用者統計資料:', usersData);
        
        // 計算活躍工作區和使用者
        const activeTenants = tenantsData.tenants.filter(t => t.isActive).length;
        const activeUsers = usersData.users.filter(u => u.isActive).length;
        
        // 設置統計資料
        setStats({
          totalTenants: tenantsData.pagination.total || tenantsData.tenants.length,
          activeTenants: activeTenants,
          totalUsers: usersData.pagination.total || usersData.users.length,
          activeUsers: activeUsers,
        });
      } catch (error) {
        console.error('獲取儀表板資料失敗', error);
        setError('無法載入儀表板資料，請重新整理頁面或聯絡系統管理員');
        showError('無法載入儀表板資料，請重新整理頁面或聯絡系統管理員', '資料載入失敗');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [showError]);
  
  // 載入中
  if (loading) {
    return <LoadingSpinner size="xl" />;
  }
  
  // 發生錯誤
  if (error) {
    return (
      <Card variant="elevated">
        <Flex direction="column" align="center" p={6}>
          <Icon as={FiAlertCircle} fontSize="4xl" color="red.500" mb={4} />
          <Heading size="md" mb={2} textAlign="center">
            資料載入失敗
          </Heading>
          <Text mb={4} textAlign="center" color="gray.600">
            {error}
          </Text>
          <Button 
            colorScheme="brand" 
            onClick={() => window.location.reload()}
          >
            重新整理
          </Button>
        </Flex>
      </Card>
    );
  }
  
  return (
    <Box>
<Box 
  h={{ base: "16px", md: "24px" }} 
  mb={{ base: 4, md: 6 }}
></Box>
      
      {/* 頁面標題 */}
      <Heading as="h1" size="xl" mb={8}>
        儀表板
      </Heading>
      
      {/* 統計卡片 */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={10}>
        {/* 工作區總數 */}
        <DashboardCard
          icon={FiDatabase}
          iconColor="brand.500"
          label="工作區總數"
          value={stats.totalTenants}
          helpText={`${stats.activeTenants} 個已啟用 (${Math.round((stats.activeTenants / stats.totalTenants) * 100) || 0}%)`}
        />
        
        {/* 使用者總數 */}
        <DashboardCard
          icon={FiUsers}
          iconColor="brand.500"
          label="使用者總數"
          value={stats.totalUsers}
          helpText={`${stats.activeUsers} 個已啟用 (${Math.round((stats.activeUsers / stats.totalUsers) * 100) || 0}%)`}
        />
        
        {/* 系統狀態 */}
        <DashboardCard
          icon={FiCheckCircle}
          iconColor="green.500"
          label="系統狀態"
          value="正常"
          valueColor="green.500"
          helpText="所有服務運行正常"
        />
        
        {/* API 請求 */}
        <DashboardCard
          icon={FiActivity}
          iconColor="blue.500"
          label="API 請求"
          value="-"
          helpText="功能開發中"
        />
      </SimpleGrid>
      
      {/* 快速導航區塊 */}
      <Heading as="h2" size="md" mb={4}>快速導航</Heading>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={10}>
        {/* 工作區管理 */}
        <Card>
          <Flex direction="column" h="full">
            <Flex align="center" mb={3}>
              <Icon as={FiDatabase} fontSize="xl" color="brand.500" mr={2} />
              <Heading size="sm">工作區管理</Heading>
            </Flex>
            <Text color="gray.600" mb={4}>
              檢視和管理系統中的所有工作區，建立新工作區或調整現有工作區設定。
            </Text>
            <Box mt="auto">
              <Button as={Link} to="/tenants" colorScheme="brand" size="sm">
                進入工作區管理
              </Button>
            </Box>
          </Flex>
        </Card>
        
        {/* 使用者管理 */}
        <Card>
          <Flex direction="column" h="full">
            <Flex align="center" mb={3}>
              <Icon as={FiUsers} fontSize="xl" color="brand.500" mr={2} />
              <Heading size="sm">使用者管理</Heading>
            </Flex>
            <Text color="gray.600" mb={4}>
              檢視和管理系統中的所有使用者，包括權限設定、停用/啟用帳號等操作。
            </Text>
            <Box mt="auto">
              <Button as={Link} to="/users" colorScheme="brand" size="sm">
                進入使用者管理
              </Button>
            </Box>
          </Flex>
        </Card>
        
        {/* 系統設定 */}
        <Card>
          <Flex direction="column" h="full">
            <Flex align="center" mb={3}>
              <Icon as={FiSettings} fontSize="xl" color="orange.500" mr={2} />
              <Heading size="sm">
                系統設定
                <Badge ml={2} colorScheme="orange" fontSize="xs">即將上線</Badge>
              </Heading>
            </Flex>
            <Text color="gray.600" mb={4}>
              調整系統設定，包括安全策略、登入規則、密碼原則、API 設定等。
            </Text>
            <Box mt="auto">
              <Button 
                isDisabled
                colorScheme="gray" 
                size="sm"
              >
                功能開發中
              </Button>
            </Box>
          </Flex>
        </Card>
        
        {/* 存取控制 - 即將上線 */}
        <Card>
          <Flex direction="column" h="full">
            <Flex align="center" mb={3}>
              <Icon as={FiShield} fontSize="xl" color="orange.500" mr={2} />
              <Heading size="sm">
                存取控制
                <Badge ml={2} colorScheme="orange" fontSize="xs">即將上線</Badge>
              </Heading>
            </Flex>
            <Text color="gray.600" mb={4}>
              管理角色與權限，控制使用者對系統資源的存取權限，設定權限政策。
            </Text>
            <Box mt="auto">
              <Button 
                isDisabled
                colorScheme="gray" 
                size="sm"
              >
                功能開發中
              </Button>
            </Box>
          </Flex>
        </Card>
      </SimpleGrid>
      
      {/* 系統資訊 */}
      <Card>
        <Heading as="h2" size="md" mb={4}>系統資訊</Heading>
        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
          <Flex>
            <Text fontWeight="medium" minW="120px">系統版本：</Text>
            <Text>Auth Nexus v1.0.0</Text>
          </Flex>
          <Flex>
            <Text fontWeight="medium" minW="120px">建置日期：</Text>
            <Text>{new Date().toLocaleDateString()}</Text>
          </Flex>
          <Flex>
            <Text fontWeight="medium" minW="120px">伺服器狀態：</Text>
            <Text color="green.500">在線</Text>
          </Flex>
          <Flex>
            <Text fontWeight="medium" minW="120px">資料庫狀態：</Text>
            <Text color="green.500">在線</Text>
          </Flex>
        </Grid>
      </Card>
    </Box>
  );
};

export default DashboardPage;