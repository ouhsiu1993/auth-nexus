// src/components/navigation/Sidebar.jsx
import React from 'react';
import {
  Box,
  Flex,
  VStack,
  Text,
  Icon,
  useColorModeValue,
  Drawer,
  DrawerContent,
  DrawerBody,
  Badge,
  Tooltip,
  useBreakpointValue,
  Divider,
} from '@chakra-ui/react';
import {
  FiHome,
  FiUsers,
  FiDatabase,
  FiSettings,
  FiShield,
  FiChevronsLeft,
  FiChevronsRight,
} from 'react-icons/fi';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';

// NavItem 組件 - 單個導航項目
const NavItem = ({ icon, label, path, isActive, comingSoon = false, onClick }) => {
  const location = useLocation();
  const { isSidebarOpen } = useUI();
  
  // 基於當前路徑判斷是否激活
  const active = isActive || (path && location.pathname.startsWith(path));
  
  // 顏色設定
  const activeBg = useColorModeValue('brand.50', 'brand.900');
  const activeColor = useColorModeValue('brand.700', 'brand.200');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  
  // 渲染內容
  const itemContent = (
    <Flex
      as={!comingSoon && path ? Link : 'div'} // 僅當非"即將上線"項目時才使用 Link
      to={!comingSoon && path ? path : undefined} // 僅當非"即將上線"項目時才設置路徑
      position="relative"
      role="group"
      cursor={comingSoon ? "not-allowed" : "pointer"} // 即將上線項目顯示禁止游標
      bg={active ? activeBg : 'transparent'}
      color={active ? activeColor : textColor}
      _hover={{
        bg: comingSoon ? 'transparent' : (active ? activeBg : hoverBg), // 即將上線項目無懸停效果
      }}
      opacity={comingSoon ? 0.6 : 1}
      onClick={comingSoon ? (e) => e.preventDefault() : onClick} // 即將上線項目阻止點擊事件
      className="nav-item"
      height="45px" // 固定高度
      transition="background 0.3s ease"
      borderRadius="md"
    >
      {/* 左側固定寬度容器 - 圖標始終居中 */}
      <Flex
        width="72px"
        height="100%"
        justify="center"
        align="center"
        flexShrink={0}
      >
        <Icon as={icon} fontSize="lg" boxSize="1em" />
      </Flex>
      
      {/* 右側文字容器 - 僅在展開狀態顯示 */}
      {isSidebarOpen && (
        <Flex
          pl={1}  // 微調左邊距以達到合適的視覺效果
          height="100%"
          align="center"
          overflow="hidden"
          opacity={1}
          transform="translateX(0)"
          transition="opacity 0.3s ease, transform 0.3s ease"
        >
          <Text fontSize="sm" fontWeight="medium">
            {label}
          </Text>
          
          {comingSoon && (
            <Badge ml={2} colorScheme="orange" fontSize="2xs">
              即將上線
            </Badge>
          )}
        </Flex>
      )}
    </Flex>
  );

  // 當側邊欄收起時，添加工具提示
  if (!isSidebarOpen) {
    let tooltipLabel = label;
    if (comingSoon) {
      tooltipLabel = `${label} (功能開發中)`;
    }
    
    return (
      <Tooltip label={tooltipLabel} placement="right" hasArrow>
        {itemContent}
      </Tooltip>
    );
  }
  
  return itemContent;
};

