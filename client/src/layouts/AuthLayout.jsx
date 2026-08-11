// client/src/layouts/AuthLayout.jsx - 修改驗證佈局元件
import { Box, Flex, Image, Text, useColorModeValue } from '@chakra-ui/react';
import { useEffect } from 'react';
import { useUI } from '../contexts/UIContext';

const AuthLayout = ({ children, title }) => {
  const { updatePageTitle } = useUI();
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBgColor = useColorModeValue('white', 'gray.800');
  const appName = import.meta.env.VITE_APP_NAME || 'Auth-Nexus';
  
  // 更新頁面標題
  useEffect(() => {
    if (title) {
      updatePageTitle(title);
    }
  }, [title, updatePageTitle]);
  
  return (
    <Box minH="100vh" bg={bgColor}>
      <Flex align="center" justify="center" minH="100vh" px={4}>
        <Box
          w="full"
          maxW="450px"
          bg={cardBgColor}
          p={8}
          borderRadius="lg"
          boxShadow="lg"
        >
          {/* Logo 和應用名稱 */}
          <Flex direction="column" align="center" mb={8}>
            <Box boxSize="80px" mb={4}>
              <Image 
                src="/auth-nexus logo.svg" 
                alt={appName}
                fallbackSrc="https://placehold.co/80x80?text=A1"
              />
            </Box>
            <Text fontSize="2xl" fontWeight="bold" textAlign="center">
              {appName}
            </Text>
            {title && (
              <Text fontSize="md" color="gray.600" mt={1}>
                {title}
              </Text>
            )}
          </Flex>
          
          {/* 認證表單內容 */}
          {children}
        </Box>
      </Flex>
    </Box>
  );
};

export default AuthLayout;