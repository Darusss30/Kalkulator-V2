import axios from 'axios';
import toast from 'react-hot-toast';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
const API_TIMEOUT = parseInt(process.env.REACT_APP_API_TIMEOUT) || 10000;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
const getToken = () => {
  return localStorage.getItem('auth_token');
};

const setToken = (token) => {
  if (token) {
    localStorage.setItem('auth_token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    localStorage.removeItem('auth_token');
    delete api.defaults.headers.common['Authorization'];
  }
};

// Initialize token on app start
const initializeAuth = () => {
  const token = getToken();
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching for certain requests
    if (config.method === 'get' && config.preventCache) {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }
    
    // Log requests in development
    if (process.env.NODE_ENV === 'development') {
      // Request logging available but not used
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Log responses in development
    if (process.env.NODE_ENV === 'development') {
    }
    
    return response;
  },
  (error) => {
    // Log errors in development
    if (process.env.NODE_ENV === 'development') {
    }
    
    // Handle different error types
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          setToken(null);
          if (window.location.pathname !== '/login') {
            toast.error('Sesi Anda telah berakhir. Silakan login kembali.');
            window.location.href = '/login';
          }
          break;
          
        case 403:
          // Forbidden
          toast.error(data.message || 'Anda tidak memiliki akses untuk melakukan tindakan ini.');
          break;
          
        case 404:
          // Not found
          if (!error.config.suppressNotFoundError) {
            toast.error(data.message || 'Data yang dicari tidak ditemukan.');
          }
          break;
          
        case 422:
          // Validation error
          if (data.details && Array.isArray(data.details)) {
            data.details.forEach(detail => {
              toast.error(`${detail.param}: ${detail.msg}`);
            });
          } else {
            toast.error(data.message || 'Data yang dikirim tidak valid.');
          }
          break;
          
        case 429:
          // Rate limit exceeded
          const retryAfter = error.response.headers['retry-after'] || error.response.data?.retryAfter || 60;
          toast.error(`Terlalu banyak permintaan. Silakan coba lagi dalam ${retryAfter} detik.`);
          break;
          
        case 500:
          // Server error
          toast.error('Terjadi kesalahan pada server. Silakan coba lagi nanti.');
          break;
          
        default:
          // Other errors
          if (!error.config.suppressErrorToast) {
            toast.error(data.message || 'Terjadi kesalahan yang tidak diketahui.');
          }
      }
      
      return Promise.reject(error.response.data);
    } else if (error.request) {
      // Network error
      toast.error('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
      return Promise.reject({ error: 'Network Error', message: 'Unable to connect to server' });
    } else {
      // Other errors
      toast.error('Terjadi kesalahan yang tidak diketahui.');
      return Promise.reject({ error: 'Unknown Error', message: error.message });
    }
  }
);

