import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from '@reduxjs/toolkit';

// Import slices (removed userSlice - using NextAuth instead)
import roleSlice from './slices/roleSlice';
import permissionSlice from './slices/permissionSlice';
import rolePermissionSlice from './slices/rolePermissionSlice';
import userSlice from './slices/userSlice';
import uiSlice from './slices/uiSlice';

// Import admission portal slices
import employeeSlice from './slices/employeeSlice';
import studentSlice from './slices/studentSlice';
import applicationSlice from './slices/applicationSlice';
import paymentSlice from './slices/paymentSlice';
import examSlice from './slices/examSlice';
import settingsSlice from './slices/settingsSlice';
import departmentSlice from './slices/departmentSlice';

// Persist configuration
const persistConfig = {
  key: 'root',
  storage,
  // Persist all data slices for caching
  whitelist: [
    'users', 
    'roles', 
    'permissions', 
    'rolePermission',
    'employees', 
    'students', 
    'departments',
    'applications',
    'payment',
    'exam',
    'settings'
  ],
  blacklist: ['ui'], // Don't persist UI state
};

// Root reducer - Use plural names consistently
const rootReducer = combineReducers({
  roles: roleSlice,
  permissions: permissionSlice,
  rolePermission: rolePermissionSlice,
  users: userSlice,
  ui: uiSlice,
  // Admission portal reducers
  employees: employeeSlice,
  students: studentSlice,
  applications: applicationSlice,  // ← Changed from 'application' to 'applications'
  payment: paymentSlice,
  exam: examSlice,
  settings: settingsSlice,
  departments: departmentSlice,
});

// Persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// Persistor
export const persistor = persistStore(store);