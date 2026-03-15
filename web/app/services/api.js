import axios from 'axios';
import { getSession } from 'next-auth/react';

// Create axios instance with base configuration
const getBaseURL = () => {
  // Check if we're in production
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_API_URL || 'https://api.deepflux.com';
  }
  // Development
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true, // Important for cookies/sessions
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth headers and handle requests
api.interceptors.request.use(
  async (config) => {
    // Log API requests for debugging
    if (config.url?.includes('/applications/')) {
      console.log('📤 Frontend API Request:', config.method?.toUpperCase(), config.baseURL + config.url);
    }
    
    // Add NextAuth.js JWT token to Authorization header
    try {
      const session = await getSession();
      if (session?.accessToken) {
        config.headers.Authorization = `Bearer ${session.accessToken}`;
      }
    } catch (error) {
      // Silent fail - no session available
    }
    
    // For FormData requests, remove the default Content-Type header
    // so that axios can automatically set it to multipart/form-data
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle responses and errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Better error logging
    if (error.response) {
      console.error('Response Error:', error.response.status, error.response.data);
      
      // Log specific auth/permission errors
      if (error.response.status === 401) {
        console.log('🔐 [API] Authentication failed - middleware will handle redirect');
      }
      if (error.response.status === 403) {
        console.log('⛔ [API] Permission denied for this request');
      }
    } else if (error.request) {
      console.error('Request Error: No response received. Server might not be running.');
    } else {
      console.error('Error:', error.message);
    }
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      // Unauthorized (expired/invalid token) - redirect to login
      // But don't redirect if we're already on the login page to avoid infinite loops
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        console.log('🔐 [API] Authentication failed - redirecting to login');
        
        // Clear any stored auth data
        localStorage.removeItem('persist:user');
        sessionStorage.clear();
        
        // Clear the token cookie to trigger middleware on next navigation
        document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        
        // Redirect to login page
        window.location.href = '/login';
      } else {
        // Already on login page, just log the error
        console.log('🔐 [API] Authentication failed (already on login page)');
      }
    }
    
    if (error.response?.status === 500) {
      // Server error
      console.error('Server error occurred');
    }
    
    return Promise.reject(error);
  }
);