// API Methods
export const apiService = {
  // Auth endpoints
  auth: {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    logout: () => api.post('/auth/logout'),
    getProfile: () => api.get('/auth/profile'),
    updateProfile: (profileData) => api.put('/auth/profile', profileData),
    changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
    verifyToken: () => api.get('/auth/verify'),
    
    // User management (admin only)
    getUsers: (params = {}) => api.get('/auth/users', { params }),
    resetUsersAutoIncrement: () => api.post('/auth/reset-auto-increment'),
    clearAllUsers: () => api.delete('/auth/clear-all-users'),
    getUsersAutoIncrementStatus: () => api.get('/auth/auto-increment-status'),
  },
  
  // Job categories and types
  jobs: {
    getCategories: (params = {}) => api.get('/jobs/categories', { params }),
    getCategory: (id) => api.get(`/jobs/categories/${id}`),
    createCategory: (categoryData) => api.post('/jobs/categories', categoryData),
    updateCategory: (id, categoryData) => api.put(`/jobs/categories/${id}`, categoryData),
    deleteCategory: (id) => api.delete(`/jobs/categories/${id}`),
    
    getJobTypes: (categoryId, params = {}) => api.get(`/jobs/types/${categoryId}`, { params }),
    getJobType: (id) => api.get(`/jobs/type/${id}`),
    createJobType: (jobTypeData) => api.post('/jobs/types/public', jobTypeData),
    updateJobType: (id, jobTypeData) => api.put(`/jobs/type/${id}/public`, jobTypeData),
    deleteJobType: (id, force = false) => api.delete(`/jobs/type/${id}${force ? '?force=true' : ''}`),
    
    // AUTO_INCREMENT reset functions
    resetCategoriesAutoIncrement: () => api.post('/jobs/categories/reset-auto-increment'),
    resetJobTypesAutoIncrement: () => api.post('/jobs/types/reset-auto-increment'),
    clearAllCategories: () => api.delete('/jobs/categories/clear-all'),
    clearAllJobTypes: () => api.delete('/jobs/types/clear-all'),
    getAutoIncrementStatus: () => api.get('/jobs/auto-increment-status'),
    bulkImportCategories: (categoriesData, updateExisting = false) => api.post('/jobs/categories/bulk-import', {
      categories_data: categoriesData,
      update_existing: updateExisting
    }),
  },
  
  // Materials
  materials: {
    getMaterials: (params = {}) => api.get('/materials', { params }),
    getMaterial: (id) => api.get(`/materials/${id}`),
    getMaterialsByJobType: (jobTypeId) => api.get(`/materials/job-type/${jobTypeId}`),
    createMaterial: (materialData) => api.post('/materials/public', materialData),
    updateMaterial: (id, materialData) => api.put(`/materials/${id}`, materialData),
    deleteMaterial: (id) => api.delete(`/materials/${id}`),
    
    // Reset AUTO_INCREMENT counter
    resetAutoIncrement: () => api.post('/materials/reset-auto-increment'),
    
    // Clear all materials and reset counter
    clearAllMaterials: () => api.delete('/materials/clear-all'),
    
    // Bulk import materials
    parsePastedData: (pastedData) => api.post('/materials/parse-paste', { pasted_data: pastedData }),
    bulkImport: (materialsData, updateExisting = false) => api.post('/materials/bulk-import', { 
      materials_data: materialsData, 
      update_existing: updateExisting 
    }),
    
    getLaborRates: (params = {}) => api.get('/materials/labor/rates', { params }),
    getLaborRate: (id) => api.get(`/materials/labor/${id}`),
    createLaborRate: (laborRateData) => api.post('/materials/labor', laborRateData),
    updateLaborRate: (id, laborRateData) => api.put(`/materials/labor/${id}`, laborRateData),
    deleteLaborRate: (id) => api.delete(`/materials/labor/${id}`),
    
    addMaterialToJobType: (jobTypeId, materialData) => api.post(`/materials/job-type/${jobTypeId}/materials`, materialData),
    removeMaterialFromJobType: (jobTypeId, materialId) => api.delete(`/materials/job-type/${jobTypeId}/materials/${materialId}`),
    
    // Master reset functions (admin only)
    masterResetAllAutoIncrement: (options = {}) => api.post('/materials/master/reset-all-auto-increment', options),
    getMasterAutoIncrementStatus: () => api.get('/materials/master/auto-increment-status'),
    masterClearAllData: (confirmClear = false) => api.delete('/materials/master/clear-all-data', { 
      data: { confirm_clear: confirmClear } 
    }),
  },
  
  // Calculations
  calculations: {
    calculate: (jobTypeId, calculationData) => api.post(`/calculations/${jobTypeId}`, calculationData),
    saveCalculation: (jobTypeId, calculationData) => api.post(`/calculations/${jobTypeId}/save`, calculationData),
    quickCalculate: (jobTypeId, calculationData) => api.post(`/calculations/quick/${jobTypeId}`, calculationData),
    getHistory: async (params = {}) => {
      const response = await api.get('/calculations/history', { params });
      return response.data; // Return only the data part for React Query
    },
    getCalculation: async (id) => {
      const response = await api.get(`/calculations/history/${id}`);
      return response.data;
    },
    updateCalculation: async (id, calculationData) => {
      const response = await api.put(`/calculations/history/${id}`, calculationData);
      return response.data;
    },
    duplicateCalculation: async (id, options = {}) => {
      const response = await api.post(`/calculations/history/${id}/duplicate`, options);
      return response.data;
    },
    deleteCalculation: (id) => api.delete(`/calculations/history/${id}`),
    deleteCalculationsBulk: (calculationIds) => api.delete('/calculations/history/bulk', { data: { calculation_ids: calculationIds } }),
    getStats: () => api.get('/calculations/stats'),
    
    // Admin functions
    getAllCalculations: (params = {}) => api.get('/calculations/admin/all', { params }),
    deleteCalculationAdmin: (id) => api.delete(`/calculations/admin/${id}`),
    resetCalculationsAutoIncrement: () => api.post('/calculations/reset-auto-increment'),
    clearAllCalculations: () => api.delete('/calculations/clear-all'),
    getCalculationsAutoIncrementStatus: () => api.get('/calculations/auto-increment-status'),
  },

  // Job Type Management
  jobTypeManagement: {
    getJobTypeDetails: (jobTypeId) => api.get(`/job-types/${jobTypeId}/details`),
    updateLaborAssignments: (jobTypeId, laborAssignments) => api.put(`/job-types/${jobTypeId}/labor`, { labor_assignments: laborAssignments }),
    updateMaterialAssignments: (jobTypeId, materialAssignments) => api.put(`/job-types/${jobTypeId}/materials`, { material_assignments: materialAssignments })
  },
};

// Utility functions
export const apiUtils = {
  // Format currency for display
  formatCurrency: (amount, currency = 'IDR') => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  },
  
  // Format number with thousand separators
  formatNumber: (number, decimals = 0) => {
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(number);
  },
  
  // Parse number from formatted string
  parseNumber: (formattedNumber) => {
    if (typeof formattedNumber === 'number') return formattedNumber;
    return parseFloat(formattedNumber.replace(/[^\d.-]/g, '')) || 0;
  },
  
  // Debounce function for search
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
  
  // Generate query string from object
  buildQueryString: (params) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        searchParams.append(key, value);
      }
    });
    return searchParams.toString();
  },
  
  // Download file from blob
  downloadFile: (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
  
  // Handle file upload
  uploadFile: (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });
  },
};

// Export token management functions
export { getToken, setToken, initializeAuth };

// Export axios instance for custom requests
export { api };

// Default export
export default apiService;
