// src/layouts/MainLayout.jsx
import React from 'react';
import { Box, Flex, useColorModeValue, useBreakpointValue } from '@chakra-ui/react';
import { useUI } from '../contexts/UIContext';
import Navbar from '../components/navigation/Navbar';
import Sidebar from '../components/navigation/Sidebar';
import { Outlet } from 'react-router-dom';

const MainLayout = () => {
  const { isSidebarOpen } = useUI();
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const isMobile = useBreakpointValue({ base: true, md: false });
  
  // 側邊欄寬度 - 保持原始設定
  const sidebarWidth = isSidebarOpen ? '250px' : '72px';
  
  return (
    <Box minH="100vh" bg={bgColor}>
      {/* 頂部導航欄 - 全寬且在最上層 */}
      <Navbar />
      
      {/* 側邊欄 */}
      <Sidebar />
      
      {/* 主要內容區 - 調整左邊距以符合側邊欄狀態 */}
      <Box
        ml={{ base: 0, md: sidebarWidth }}
        pt="64px" // 固定值確保內容在 Navbar 下方
        transition="margin-left 0.3s ease"
        zIndex={0}
      >
        {/* 頁面內容 */}
        <Box as="main" p={6} pb={8}>
          <Flex
            direction="column"
            maxW="1200px"
            mx="auto"
            h="full"
          >
            <Outlet />
          </Flex>
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;