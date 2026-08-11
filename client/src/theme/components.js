// src/theme/components.js
// Chakra UI 元件樣式覆蓋

const components = {
    Button: {
      baseStyle: {
        fontWeight: "500",
        borderRadius: "md",
      },
      variants: {
        primary: {
          bg: "brand.500",
          color: "white",
          _hover: {
            bg: "brand.600",
            _disabled: {
              bg: "brand.500",
            },
          },
        },
        secondary: {
          bg: "gray.200",
          color: "gray.800",
          _hover: {
            bg: "gray.300",
            _disabled: {
              bg: "gray.200",
            },
          },
        },
        danger: {
          bg: "error.500",
          color: "white",
          _hover: {
            bg: "error.700",
            _disabled: {
              bg: "error.500",
            },
          },
        },
      },
      defaultProps: {
        variant: "primary",
      },
    },
    Card: {
      baseStyle: {
        p: "6",
        bg: "white",
        borderRadius: "lg",
        boxShadow: "sm",
      },
    },
    Heading: {
      baseStyle: {
        fontWeight: "600",
      },
    },
    Input: {
      variants: {
        outline: {
          field: {
            borderColor: "gray.300",
            _hover: {
              borderColor: "gray.400",
            },
            _focus: {
              borderColor: "brand.500",
              boxShadow: "0 0 0 1px var(--chakra-colors-brand-500)",
            },
          },
        },
      },
      defaultProps: {
        variant: "outline",
      },
    },
  };
  
  export default components;