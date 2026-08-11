// src/components/forms/FormInput.jsx
import {
    FormControl,
    FormLabel,
    Input,
    FormErrorMessage,
    FormHelperText,
    InputGroup,
    InputLeftElement,
    InputRightElement,
  } from '@chakra-ui/react';
  import { useFormContext } from 'react-hook-form';
  
  /**
   * 表單輸入框元件
   * @param {Object} props
   * @param {string} props.name - 欄位名稱
   * @param {string} props.label - 欄位標籤
   * @param {string} props.placeholder - 佔位文字
   * @param {string} props.type - 輸入框類型
   * @param {string} props.helperText - 輔助文字
   * @param {React.ReactNode} props.leftElement - 左側元素
   * @param {React.ReactNode} props.rightElement - 右側元素
   */
  const FormInput = ({
    name,
    label,
    placeholder,
    type = 'text',
    helperText,
    isRequired = false,
    isDisabled = false,
    isReadOnly = false,
    leftElement,
    rightElement,
    ...rest
  }) => {
    // 取得 React Hook Form 表單上下文
    const {
      register,
      formState: { errors },
    } = useFormContext();
    
    // 取得錯誤訊息
    const errorMessage = errors[name]?.message;
    
    return (
      <FormControl 
        isInvalid={!!errorMessage} 
        isRequired={isRequired}
        isDisabled={isDisabled}
        mb={4}
      >
        {label && <FormLabel htmlFor={name}>{label}</FormLabel>}
        
        <InputGroup>
          {leftElement && <InputLeftElement pointerEvents="none" children={leftElement} />}
          
          <Input
            id={name}
            placeholder={placeholder}
            type={type}
            {...register(name)}
            readOnly={isReadOnly}
            pl={leftElement ? 10 : undefined}
            pr={rightElement ? 10 : undefined}
            {...rest}
          />
          
          {rightElement && <InputRightElement children={rightElement} />}
        </InputGroup>
        
        {helperText && !errorMessage && (
          <FormHelperText>{helperText}</FormHelperText>
        )}
        
        {errorMessage && (
          <FormErrorMessage>{errorMessage}</FormErrorMessage>
        )}
      </FormControl>
    );
  };
  
  export default FormInput;