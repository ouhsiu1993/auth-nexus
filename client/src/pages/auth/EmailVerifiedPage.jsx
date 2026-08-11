import { Box, Heading, Text, Button, VStack, Icon, useToast } from '@chakra-ui/react';
import { FiCheckCircle, FiLoader } from 'react-icons/fi';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useUI } from '../../contexts/UIContext';
import axios from 'axios';

const EmailVerifiedPage = () => {
  const { updatePageTitle } = useUI();
  const { token } = useParams(); // 獲取 URL 中的 token 參數
  const [verifying, setVerifying] = useState(!!token); // 如果有 token，顯示驗證中狀態
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  
  // 更新頁面標題
  useEffect(() => {
    updatePageTitle('電子郵件驗證');
  }, [updatePageTitle]);
  
  // 如果有 token，嘗試驗證
  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) return;
      
      try {
        setVerifying(true);
        
        // 直接向後端 API 發送請求驗證 token
        await axios.get(
  `${import.meta.env.VITE_API_URL}/api/auth/verify-email/${token}`,
  {
    withCredentials: true,
  }
);
        
        // 驗證成功
        setVerificationSuccess(true);
        
        toast({
          title: '驗證成功',
          description: '您的電子郵件已成功驗證！',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // 5秒後重定向到成功頁面
        setTimeout(() => {
          navigate('/email-verified', { replace: true });
        }, 5000);
      } catch (error) {
        console.error('郵件驗證失敗:', error);
        
        // 驗證失敗，重定向到失敗頁面
        let reason = '';
        if (error.response) {
          if (error.response.status === 404) {
            reason = 'user-not-found';
          } else if (error.response.data?.code === 'EMAIL_MISMATCH') {
            reason = 'email-mismatch';
          }
        }
        
        navigate(`/email-verification-failed${reason ? `?reason=${reason}` : ''}`, { replace: true });
        
        toast({
          title: '驗證失敗',
          description: '無法驗證您的電子郵件，請檢查連結是否有效或聯絡系統管理員。',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setVerifying(false);
      }
    };
    
    verifyEmail();
  }, [token, toast, navigate]);
  
  // 如果正在驗證中，顯示載入畫面
  if (verifying) {
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
            <Icon as={FiLoader} boxSize="16" color="blue.500" className="spinner" />
            
            <Heading size="xl" mt={4}>
              正在驗證您的電子郵件...
            </Heading>
            
            <Text fontSize="lg">
              請稍候，我們正在處理您的驗證請求。
            </Text>
          </VStack>
          
          <style jsx>{`
            .spinner {
              animation: spin 2s linear infinite;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </Box>
      </Box>
    );
  }
  
  // 正常顯示驗證成功頁面
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
            電子郵件已成功驗證
          </Heading>
          
          <Text fontSize="lg">
            您的 AuthNexus 帳戶電子郵件已成功驗證，現在您可以完整使用系統功能。
          </Text>
          

        </VStack>
      </Box>
    </Box>
  );
};

export default EmailVerifiedPage;