// API endpoints configuration
export const API_ENDPOINTS = {
  // User endpoints
  USERS: {
    REGISTER: '/users/register',
    LOGIN: '/users/login',
    LOGOUT: '/users/logout',
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    CHANGE_PASSWORD: '/users/change-password',
    DELETE_ACCOUNT: '/users/account',
    CHECK_AUTH: '/users/check-auth',
    GET_ALL: '/users',
    GET_BY_ID: (id) => `/users/${id}`,
    CREATE: '/users',
    UPDATE: (id) => `/users/${id}`,
    DELETE: (id) => `/users/${id}`,
  },
  
  // Role endpoints
  ROLES: {
    GET_ALL: '/roles',
    GET_BY_ID: (id) => `/roles/${id}`,
    CREATE: '/roles/create',
    UPDATE: (id) => `/roles/${id}`,
    DELETE: (id) => `/roles/${id}`,
  },
  
  // Permission endpoints
  PERMISSIONS: {
    GET_ALL: '/permissions',
    GET_BY_ID: (id) => `/permissions/${id}`,
    CREATE: '/permissions',
    UPDATE: (id) => `/permissions/${id}`,
    DELETE: (id) => `/permissions/${id}`,
  },
  
  // Role Permission endpoints
  ROLE_PERMISSIONS: {
    GET_ALL: '/role-permissions',
    GET_BY_ROLE: (roleId) => `/role-permissions/role/${roleId}/permissions`,
    GET_BY_PERMISSION: (permissionId) => `/role-permissions/permission/${permissionId}/roles`,
    CREATE: '/role-permissions',
    CHECK: (roleId, permissionId) => `/role-permissions/check/${roleId}/${permissionId}`,
    DELETE: (roleId, permissionId) => `/role-permissions/${roleId}/${permissionId}`,
    DELETE_BY_ASSIGNMENT: '/role-permissions/by-assignment',
    DELETE_ALL_FROM_ROLE: (roleId) => `/role-permissions/role/${roleId}`,
    ASSIGN_PERMISSIONS: (roleId) => `/role-permissions/role/${roleId}/assign-permissions`,
    REMOVE_PERMISSIONS: (roleId) => `/role-permissions/role/${roleId}/remove-permissions`,
    REPLACE_PERMISSIONS: (roleId) => `/role-permissions/role/${roleId}/replace-permissions`,
    STATS: '/role-permissions/statistics',
  },
  
  // User Role endpoints
  USER_ROLES: {
    GET_ALL: '/user-roles',
    GET_BY_USER_ID: (userId) => `/user-roles/user/${userId}/roles`,
    GET_BY_ROLE_ID: (roleId) => `/user-roles/role/${roleId}/users`,
    ASSIGN: '/user-roles/assign',
    REMOVE: (userId, roleId) => `/user-roles/${userId}/${roleId}`,
    REMOVE_ALL_FROM_USER: (userId) => `/user-roles/user/${userId}`,
    CHECK: (userId, roleId) => `/user-roles/check/${userId}/${roleId}`,
    GET_USER_PERMISSIONS: (userId) => `/user-roles/user/${userId}/permissions`,
    CHECK_USER_PERMISSION: (userId, permissionName) => `/user-roles/user/${userId}/permission/${permissionName}`,
  },

  // ==================== ADMISSION PORTAL ENDPOINTS ====================

  // Employee endpoints
  EMPLOYEES: {
    SCHEMAS: {
      GET_ALL: '/employees/schemas',
      GET_BY_ID: (id) => `/employees/schemas/${id}`,
      CREATE: '/employees/schemas',
      UPDATE: (id) => `/employees/schemas/${id}`,
      DELETE: (id) => `/employees/schemas/${id}`,
      FIELDS: {
        GET_ALL: (schemaId) => `/employees/schemas/${schemaId}/fields`,
        CREATE: (schemaId) => `/employees/schemas/${schemaId}/fields`,
        UPDATE: (schemaId, fieldId) => `/employees/schemas/${schemaId}/fields/${fieldId}`,
        DELETE: (schemaId, fieldId) => `/employees/schemas/${schemaId}/fields/${fieldId}`,
      },
      DUPLICATE: (id) => `/employees/schemas/${id}/duplicate`,
      STATS: '/employees/schemas/stats',
    },
    GET_ALL: '/employees',
    GET_BY_ID: (id) => `/employees/${id}`,
    CREATE: '/employees',
    UPDATE: (id) => `/employees/${id}`,
    DELETE: (id) => `/employees/${id}`,
    STATS: '/employees/stats',
    DEPARTMENTS: '/employees/departments',
    UPLOAD_PROFILE: (id) => `/employees/${id}/upload-photo`,
    CREATE_LOGIN: (id) => `/employees/${id}/create-login`,
  },

  // Department endpoints
  DEPARTMENTS: {
    GET_ALL: '/departments',
    GET_BY_ID: (id) => `/departments/${id}`,
    CREATE: '/departments',
    UPDATE: (id) => `/departments/${id}`,
    DELETE: (id) => `/departments/${id}`,
    STATS: '/departments/stats/overview',
    EMPLOYEES: (id) => `/departments/${id}/employees`,
  },

  // Student endpoints
  STUDENTS: {
    SCHEMAS: {
      GET_ALL: '/students/schemas',
      GET_BY_ID: (id) => `/students/schemas/${id}`,
      CREATE: '/students/schemas',
      UPDATE: (id) => `/students/schemas/${id}`,
      DELETE: (id) => `/students/schemas/${id}`,
      FIELDS: {
        GET_ALL: (schemaId) => `/students/schemas/${schemaId}/fields`,
        CREATE: (schemaId) => `/students/schemas/${schemaId}/fields`,
        DELETE: (fieldId) => `/students/fields/${fieldId}`,
      },
    },
    GET_ME: '/students/me', // Get current student's own profile
    GENERATE_ID: '/students/generate-id',
    GET_ALL: '/students',
    GET_BY_ID: (id) => `/students/${id}`,
    CREATE: '/students',
    UPDATE: (id) => `/students/${id}`,
    DELETE: (id) => `/students/${id}`,
    BULK_CREATE: '/students/bulk-create', // ✅ CSV import with custom fields
    STATS: '/students/stats/overview',
    CREATE_LOGIN: (id) => `/students/${id}/create-login`,
    SEND_LOGINS_BULK: '/students/send-logins/bulk',
  },

  // Application endpoints
  APPLICATIONS: {
    SCHEMAS: {
      GET_ALL: '/applications/schemas',
      GET_BY_ID: (id) => `/applications/schemas/${id}`,
      CREATE: '/applications/schemas',
      UPDATE: (id) => `/applications/schemas/${id}`,
      DELETE: (id) => `/applications/schemas/${id}`,
      FIELDS: {
        GET_ALL: (schemaId) => `/applications/schemas/${schemaId}/fields`,
        CREATE: (schemaId) => `/applications/schemas/${schemaId}/fields`,
        UPDATE: (schemaId, fieldId) => `/applications/schemas/${schemaId}/fields/${fieldId}`,
        DELETE: (schemaId, fieldId) => `/applications/schemas/${schemaId}/fields/${fieldId}`,
      },
      DUPLICATE: (id) => `/applications/schemas/${id}/duplicate`,
      STATS: '/applications/schemas/stats',
    },
    GET_ALL: '/applications',
    GET_MY: '/applications/my', // Get current user's applications
    GET_BY_ID: (id) => `/applications/${id}`, // Get single application by ID
    CREATE: '/applications/create',
    UPDATE: (id) => `/applications/${id}`,
    DELETE: (id) => `/applications/${id}`,
    SUBMIT: (id) => `/applications/${id}/submit`,
    UPDATE_STATUS: (id) => `/applications/${id}/status`,
    UPDATE_PAYMENT_STATUS: (id) => `/applications/${id}/payment-status`,
    STATS: '/applications/stats',
    UPLOAD_PASSPORT: (id) => `/applications/${id}/passport-photo`,
    REQUEST_INFO: (id) => `/applications/${id}/request-info`,
    SEND_ACCEPTANCE_LETTER: (id) => `/applications/${id}/send-acceptance-letter`,
    SEND_REJECTION_LETTER: (id) => `/applications/${id}/send-rejection-letter`,
    GENERATE_ADMISSION_LETTER: (id) => `/applications/${id}/generate-admission-letter`,
    APPEAL: (id) => `/applications/${id}/appeal`,
    // Exam assignment management
    ASSIGN_EXAM: '/applications/assign-exam',
    SELECT_EXAM_DATE: (id) => `/applications/${id}/select-exam-date`,
    UPDATE_EXAM_ASSIGNMENT: (id) => `/applications/${id}/exam-assignment`,
    REMOVE_EXAM_ASSIGNMENT: '/applications/remove-exam-assignment',
    EXAM_ASSIGNMENT_STATS: '/applications/exam-assignment/stats',
    ADMISSION: {
      SUBJECTS: '/applications/admission/subjects',
      BENCHMARK: '/applications/admission/benchmark',
      SCORES: (applicantId) => `/applications/admission/scores/${applicantId}`,
      RESULT: (applicantId) => `/applications/admission/results/${applicantId}`,
      SUCCESSFUL: '/applications/admission/successful',
      DECISION: (applicantId) => `/applications/admission/decision/${applicantId}`,
      LETTER_DOWNLOAD: (applicantId) => `/applications/admission/letters/${applicantId}/download`,
      LETTER_SEND: '/applications/admission/letters/send',
    },
  },

  // Payment endpoints
  PAYMENTS: {
    INITIALIZE: '/payments/initialize',
    VERIFY: (reference) => `/payments/verify/${reference}`,
    WEBHOOK: '/payments/webhook',
    GET_ALL: '/payments/transactions',
    GET_MY: '/payments/transactions/my',
    GET_BY_ID: (id) => `/payments/transactions/${id}`,
    GET_BY_APPLICANT: (applicantId) => `/payments/transactions/applicant/${applicantId}`,
    UPDATE: (id) => `/payments/transactions/${id}`,
    DELETE: (id) => `/payments/transactions/${id}`,
    STATS: '/payments/stats/overview',
    OVERVIEW: '/payments/dashboard/overview',
  },

  // Exam endpoints
  EXAMS: {
    ENTRY_DATES: {
      GET_ALL: '/exams/entry-dates',
      GET_BY_ID: (id) => `/exams/entry-dates/${id}`,
      CREATE: '/exams/entry-dates',
      UPDATE: (id) => `/exams/entry-dates/${id}`,
      DELETE: (id) => `/exams/entry-dates/${id}`,
      AVAILABLE: '/exams/entry-dates/available',
      AVAILABLE_LIST: '/exams/entry-dates/available/list',
      STATS: '/exams/entry-dates/stats',
      CALENDAR_AVAILABILITY: '/exams/entry-dates/calendar/availability',
    },
    CARDS: {
      GET_ALL: '/exams/cards',
      GET_BY_ID: (id) => `/exams/cards/${id}`,
      CREATE: '/exams/cards',
      UPDATE: (id) => `/exams/cards/${id}`,
      DELETE: (id) => `/exams/cards/${id}`,
      PRINT: (id) => `/exams/cards/${id}/mark-printed`,
      DOWNLOAD: (applicantId) => `/exams/cards/generate/${applicantId}`,
      STATS: '/exams/cards/stats',
      BY_APPLICANT: (applicantId) => `/exams/cards/applicant/${applicantId}`,
      BY_ENTRY_DATE: (entryDateId) => `/exams/cards/entry-date/${entryDateId}`,
    },
  },

  // Settings endpoints
  SETTINGS: {
    SCHOOL: {
      GET: '/settings/school',
      UPDATE: '/settings/school',
    },
    UPLOADS: {
      GET_ALL: '/settings/files',
      GET_BY_ID: (id) => `/settings/files/${id}`,
      CREATE: '/settings/files',
      UPDATE: (id) => `/settings/files/${id}`,
      DELETE: (id) => `/settings/files/${id}`,
      STATS: '/settings/files/stats/overview',
      BY_CATEGORY: (category) => `/settings/files/category/${category}`,
      UPDATE_SETTINGS: '/settings/files/settings',
      UPLOAD_LOGO: '/settings/upload/logo',
      UPLOAD_FAVICON: '/settings/upload/favicon',
    },
    SYSTEM: {
      GET: '/settings/system',
      UPDATE: '/settings/system',
      RESET: '/settings/system/reset',
    },
    EMAIL: {
      GET: '/settings/email',
      UPDATE: '/settings/email',
      TEST: '/settings/email/test',
    },
    SECURITY: {
      GET: '/settings/security',
      UPDATE: '/settings/security',
      RESET: '/settings/security/reset',
    },
    TEMPLATES: {
      LIST: '/settings/templates',
      ACTIVE: (templateKey) => `/settings/templates/active/${templateKey}`,
      CREATE: '/settings/templates',
      UPDATE: (id) => `/settings/templates/${id}`,
      ACTIVATE: (id) => `/settings/templates/${id}/activate`,
      PREVIEW: (id) => `/settings/templates/${id}/preview`,
    },
  },
};

