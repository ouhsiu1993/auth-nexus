// src/components/ui/DataTable.jsx - 固定欄位寬度，解決表格左右移動問題
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Box,
  Text,
  Flex,
  IconButton,
  Select,
  NumberInput,
  NumberInputField,
  useColorModeValue,
  Skeleton,
  HStack,
  Stack,
  Center,
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';

const DataTable = ({ 
  columns = [], 
  data = [], 
  isLoading = false,
  pagination = null,
  onPageChange,
  onLimitChange,
  emptyMessage = "沒有資料可以顯示",
  ...rest
}) => {
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const headerBg = useColorModeValue('gray.50', 'gray.800');

  // 確保所有列都有合理的固定寬度 - 避免表格跳動
  const normalizedColumns = columns.map(column => {
    // 複製列定義，避免修改原始對象
    const normalizedColumn = { ...column };
    
    // 根據列類型提供預設寬度，確保表格結構穩定
    if (!normalizedColumn.width) {
      switch (normalizedColumn.key) {
        case 'name':
        case 'tenantId':
          normalizedColumn.width = '180px';
          break;
        case 'email':
          normalizedColumn.width = '220px';
          break;
        case 'roles':
          normalizedColumn.width = '180px'; // 給角色欄位較寬的空間
          break;
        case 'isActive':
        case 'isVerified':
          normalizedColumn.width = '100px';
          break;
        case 'createdAt':
          normalizedColumn.width = '180px';
          break;
        default:
          // 根據列標題智能設置寬度
          if (normalizedColumn.header === '姓名' || normalizedColumn.header === '工作區名稱') {
            normalizedColumn.width = '180px';
          } else if (normalizedColumn.header === 'Email') {
            normalizedColumn.width = '220px';
          } else if (normalizedColumn.header === '角色') {
            normalizedColumn.width = '180px';
          } else if (normalizedColumn.header === '狀態' || normalizedColumn.header === '驗證') {
            normalizedColumn.width = '100px';
          } else if (normalizedColumn.header === '操作') {
            normalizedColumn.width = '100px';
          } else if (normalizedColumn.header === '建立時間') {
            normalizedColumn.width = '180px';
          } else {
            normalizedColumn.width = '120px'; // 默認寬度
          }
      }
    }
    
    // 同時設置最小寬度，確保內容收縮時不會低於這個值
    if (!normalizedColumn.minWidth) {
      normalizedColumn.minWidth = normalizedColumn.width;
    }
    
    return normalizedColumn;
  });

  // 載入中狀態處理
  if (isLoading) {
    return (
      <Box overflowX="auto" {...rest}>
        <Table variant="simple" size="md" tableLayout="fixed" width="100%">
          <Thead>
            <Tr>
              {normalizedColumns.map((column) => (
                <Th 
                  key={column.key || column.header}
                  width={column.width}
                  minWidth={column.minWidth}
                  maxWidth={column.maxWidth}
                  textAlign={column.align || 'left'}
                >
                  {column.header}
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {Array(5).fill(0).map((_, index) => (
              <Tr key={index}>
                {normalizedColumns.map((column, colIndex) => (
                  <Td 
                    key={colIndex}
                    width={column.width}
                    minWidth={column.minWidth}
                    maxWidth={column.maxWidth}
                    textAlign={column.align || 'left'}
                  >
                    <Skeleton height="20px" />
                  </Td>
                ))}
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    );
  }

  return (
    <Box 
      overflowX="auto"
      borderWidth="1px"
      borderRadius="lg"
      borderColor={borderColor}
      {...rest}
    >
      <Table 
        variant="simple" 
        size="md" 
        tableLayout="fixed" 
        width="100%"
      >
        {/* 表頭 - 永遠顯示 */}
        <Thead bg={headerBg}>
          <Tr>
            {normalizedColumns.map((column) => (
              <Th 
                key={column.key || column.header}
                textAlign={column.align || 'left'}
                width={column.width}
                minWidth={column.minWidth}
                maxWidth={column.maxWidth}
                overflow="hidden"
                textOverflow="ellipsis"
                whiteSpace="nowrap"
              >
                {column.header}
              </Th>
            ))}
          </Tr>
        </Thead>
        
        {/* 表體 - 根據是否有資料顯示不同內容 */}
        <Tbody>
          {(!data || data.length === 0) ? (
            <Tr>
              <Td colSpan={normalizedColumns.length}>
                <Center py={8}>
                  <Text color="gray.500">{emptyMessage}</Text>
                </Center>
              </Td>
            </Tr>
          ) : (
            data.map((row, rowIndex) => (
              <Tr 
                key={row.id || rowIndex}
                _hover={{ bg: hoverBg }}
                cursor={row.onClick ? 'pointer' : 'default'}
                onClick={() => row.onClick && row.onClick(row)}
              >
                {normalizedColumns.map((column, colIndex) => (
                  <Td 
                    key={colIndex}
                    textAlign={column.align || 'left'}
                    width={column.width}
                    minWidth={column.minWidth}
                    maxWidth={column.maxWidth}
                    overflow="hidden" 
                    textOverflow="ellipsis"
                  >
                    {column.render 
                      ? column.render(row, rowIndex)
                      : (() => {
                          const value = row[column.key];
                          if (value === null || value === undefined) return '—';
                          if (typeof value === 'object' && !Array.isArray(value)) {
                            try {
                              return JSON.stringify(value);
                            } catch (e) {
                              return '[物件]';
                            }
                          }
                          if (Array.isArray(value)) return value.join(', ');
                          return String(value);
                        })()}
                  </Td>
                ))}
              </Tr>
            ))
          )}
        </Tbody>
      </Table>

      {/* 分頁控制 - 只在有分頁數據的情況下顯示 */}
      {pagination && (
        <Stack
          px={4}
          py={3}
          borderTopWidth="1px"
          borderColor={borderColor}
          direction={{ base: 'column', md: 'row' }}
          align={{ base: 'flex-start', md: 'center' }}
          justify="space-between"
          spacing={3}
        >
          {/* 分頁信息 */}
          <Text fontSize="sm" color="gray.600">
            {data && data.length > 0 ? (
              `顯示 ${pagination.limit * (pagination.page - 1) + 1} 到 
              ${Math.min(pagination.limit * pagination.page, pagination.total)} 
              筆，共 ${pagination.total} 筆資料`
            ) : (
              `共 ${pagination.total} 筆資料`
            )}
          </Text>

          {/* 分頁控件 - 當沒有資料或總數為0時禁用 */}
          <HStack spacing={4} w={{ base: 'full', md: 'auto' }}>
            {/* 每頁顯示條數選擇器 - 調整標籤寬度避免換行 */}
            {onLimitChange && (
              <Flex align="center" whiteSpace="nowrap">
                <Text fontSize="sm" mr={1} width="60px" flexShrink={0}>每頁顯示:</Text>
                <Select
                  size="sm"
                  value={pagination.limit}
                  onChange={(e) => onLimitChange(Number(e.target.value))}
                  w="60px"
                  ml={1}
                  isDisabled={pagination.total === 0}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </Select>
              </Flex>
            )}

            {/* 頁碼導航 */}
            <Flex align="center" ml={{ base: 'auto', md: 0 }}>
              <IconButton
                size="sm"
                variant="ghost"
                icon={<ChevronLeftIcon />}
                isDisabled={pagination.page <= 1 || pagination.total === 0}
                onClick={() => onPageChange(pagination.page - 1)}
                aria-label="上一頁"
              />
              <NumberInput
                size="sm"
                w="50px"
                mx={2}
                min={1}
                max={pagination.totalPages || 1}
                value={pagination.page}
                onChange={(valueString) => {
                  const page = parseInt(valueString);
                  if (!isNaN(page) && page >= 1 && page <= (pagination.totalPages || 1)) {
                    onPageChange(page);
                  }
                }}
                hideSteppers={true}
                isDisabled={pagination.total === 0}
              >
                <NumberInputField textAlign="center" px={1} />
              </NumberInput>
              <Text fontSize="sm" mx={1}>/ {pagination.totalPages || 1}</Text>
              <IconButton
                size="sm"
                variant="ghost"
                icon={<ChevronRightIcon />}
                isDisabled={pagination.page >= (pagination.totalPages || 1) || pagination.total === 0}
                onClick={() => onPageChange(pagination.page + 1)}
                aria-label="下一頁"
              />
            </Flex>
          </HStack>
        </Stack>
      )}
    </Box>
  );
};

export default DataTable;