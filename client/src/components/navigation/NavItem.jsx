// src/components/navigation/NavItem.jsx - 零動畫時間版本
import { Flex, Icon, Text, useColorModeValue, Box } from '@chakra-ui/react';
import { Link } from 'react-router-dom';

const NavItem = ({ 
  icon, 
  label, 
  path, 
  isActive, 
  onClick, 
  color,
  justifyContent = "flex-start", 
  showLabelOnHover = true,
  showLabel = true // 控制標籤顯示
}) => {
  // 顏色設定
  const activeBg = useColorModeValue('brand.50', 'brand.900');
  const activeColor = useColorModeValue('brand.700', 'brand.200');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const textColor = color || useColorModeValue('gray.700', 'gray.200');
  
  // 內容元件 - 固定高度為 45px - 移除所有過渡動畫
  const ItemContent = (
    <Flex
      align="center"
      px={4}
      py={3}
      height="45px" // 固定高度
      minHeight="45px" // 確保最小高度
      maxHeight="45px" // 確保最大高度
      cursor="pointer"
      role="group"
      borderRadius="md"
      fontWeight={isActive ? 'semibold' : 'medium'}
      bg={isActive ? activeBg : 'transparent'}
      color={isActive ? activeColor : textColor}
      _hover={{
        bg: isActive ? activeBg : hoverBg,
      }}
      transition="none" // 移除過渡效果
      onClick={onClick}
      position="relative" // 重要：使用相對定位
      className="nav-item-container" // 添加一個固定的 class 便於調試
    >
      {/* 始終保持圖標在相同位置（居中） */}
      <Box
        width="24px" // 固定圖標容器寬度
        display="flex"
        justifyContent="center"
        alignItems="center"
        ml={!label || !showLabel ? "auto" : "0"} // 收合時圖標居中
        mr={!label || !showLabel ? "auto" : "3"} // 展開時保持右邊距
      >
        {icon && (
          <Icon
            fontSize="lg"
            as={icon}
            _groupHover={{
              color: isActive ? activeColor : textColor,
            }}
            className="nav-item-icon"
            boxSize="1em" // 確保固定大小
          />
        )}
      </Box>
      
      {/* 文字使用絕對定位，使其不影響圖標位置 - 移除過渡動畫 */}
      {label && (
        <Text 
          fontSize="sm"
          transition="none" // 移除過渡效果
          className="nav-item-label"
          ml={3} // 與圖標保持間距
          style={{ 
            opacity: showLabel ? 1 : 0,
            // 移除 transform 過渡效果
          }}
          flexShrink={0} // 防止文字壓縮
          display={showLabel ? "block" : "none"} // 使用顯示/隱藏代替過渡
        >
          {label}
        </Text>
      )}
    </Flex>
  );
  
  // 如果有路徑，則使用 Link 元件包裝
  if (path) {
    return <Link to={path}>{ItemContent}</Link>;
  }
  
  // 否則，直接返回元件（用於登出等操作）
  return ItemContent;
};

export default NavItem;