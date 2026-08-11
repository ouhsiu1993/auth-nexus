// src/components/ui/Card.jsx
import { Box, Flex, Heading, useColorModeValue } from '@chakra-ui/react';

/**
 * 卡片元件
 * @param {Object} props
 * @param {string} props.title - 卡片標題
 * @param {React.ReactNode} props.headerRight - 標題右側內容
 * @param {React.ReactNode} props.children - 卡片內容
 * @param {string} props.variant - 卡片變體 (default, outline, elevated)
 */
const Card = ({ 
  title, 
  headerRight, 
  children, 
  variant = 'default',
  ...rest
}) => {
  // 卡片顏色設定
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // 卡片變體
  const cardStyles = {
    default: {
      bg: bgColor,
      boxShadow: 'sm',
      border: '1px solid',
      borderColor: borderColor,
    },
    outline: {
      bg: 'transparent',
      boxShadow: 'none',
      border: '1px solid',
      borderColor: borderColor,
    },
    elevated: {
      bg: bgColor,
      boxShadow: 'md',
      border: 'none',
    },
  };
  
  return (
    <Box
      borderRadius="lg"
      overflow="hidden"
      {...cardStyles[variant]}
      {...rest}
    >
      {/* 卡片標題 */}
      {(title || headerRight) && (
        <Flex
          px={6}
          py={4}
          borderBottomWidth={variant !== 'outline' ? '1px' : '0'}
          borderColor={borderColor}
          justify="space-between"
          align="center"
        >
          {title && (
            <Heading size="md" fontWeight="semibold">
              {title}
            </Heading>
          )}
          
          {headerRight && (
            <Box>{headerRight}</Box>
          )}
        </Flex>
      )}
      
      {/* 卡片內容 */}
      <Box px={6} py={6}>
        {children}
      </Box>
    </Box>
  );
};

export default Card;