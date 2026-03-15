import { createSlice } from '@reduxjs/toolkit';

// Initial state
const initialState = {
  sidebarOpen: false,
  theme: 'light',
  notifications: [],
  loading: {
    global: false,
    auth: false,
    users: false,
    roles: false,
    permissions: false,
    rolePermissions: false,
  },
  modals: {
    userModal: false,
    roleModal: false,
    permissionModal: false,
    rolePermissionModal: false,
    confirmModal: false,
  },
  confirmModal: {
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null,
  },
  toast: {
    isOpen: false,
    type: 'info', // success, error, warning, info
    message: '',
    duration: 3000,
  },
  search: {
    query: '',
    filters: {},
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
  },
};

// UI slice
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Sidebar actions
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    
    // Theme actions
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
    
    // Loading actions
    setLoading: (state, action) => {
      const { key, value } = action.payload;
      state.loading[key] = value;
    },
    setGlobalLoading: (state, action) => {
      state.loading.global = action.payload;
    },
    
    // Modal actions
    openModal: (state, action) => {
      const modalName = action.payload;
      state.modals[modalName] = true;
    },
    closeModal: (state, action) => {
      const modalName = action.payload;
      state.modals[modalName] = false;
    },
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach(key => {
        state.modals[key] = false;
      });
    },
    
    // Confirm modal actions
    openConfirmModal: (state, action) => {
      const { title, message, onConfirm, onCancel } = action.payload;
      state.confirmModal = {
        isOpen: true,
        title,
        message,
        onConfirm,
        onCancel,
      };
    },
    closeConfirmModal: (state) => {
      state.confirmModal = {
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        onCancel: null,
      };
    },
    
    // Toast actions
    showToast: (state, action) => {
      const { type = 'info', message, duration = 3000 } = action.payload;
      state.toast = {
        isOpen: true,
        type,
        message,
        duration,
      };
    },
    hideToast: (state) => {
      state.toast = {
        isOpen: false,
        type: 'info',
        message: '',
        duration: 3000,
      };
    },
    
    // Notification actions
    addNotification: (state, action) => {
      const notification = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        ...action.payload,
      };
      state.notifications.unshift(notification);
      
      // Keep only last 50 notifications
      if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50);
      }
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    markNotificationAsRead: (state, action) => {
      const notification = state.notifications.find(
        n => n.id === action.payload
      );
      if (notification) {
        notification.read = true;
      }
    },
    markAllNotificationsAsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.read = true;
      });
    },
    
    // Search actions
    setSearchQuery: (state, action) => {
      state.search.query = action.payload;
    },
    setSearchFilters: (state, action) => {
      state.search.filters = { ...state.search.filters, ...action.payload };
    },
    clearSearchFilters: (state) => {
      state.search.filters = {};
    },
    clearSearch: (state) => {
      state.search = {
        query: '',
        filters: {},
      };
    },
    
    // Pagination actions
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    setPage: (state, action) => {
      state.pagination.page = action.payload;
    },
    setLimit: (state, action) => {
      state.pagination.limit = action.payload;
    },
    resetPagination: (state) => {
      state.pagination = {
        page: 1,
        limit: 10,
        total: 0,
      };
    },
    
    // Reset UI state
    resetUI: (state) => {
      return {
        ...initialState,
        theme: state.theme, // Keep theme preference
      };
    },
  },
});

export const {
  // Sidebar
  toggleSidebar,
  setSidebarOpen,
  
  // Theme
  setTheme,
  toggleTheme,
  
  // Loading
  setLoading,
  setGlobalLoading,
  
  // Modals
  openModal,
  closeModal,
  closeAllModals,
  
  // Confirm modal
  openConfirmModal,
  closeConfirmModal,
  
  // Toast
  showToast,
  hideToast,
  
  // Notifications
  addNotification,
  removeNotification,
  clearNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  
  // Search
  setSearchQuery,
  setSearchFilters,
  clearSearchFilters,
  clearSearch,
  
  // Pagination
  setPagination,
  setPage,
  setLimit,
  resetPagination,
  
  // Reset
  resetUI,
} = uiSlice.actions;

export default uiSlice.reducer;