import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_ENDPOINTS, apiService } from '@/services/api';

// =====================================================
// ASYNC THUNKS - All role permission functions
// =====================================================

// Get all role permissions
export const fetchAllRolePermissions = createAsyncThunk(
  'rolePermissions/fetchAll',
  async () => {
    const response = await apiService.get(API_ENDPOINTS.ROLE_PERMISSIONS.GET_ALL);
    console.log('🔍 All Role Permissions API Response:', response.data);
    // Controller returns: { success, message, data: { rolePermissions, count } }
    return response.data.data?.rolePermissions || response.data.rolePermissions || [];
  }
);

// Get permissions by role
export const fetchRolePermissions = createAsyncThunk(
  'rolePermissions/fetchByRole',
  async (roleId) => {
    const response = await apiService.get(API_ENDPOINTS.ROLE_PERMISSIONS.GET_BY_ROLE(roleId));
    console.log('🔍 Role Permissions API Response:', response.data);
    // Controller returns: { success, message, data: { role_id, permissions } }
    return response.data.data?.permissions || response.data.permissions || [];
  }
);

// Get roles by permission
export const fetchRolesByPermission = createAsyncThunk(
  'rolePermissions/fetchRolesByPermission',
  async (permissionId) => {
    const response = await apiService.get(API_ENDPOINTS.ROLE_PERMISSIONS.GET_BY_PERMISSION(permissionId));
    console.log('🔍 Roles by Permission API Response:', response.data);
    // Controller returns: { success, message, data: { permission_id, roles } }
    return response.data.data?.roles || response.data.roles || [];
  }
);

// Create single role permission
export const createRolePermission = createAsyncThunk(
  'rolePermissions/create',
  async ({ roleId, permissionId }) => {
    const response = await apiService.post(API_ENDPOINTS.ROLE_PERMISSIONS.CREATE, {
      role_id: roleId,
      permission_id: permissionId
    });
    // Controller returns: { success, message, data: { rolePermission } }
    return response.data.data?.rolePermission || response.data.rolePermission;
  }
);

// Assign multiple permissions to role
export const assignPermissionsToRole = createAsyncThunk(
  'rolePermissions/assign',
  async ({ roleId, permissionIds }) => {
    const response = await apiService.post(
      API_ENDPOINTS.ROLE_PERMISSIONS.ASSIGN_PERMISSIONS(roleId),
      { permission_ids: permissionIds }
    );
    // Controller returns: { success, message, data: { createdAssignments, errors } }
    return response.data;
  }
);

// Remove permissions from role
export const removePermissionsFromRole = createAsyncThunk(
  'rolePermissions/removeMultiple',
  async ({ roleId, permissionIds }) => {
    const response = await apiService.post(
      API_ENDPOINTS.ROLE_PERMISSIONS.REMOVE_PERMISSIONS(roleId),
      { permission_ids: permissionIds }
    );
    // Controller returns: { success, message, data: { deletedAssignments, errors } }
    return response.data;
  }
);

// Replace all permissions for role
export const replaceRolePermissions = createAsyncThunk(
  'rolePermissions/replace',
  async ({ roleId, permissionIds }) => {
    const response = await apiService.post(
      API_ENDPOINTS.ROLE_PERMISSIONS.REPLACE_PERMISSIONS(roleId),
      { permission_ids: permissionIds }
    );
    // Controller returns: { success, message, data: { removed, added, summary } }
    return response.data;
  }
);

// Remove single permission from role
export const removePermissionFromRole = createAsyncThunk(
  'rolePermissions/remove',
  async ({ roleId, permissionId }) => {
    await apiService.delete(API_ENDPOINTS.ROLE_PERMISSIONS.DELETE(roleId, permissionId));
    return { roleId, permissionId };
  }
);

