// src/pages/UnauthorizedPage.jsx
import { Box, Heading, Text, Button, Flex, Icon } from '@chakra-ui/react';
import { FiLock, FiLogIn } from 'react-icons/fi';
import { Link,useNavigate  } from 'react-router-dom';
import { useEffect } from 'react';
import { useUI } from '../contexts/UIContext';
import { useAuth } from '../contexts/AuthContext';

const UnauthorizedPage = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
  const { updatePageTitle } = useUI();
  
  // 更新頁面標題
  useEffect(() => {
    updatePageTitle('未授權存取');
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
        <Icon as={FiLock} fontSize="6xl" color="orange.500" mb={4} />
        
        <Heading as="h1" size="xl" mb={4}>
          401 - 未授權存取
        </Heading>
        
        <Text fontSize="lg" color="gray.600" mb={6}>
          很抱歉，您沒有權限存取此頁面。請以具有適當權限的帳號登入。
        </Text>
        
        <Button
  onClick={() => {
    logout(); // 先登出
    navigate('/login'); // 然後重定向到登入頁面
  }}
  colorScheme="brand"
  leftIcon={<FiLogIn />}
  size="lg"
>
  返回登入頁面
</Button>
      </Box>
    </Flex>
  );
};

export default UnauthorizedPage;