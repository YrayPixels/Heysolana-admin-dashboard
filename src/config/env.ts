// Environment configuration
export const config = {
  development: {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  },
  production: {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  },
} as const;

// Get current environment
const getEnvironment = (): 'development' | 'production' => {
  // Check if we're in development mode
  console.log(import.meta.env.DEV);
  if (import.meta.env.DEV) {
    return 'development';
  }
  
  // Check Vite environment variable
  const nodeEnv = import.meta.env.VITE_NODE_ENV;
  if (nodeEnv === 'production') {
    return 'production';
  }
  
  // Default to development
  return 'development';
};

// Get current configuration
export const getCurrentConfig = () => {
  const env = getEnvironment();
  console.log(env);
  return {
    ...config[env],
    environment: env,
  };
};

// Export the current API base URL
// export const API_BASE_URL = getCurrentConfig().API_BASE_URL; 
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
console.log(API_BASE_URL);