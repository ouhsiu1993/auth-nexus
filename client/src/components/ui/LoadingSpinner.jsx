// src/components/ui/LoadingSpinner.jsx
import { Flex, Spinner, Text } from '@chakra-ui/react';

/**
 * 載入中旋轉器
 * @param {Object} props
 * @param {string} props.size - 尺寸 (xs, sm, md, lg, xl)
 * @param {string} props.message - 載入訊息
 * @param {string} props.color - 主色調
 */
const LoadingSpinner = ({ 
  size = 'md', 
  message = '載入中...', 
  color = 'brand.500',
  fullPage = false 
}) => {
  // 全頁面載入
  if (fullPage) {
    return (
      <Flex
        position="fixed"
        top="0"
        left="0"
        right="0"
        bottom="0"
        zIndex="overlay"
        bg="blackAlpha.300"
        justify="center"
        align="center"
        flexDirection="column"
      >
        <Spinner
          thickness="4px"
          speed="0.65s"
          emptyColor="gray.200"
          color={color}
          size={size}
        />
        {message && (
          <Text mt={4} fontSize="md" fontWeight="medium" color="gray.700">
            {message}
          </Text>
        )}
      </Flex>
    );
  }
  
  // 元件內載入
  return (
    <Flex
      py={8}
      justify="center"
      align="center"
      flexDirection="column"
      w="full"
    >
      <Spinner
        thickness="4px"
        speed="0.65s"
        emptyColor="gray.200"
        color={color}
        size={size}
      />
      {message && (
        <Text mt={4} fontSize="md" fontWeight="medium" color="gray.700">
          {message}
        </Text>
      )}
    </Flex>
  );
};

export default LoadingSpinner;