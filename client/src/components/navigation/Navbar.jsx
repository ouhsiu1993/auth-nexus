// src/components/navigation/Navbar.jsx
import {
  Box,
  Flex,
  Text,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Avatar,
  HStack,
  useColorModeValue,
  Image,
  IconButton,
  VStack,
  Badge,
  Icon,
} from '@chakra-ui/react';
import { FiUser, FiLogOut, FiSettings, FiMenu, FiShield, FiX } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { isSidebarOpen, toggleSidebar } = useUI();
  
  // 顏色設定
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const appName = import.meta.env.VITE_APP_NAME || 'Auth Nexus';
  
  // 定義圖示尺寸 - 使用與 Sidebar 相同的尺寸
  const iconSize = "18px"; // 顯式設定大一點的尺寸以確保效果明顯
  
  return (
    <Box
      as="header"
      pos="fixed"
      top="0"
      left="0"
      right="0"
      zIndex="sticky"
      bg={bgColor}
      borderBottomWidth="1px"
      borderColor={borderColor}
      width="100%"
      h="64px" // 固定高度，與 Sidebar 對應
    >
      <Flex
        h="100%"
        alignItems="center"
        justifyContent="space-between"
        px={4}
      >
        {/* 左側：Logo */}
        <HStack spacing={4}>
          {/* 行動裝置上的漢堡選單按鈕 */}
          <IconButton
            display={{ base: 'flex', md: 'none' }}
            onClick={toggleSidebar}
            icon={isSidebarOpen ? <FiX /> : <FiMenu />}
            size="md"
            variant="ghost"
            aria-label={isSidebarOpen ? "關閉選單" : "開啟選單"}
            colorScheme={isSidebarOpen ? "brand" : "gray"}
          />
        
          {/* Logo 和應用名稱 */}
          <Flex 
            alignItems="center"
            as={Link}
            to="/dashboard"
            _hover={{ opacity: 0.8 }}
            transition="opacity 0.3s"
          >
            <Image 
              boxSize="32px"
              src="/auth-nexus logo.svg" 
              alt={appName}
              fallbackSrc="https://placehold.co/32x32?text=AN"
            />
            <Text 
              fontSize="lg" 
              fontWeight="bold" 
              ml={2}
            >
              {appName}
            </Text>
          </Flex>
        </HStack>
        
        {/* 右側：使用者頭像 */}
        <Menu placement="bottom-end">
          <MenuButton>
            <Avatar
              size="sm"
              name={user?.name}
              bg="brand.500"
              color="white"
              cursor="pointer"
            />
          </MenuButton>
          <MenuList py={0}>
            {/* 使用者資訊區塊 */}
            <Box px={4} py={3}>
              <Flex align="center">
                <Avatar
                  size="md"
                  name={user?.name}
                  bg="brand.500"
                  color="white"
                  mr={3}
                />
                <VStack spacing={1} align="start">
                  <Text fontSize="sm" fontWeight="medium">{user?.name || '使用者'}</Text>
                  <Text fontSize="sm" color="gray.500">{user?.email || 'user@example.com'}</Text>
                </VStack>
              </Flex>
            </Box>
            
            <MenuDivider my={0} />
            
            {/* 功能選項 - 添加hover效果 */}
            <MenuItem 
              icon={<Icon as={FiUser} boxSize={iconSize} />}
              _hover={{ bg: hoverBg }}
              py={3}
              as={Link}
              to={`/users/${user?._id}`}
              fontSize="sm" // 與 Sidebar 文字大小一致
            >
              個人檔案
            </MenuItem>
            
            {/* 系統設定 - 添加即將上線標籤 */}
            <MenuItem 
              icon={<Icon as={FiSettings} boxSize={iconSize} />}
              _hover={{ bg: hoverBg }}
              py={3}
              isDisabled
              opacity={0.6}
              fontSize="sm" // 與 Sidebar 文字大小一致
            >
              <Flex align="center">
                <Text>系統設定</Text>
                <Badge ml={2} colorScheme="orange" fontSize="2xs">即將上線</Badge>
              </Flex>
            </MenuItem>
            
            {/* 存取控制 - 添加即將上線標籤 */}
            <MenuItem 
              icon={<Icon as={FiShield} boxSize={iconSize} />}
              _hover={{ bg: hoverBg }}
              py={3}
              isDisabled
              opacity={0.6}
              fontSize="sm" // 與 Sidebar 文字大小一致
            >
              <Flex align="center">
                <Text>存取控制</Text>
                <Badge ml={2} colorScheme="orange" fontSize="2xs">即將上線</Badge>
              </Flex>
            </MenuItem>
            
            <MenuDivider my={0} />
            
            <MenuItem 
              icon={<Icon as={FiLogOut} boxSize={iconSize} />}
              onClick={logout}
              color="red.500"
              _hover={{ bg: hoverBg }}
              py={3}
              fontSize="sm" // 與 Sidebar 文字大小一致
            >
              登出
            </MenuItem>
          </MenuList>
        </Menu>
      </Flex>
    </Box>
  );
};

export default Navbar;