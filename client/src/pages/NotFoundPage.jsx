// src/pages/NotFoundPage.jsx
import { Box, Heading, Text, Button, Flex, Icon } from '@chakra-ui/react';
import { FiAlertCircle, FiHome } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useUI } from '../contexts/UIContext';

const NotFoundPage = () => {
  const { updatePageTitle } = useUI();
  
  // 更新頁面標題
  useEffect(() => {
    updatePageTitle('頁面不存在');
  }, [updatePageTitle]);
  
  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      bg="gray.50"
      p={4}
    >
      <Box
        bg="white"
        p={8}
        borderRadius="lg"
        boxShadow="md"
        textAlign="center"
        maxW="md"
        w="full"
      >
        <Icon as={FiAlertCircle} fontSize="6xl" color="red.500" mb={4} />
        
        <Heading as="h1" size="xl" mb={4}>
          404 - 頁面不存在
        </Heading>
        
        <Text fontSize="lg" color="gray.600" mb={6}>
          很抱歉，您嘗試訪問的頁面不存在或已被移除。
        </Text>
        
        <Button
          as={Link}
          to="/"
          colorScheme="brand"
          leftIcon={<FiHome />}
          size="lg"
        >
          返回首頁
        </Button>
      </Box>
    </Flex>
  );
};

export default NotFoundPage;