// src/components/ui/DashboardCard.jsx
import { Box, Flex, Text, Stat, StatLabel, StatNumber, StatHelpText, useColorModeValue, Icon } from '@chakra-ui/react';

/**
 * 儀表板卡片元件
 * @param {Object} props
 * @param {React.ElementType} props.icon - 卡片圖標
 * @param {string} props.iconColor - 圖標顏色
 * @param {string} props.label - 卡片標籤
 * @param {string|number} props.value - 卡片數值
 * @param {string} props.helpText - 輔助文字
 * @param {string} props.valueColor - 數值顏色
 */
const DashboardCard = ({
  icon,
  iconColor = 'brand.500',
  label,
  value,
  helpText,
  valueColor,
  ...rest
}) => {
  // 顏色設定
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  return (
    <Box
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      p={5}
      boxShadow="sm"
      transition="all 0.3s"
      _hover={{ boxShadow: 'md', transform: 'translateY(-2px)' }}
      {...rest}
    >
      <Stat>
        <Flex align="center" mb={2}>
          {icon && <Icon as={icon} fontSize="xl" color={iconColor} mr={2} />}
          <StatLabel fontSize="sm" color="gray.500">{label}</StatLabel>
        </Flex>
        <StatNumber 
          fontSize="3xl" 
          fontWeight="bold"
          color={valueColor}
          mt={1}
        >
          {value}
        </StatNumber>
        {helpText && (
          <StatHelpText fontSize="sm" mt={2}>
            {helpText}
          </StatHelpText>
        )}
      </Stat>
    </Box>
  );
};

export default DashboardCard;