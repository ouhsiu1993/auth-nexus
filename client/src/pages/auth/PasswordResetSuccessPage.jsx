import { Box, Heading, Text, Button, VStack, Icon } from '@chakra-ui/react';
import { FiCheckCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useUI } from '../../contexts/UIContext';

const PasswordResetSuccessPage = () => {
  const { updatePageTitle } = useUI();
  
  // 更新頁面標題
  useEffect(() => {
    updatePageTitle('密碼重設成功');
  }, [updatePageTitle]);
  
  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="gray.50">
      <Box
        bg="white"
        p={8}
        borderRadius="lg"
        boxShadow="lg"
        textAlign="center"
        maxW="lg"
        mx="auto"
      >
        <VStack spacing={4}>
          <Icon as={FiCheckCircle} boxSize="16" color="green.500" />
          
          <Heading size="xl" mt={4}>
            密碼重設成功
          </Heading>
          
          <Text fontSize="lg">
            您的 AuthNexus 帳戶密碼已成功重設，現在您可以使用新密碼登入系統。
          </Text>
          

        </VStack>
      </Box>
    </Box>
  );
};

export default PasswordResetSuccessPage;