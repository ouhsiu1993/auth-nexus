// src/components/forms/FormSelect.jsx
import {
    FormControl,
    FormLabel,
    Select,
    FormErrorMessage,
    FormHelperText,
  } from '@chakra-ui/react';
  import { useFormContext } from 'react-hook-form';
  
  /**
   * 表單下拉選單元件
   * @param {Object} props
   * @param {string} props.name - 欄位名稱
   * @param {string} props.label - 欄位標籤
   * @param {string} props.placeholder - 佔位文字
   * @param {Array} props.options - 選項陣列 [{ value, label }]
   * @param {string} props.helperText - 輔助文字
   */
  const FormSelect = ({
    name,
    label,
    placeholder,
    options = [],
    helperText,
    isRequired = false,
    isDisabled = false,
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
        
        <Select 
          id={name} 
          placeholder={placeholder}
          {...register(name)}
          {...rest}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        
        {helperText && !errorMessage && (
          <FormHelperText>{helperText}</FormHelperText>
        )}
        
        {errorMessage && (
          <FormErrorMessage>{errorMessage}</FormErrorMessage>
        )}
      </FormControl>
    );
  };
  
  export default FormSelect;