// Helper functions for common HTTP methods
export const apiService = {
  // GET request
  get: async (url, config = {}) => {
    try {
      const response = await api.get(url, config);
      return response.data;
    } catch (error) {
      // Better error handling - preserve full error object
      console.error('❌ apiService.get caught error:', {
        url,
        hasResponse: !!error.response,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        errorType: error.constructor.name
      });
      
      // Build error object with guaranteed message
      const errorData = error.response?.data || {};
      const errorMessage = errorData.message || 
                          error.response?.statusText || 
                          error.message || 
                          `Request failed: ${url}`;
      
      const errorToThrow = {
        message: errorMessage,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: url,
        data: errorData,
        originalError: {
          code: error.code,
          message: error.message
        }
      };
      
      console.error('❌ apiService.get throwing error:', errorToThrow);
      throw errorToThrow;
    }
  },

  // POST request
  post: async (url, data = {}, config = {}) => {
    try {
      const response = await api.post(url, data, config);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // PUT request
  put: async (url, data = {}, config = {}) => {
    try {
      const response = await api.put(url, data, config);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // DELETE request
  delete: async (url, config = {}) => {
    try {
      const response = await api.delete(url, config);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // PATCH request
  patch: async (url, data = {}, config = {}) => {
    try {
      const response = await api.patch(url, data, config);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// Export the configured axios instance
export default api;

// Export API_URL for direct fetch calls
export const API_URL = getBaseURL();
