// API Configuration for different environments
const config = {
  // Development environment (localhost)
  development: {
    baseURL: "http://localhost:5001/api",
    timeout: 15000,
  },

  // Production environment (aaPanel with NGINX proxy)
  production: {
    baseURL: "/api", // Relative path for NGINX proxy
    timeout: 15000,
  },

  // Docker environment
  docker: {
    baseURL: "/api", // Relative path for Docker proxy
    timeout: 15000,
  },
};

// Get current environment
const environment = process.env.NODE_ENV || "development";

// Export the appropriate configuration
export const apiConfig = config[environment] || config.development;

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
  return `${apiConfig.baseURL}${
    endpoint.startsWith("/") ? endpoint : `/${endpoint}`
  }`;
};

// Default export for axios configuration
export default apiConfig;
