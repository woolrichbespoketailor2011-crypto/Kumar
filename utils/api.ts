/**
 * Utility to handle API requests with session persistence fallback for Safari/Iframes
 */
export const apiFetch = async (url: string, options: RequestInit = {}) => {
  const sessionId = localStorage.getItem('fintrack_sid');
  
  const headers = new Headers(options.headers || {});
  if (sessionId) {
    headers.set('X-Session-ID', sessionId);
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  return response;
};