// 主側邊欄組件
const Sidebar = () => {
  const { isSuperAdmin } = useAuth();
  const { isSidebarOpen, toggleSidebar, closeSidebar, handleNavigation } = useUI();
  const location = useLocation();
  const isMobile = useBreakpointValue({ base: true, md: false });
  
  // 顏色設定
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const dividerColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  
  // 導航項目配置
  const navItems = [
    { label: '儀表板', icon: FiHome, path: '/dashboard', adminOnly: true },
    { label: '工作區管理', icon: FiDatabase, path: '/tenants', adminOnly: true },
    { label: '使用者管理', icon: FiUsers, path: '/users', adminOnly: true },
    { divider: true }, // 分隔線
    { label: '系統設定', icon: FiSettings, path: '/settings', adminOnly: true, comingSoon: true },
    { label: '存取控制', icon: FiShield, path: '/access-control', adminOnly: true, comingSoon: true },
  ];

  // 過濾導航項目（根據權限）
  const filteredNavItems = navItems.filter(
    (item) => !item.adminOnly || isSuperAdmin
  );

  // 側邊欄內容
  const SidebarContent = () => (
    <Box
      as="nav"
      aria-label="主導航"
      h="full"
      overflowY="auto"
      overflowX="hidden"
      w={isSidebarOpen ? "250px" : "72px"}
      transition="width 0.3s ease"
      py={2}
      position="relative"
    >
      <VStack spacing={0} align="stretch">
        {filteredNavItems.map((item, idx) => {
          // 如果是分隔線 (只在非行動裝置顯示)
          if (item.divider) {
            return !isMobile ? (
              <Divider 
                key={`divider-${idx}`} 
                my={2} 
                borderColor={dividerColor} 
                opacity={0.6}
              />
            ) : null; // 行動裝置上不顯示分隔線
          }
          
          // 導航項目
          return (
            <NavItem
              key={item.path || idx}
              icon={item.icon}
              label={item.label}
              path={item.path}
              isActive={location.pathname === item.path}
              comingSoon={item.comingSoon}
              onClick={() => {
                if (isMobile) {
                  closeSidebar();
                }
                if (handleNavigation) {
                  handleNavigation();
                }
              }}
            />
          );
        })}
      </VStack>
      
      {/* 底部折疊/展開按鈕 - 只在非行動裝置上顯示 */}
      {!isMobile && (
        <Box 
          position="absolute" 
          bottom={4} 
          left={0} 
          right={0}
          width="100%"
        >
          {/* 分隔線，只在非行動裝置顯示 */}
          <Divider mb={2} borderColor={dividerColor} opacity={0.6} />
          
          {/* 使用與導航項目相同的結構 */}
          {isSidebarOpen ? (
            <Flex
              position="relative"
              cursor="pointer"
              height="45px"
              bg="transparent"
              _hover={{ bg: hoverBg }}
              onClick={toggleSidebar}
              role="button"
              aria-label="收合側邊欄"
              borderRadius="md"
            >
              {/* 左側固定寬度容器 - 圖標始終居中 */}
              <Flex
                width="72px"
                height="100%"
                justify="center"
                align="center"
                flexShrink={0}
              >
                <Icon 
                  as={FiChevronsLeft}
                  fontSize="lg" 
                  boxSize="1em" 
                />
              </Flex>
              
              {/* 右側文字容器 - 僅在展開狀態顯示 */}
              <Flex
                pl={1}
                height="100%"
                align="center"
                overflow="hidden"
                opacity={1}
                transform="translateX(0)"
                transition="opacity 0.3s ease, transform 0.3s ease"
              >
                <Text fontSize="sm" fontWeight="medium">
                  收合側邊欄
                </Text>
              </Flex>
            </Flex>
          ) : (
            <Tooltip label="展開側邊欄" placement="right" hasArrow>
              <Flex
                position="relative"
                cursor="pointer"
                height="45px"
                bg="transparent"
                _hover={{ bg: hoverBg }}
                onClick={toggleSidebar}
                role="button"
                aria-label="展開側邊欄"
                borderRadius="md"
              >
                {/* 左側固定寬度容器 - 圖標始終居中 */}
                <Flex
                  width="72px"
                  height="100%"
                  justify="center"
                  align="center"
                  flexShrink={0}
                >
                  <Icon 
                    as={FiChevronsRight}
                    fontSize="lg" 
                    boxSize="1em" 
                  />
                </Flex>
              </Flex>
            </Tooltip>
          )}
        </Box>
      )}
    </Box>
  );

  // 行動版側邊欄 (Drawer)
  const MobileSidebar = isMobile ? (
    <Drawer
      isOpen={isSidebarOpen}
      placement="left"
      onClose={closeSidebar}
      returnFocusOnClose={false}
      isFullHeight={false}
      onOverlayClick={closeSidebar}
    >
      <DrawerContent 
        maxW="270px"
        mt="64px" // 從 Navbar 高度開始
        height="calc(100vh - 64px)" // 調整高度，扣除 Navbar 高度
        borderRadius="0"
        boxShadow="md"
        borderRightWidth="1px"
        borderColor={borderColor}
      >
        <DrawerBody p={0}>
          <SidebarContent />
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  ) : null;

  // 桌面版側邊欄
  const DesktopSidebar = (
    <Box
      as="aside"
      aria-label="工作區導航"
      position="fixed"
      left={0}
      top={0}
      w={isSidebarOpen ? "250px" : "72px"}
      h="full"
      bg={bgColor}
      borderRight="1px"
      borderColor={borderColor}
      display={{ base: 'none', md: 'block' }}
      transition="width 0.3s ease"
      zIndex="2"
      pt="64px" // 避開 Navbar
    >
      <SidebarContent />
    </Box>
  );

  return (
    <>
      {DesktopSidebar}
      {MobileSidebar}
    </>
  );
};

export default Sidebar;