// API utility - use relative URLs since client and server are in same container

export const getApiBaseUrl = () => {
  // Use relative URLs - no protocol/domain needed
  return '';
};

// Helper function for making API requests  
export const apiRequest = async (endpoint, options = {}) => {
  const response = await fetch(endpoint, options);
  return response;
}; 