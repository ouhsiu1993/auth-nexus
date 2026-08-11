// src/components/ui/AlertMessage.jsx
import { Alert, AlertIcon, AlertTitle, AlertDescription, CloseButton } from '@chakra-ui/react';

/**
 * 警告訊息元件
 * @param {Object} props
 * @param {string} props.status - 狀態類型 (success, error, warning, info)
 * @param {string} props.title - 標題
 * @param {string} props.message - 訊息內容
 * @param {function} props.onClose - 關閉回調
 */
const AlertMessage = ({ 
  status = 'info', 
  title, 
  message, 
  onClose,
  mb = 4
}) => {
  return (
    <Alert 
      status={status} 
      variant="left-accent" 
      borderRadius="md" 
      mb={mb}
    >
      <AlertIcon />
      <div>
        {title && <AlertTitle mr={2}>{title}</AlertTitle>}
        {message && <AlertDescription>{message}</AlertDescription>}
      </div>
      {onClose && (
        <CloseButton 
          position="absolute" 
          right="8px" 
          top="8px" 
          onClick={onClose} 
        />
      )}
    </Alert>
  );
};

export default AlertMessage;