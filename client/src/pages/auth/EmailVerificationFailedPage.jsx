// src/pages/auth/EmailVerificationFailedPage.jsx
import { Box, Heading, Text, Button, VStack, Icon } from '@chakra-ui/react';
import { FiAlertCircle } from 'react-icons/fi';
import { Link, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useUI } from '../../contexts/UIContext';

const EmailVerificationFailedPage = () => {
  const { updatePageTitle } = useUI();
  const [searchParams] = useSearchParams();
  const reason = searchParams.get('reason');
  
  // 更新頁面標題
  useEffect(() => {
    updatePageTitle('電子郵件驗證失敗');
  }, [updatePageTitle]);
  
  // 根據失敗原因顯示不同的錯誤訊息
  const getErrorMessage = () => {
    switch (reason) {
      case 'user-not-found':
        return '我們找不到與此驗證連結相關聯的使用者帳號。可能是連結已失效或帳號已被刪除。';
      case 'email-mismatch':
        return '驗證連結中的電子郵件與使用者帳號不匹配。請確認您使用的是最新的驗證連結。';
      default:
        return '驗證連結可能已過期或無效。請重新請求驗證郵件。';
    }
  };
  
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
          <Icon as={FiAlertCircle} boxSize="16" color="red.500" />
          
          <Heading size="xl" mt={4}>
            電子郵件驗證失敗
          </Heading>
          
          <Text fontSize="lg">
            {getErrorMessage()}
          </Text>
          
          <Text fontSize="md" color="gray.600">
            如需協助，請聯絡您的系統管理員或嘗試重新登入並請求新的驗證郵件。
          </Text>
          
          <Button
            as={Link}
            to="/login"
            colorScheme="brand"
            size="lg"
            mt={6}
            w="full"
          >
            返回登入頁面
          </Button>
        </VStack>
      </Box>
    </Box>
  );
};

export default EmailVerificationFailedPage;