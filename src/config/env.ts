// Environment configuration
export const config = {
  development: {
    API_BASE_URL: 'http://192.168.144.235:8000/api',
  },
  production: {
    API_BASE_URL: 'https://api.yraytestings.com.ng/api',
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
export const API_BASE_URL = getCurrentConfig().API_BASE_URL; 
console.log(API_BASE_URL);