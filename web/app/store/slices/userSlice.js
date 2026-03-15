import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_ENDPOINTS, apiService } from '@/services/api';

// =====================================================
// ASYNC THUNKS - API Calls
// =====================================================

// Fetch all users
export const fetchUsers = createAsyncThunk(
  'users/fetchAll',
  async () => {
    const response = await apiService.get(API_ENDPOINTS.USERS.GET_ALL);
    console.log('🔍 Users API Response:', response.data);
    return response.data.data?.users || response.data.users || [];
  }
);

// Create user
export const createUser = createAsyncThunk(
  'users/create',
  async (userData) => {
    const response = await apiService.post(API_ENDPOINTS.USERS.CREATE, userData);
    return response.data.data.user;  // Extract created user
  }
);

// Update user
export const updateUser = createAsyncThunk(
  'users/update',
  async ({ id, data }) => {
    const response = await apiService.put(API_ENDPOINTS.USERS.UPDATE(id), data);
    return response.data.data.user;  // Extract updated user
  }
);

// Delete user
export const deleteUser = createAsyncThunk(
  'users/delete',
  async (id) => {
    await apiService.delete(API_ENDPOINTS.USERS.DELETE(id));
    return id;  // Return ID to remove from state
  }
);

// =====================================================
// SLICE - State Management
// =====================================================

const userSlice = createSlice({
  name: 'users',
  initialState: {
    users: [],
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
      // Fetch users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      
      // Create user
      .addCase(createUser.fulfilled, (state, action) => {
        state.users.push(action.payload);
      })
      
      // Update user
      .addCase(updateUser.fulfilled, (state, action) => {
        const index = state.users.findIndex(u => u.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      })
      
      // Delete user
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter(u => u.id !== action.payload);
      });
  }
});

export const { clearError } = userSlice.actions;
export default userSlice.reducer;