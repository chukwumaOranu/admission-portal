import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_ENDPOINTS, apiService } from '@/services/api';

// =====================================================
// ASYNC THUNKS - All permission functions
// =====================================================

// Fetch all permissions
export const fetchPermissions = createAsyncThunk(
  'permissions/fetchAll',
  async () => {
    const response = await apiService.get(API_ENDPOINTS.PERMISSIONS.GET_ALL);
    console.log('🔍 Permissions API Response:', response.data);
    // Controller returns: { success, message, data: { permissions, count } }
    return response.data.data?.permissions || response.data.permissions || [];
  }
);

// Create permission
export const createPermission = createAsyncThunk(
  'permissions/create',
  async (permissionData) => {
    const response = await apiService.post(API_ENDPOINTS.PERMISSIONS.CREATE, permissionData);
    return response.data.data?.permission || response.data.permission;
  }
);

// Update permission
export const updatePermission = createAsyncThunk(
  'permissions/update',
  async ({ id, data }) => {
    const response = await apiService.put(API_ENDPOINTS.PERMISSIONS.UPDATE(id), data);
    return response.data.data?.permission || response.data.permission;
  }
);

// Delete permission
export const deletePermission = createAsyncThunk(
  'permissions/delete',
  async (id) => {
    await apiService.delete(API_ENDPOINTS.PERMISSIONS.DELETE(id));
    return id;
  }
);

// Soft delete permission (deactivate)
export const softDeletePermission = createAsyncThunk(
  'permissions/softDelete',
  async (id) => {
    const response = await apiService.put(API_ENDPOINTS.PERMISSIONS.UPDATE(id), { is_active: false });
    return response.data.data?.permission || response.data.permission;
  }
);

// =====================================================
// SLICE - Simple state
// =====================================================

const permissionSlice = createSlice({
  name: 'permissions',
  initialState: {
    permissions: [],
    loading: false,
    error: null
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch permissions
      .addCase(fetchPermissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPermissions.fulfilled, (state, action) => {
        state.loading = false;
        state.permissions = action.payload;
      })
      .addCase(fetchPermissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      
      // Create permission
      .addCase(createPermission.fulfilled, (state, action) => {
        state.permissions.push(action.payload);
      })
      
      // Update permission
      .addCase(updatePermission.fulfilled, (state, action) => {
        const index = state.permissions.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.permissions[index] = action.payload;
        }
      })
      
      // Delete permission
      .addCase(deletePermission.fulfilled, (state, action) => {
        state.permissions = state.permissions.filter(p => p.id !== action.payload);
      })
      
      // Soft delete permission
      .addCase(softDeletePermission.fulfilled, (state, action) => {
        const index = state.permissions.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.permissions[index] = action.payload;
        }
      });
  }
});

export const { clearError } = permissionSlice.actions;
export default permissionSlice.reducer;
