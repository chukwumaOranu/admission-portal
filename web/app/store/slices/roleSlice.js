import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_ENDPOINTS, apiService } from '@/services/api';

// =====================================================
// ASYNC THUNKS
// =====================================================

export const fetchRoles = createAsyncThunk(
  'roles/fetchAll',
  async () => {
    const response = await apiService.get(API_ENDPOINTS.ROLES.GET_ALL);
    console.log('🔍 Roles API Response:', response.data);
    return response.data.data?.roles || response.data.roles || [];
  }
);

export const createRole = createAsyncThunk(
  'roles/create',
  async (roleData) => {
    const response = await apiService.post(API_ENDPOINTS.ROLES.CREATE, roleData);
    return response.data.data.role;
  }
);

export const updateRole = createAsyncThunk(
  'roles/update',
  async ({ id, data }) => {
    const response = await apiService.put(API_ENDPOINTS.ROLES.UPDATE(id), data);
    return response.data.data.role;
  }
);

export const deleteRole = createAsyncThunk(
  'roles/delete',
  async (id) => {
    await apiService.delete(API_ENDPOINTS.ROLES.DELETE(id));
    return id;
  }
);

// =====================================================
// SLICE
// =====================================================

const roleSlice = createSlice({
  name: 'roles',
  initialState: {
    roles: [],
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
      .addCase(fetchRoles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.loading = false;
        state.roles = action.payload;
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(createRole.fulfilled, (state, action) => {
        state.roles.push(action.payload);
      })
      .addCase(updateRole.fulfilled, (state, action) => {
        const index = state.roles.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          state.roles[index] = action.payload;
        }
      })
      .addCase(deleteRole.fulfilled, (state, action) => {
        state.roles = state.roles.filter(r => r.id !== action.payload);
      });
  }
});

export const { clearError } = roleSlice.actions;
export default roleSlice.reducer;