// Remove all permissions from role
export const removeAllPermissionsFromRole = createAsyncThunk(
  'rolePermissions/removeAll',
  async (roleId) => {
    await apiService.delete(API_ENDPOINTS.ROLE_PERMISSIONS.DELETE_ALL_FROM_ROLE(roleId));
    return { roleId };
  }
);

// Check if role has permission
export const checkRolePermission = createAsyncThunk(
  'rolePermissions/check',
  async ({ roleId, permissionId }) => {
    const response = await apiService.get(API_ENDPOINTS.ROLE_PERMISSIONS.CHECK(roleId, permissionId));
    return response.data;
  }
);

// Bulk create role permissions
export const bulkCreateRolePermissions = createAsyncThunk(
  'rolePermissions/bulkCreate',
  async (assignments) => {
    const response = await apiService.post(API_ENDPOINTS.ROLE_PERMISSIONS.CREATE, { assignments });
    // Controller returns: { success, message, data: { createdAssignments, errors } }
    return response.data;
  }
);

// Bulk delete role permissions
export const bulkDeleteRolePermissions = createAsyncThunk(
  'rolePermissions/bulkDelete',
  async (assignments) => {
    const response = await apiService.delete(API_ENDPOINTS.ROLE_PERMISSIONS.DELETE_BY_ASSIGNMENT, { 
      data: { assignments } 
    });
    // Controller returns: { success, message, data: { deletedAssignments, errors } }
    return response.data;
  }
);

// Get role permission statistics
export const fetchRolePermissionStats = createAsyncThunk(
  'rolePermissions/fetchStats',
  async () => {
    const response = await apiService.get(API_ENDPOINTS.ROLE_PERMISSIONS.STATS);
    console.log('🔍 Role Permission Stats API Response:', response.data);
    return response.data.data?.statistics || response.data.statistics || response.data;
  }
);

// =====================================================
// SLICE - Simple state
// =====================================================

const rolePermissionSlice = createSlice({
  name: 'rolePermissions',
  initialState: {
    rolePermissions: [],
    permissions: [],
    roles: [],
    stats: null,
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
      // Fetch all role permissions
      .addCase(fetchAllRolePermissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllRolePermissions.fulfilled, (state, action) => {
        state.loading = false;
        state.rolePermissions = action.payload;
      })
      .addCase(fetchAllRolePermissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      
      // Fetch permissions by role
      .addCase(fetchRolePermissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRolePermissions.fulfilled, (state, action) => {
        state.loading = false;
        state.permissions = action.payload;
      })
      .addCase(fetchRolePermissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      
      // Fetch roles by permission
      .addCase(fetchRolesByPermission.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRolesByPermission.fulfilled, (state, action) => {
        state.loading = false;
        state.roles = action.payload;
      })
      .addCase(fetchRolesByPermission.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      
      // Create role permission
      .addCase(createRolePermission.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createRolePermission.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.rolePermissions.push(action.payload);
        }
      })
      .addCase(createRolePermission.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      
      // Assign permissions (bulk)
      .addCase(assignPermissionsToRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(assignPermissionsToRole.fulfilled, (state) => {
        state.loading = false;
        // Refetch will be triggered by page
      })
      .addCase(assignPermissionsToRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      
      // Remove permissions (bulk)
      .addCase(removePermissionsFromRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removePermissionsFromRole.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(removePermissionsFromRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      
      // Replace permissions
      .addCase(replaceRolePermissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(replaceRolePermissions.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(replaceRolePermissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      
      // Remove single permission
      .addCase(removePermissionFromRole.fulfilled, (state, action) => {
        state.permissions = state.permissions.filter(
          p => p.id !== action.payload.permissionId
        );
      })
      
      // Remove all permissions
      .addCase(removeAllPermissionsFromRole.fulfilled, (state) => {
        state.permissions = [];
      })
      
      // Fetch stats
      .addCase(fetchRolePermissionStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });
  }
});

export const { clearError } = rolePermissionSlice.actions;
export default rolePermissionSlice.reducer;
