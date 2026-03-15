import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_ENDPOINTS, apiService } from '@/services/api';

// =====================================================
// ASYNC THUNKS
// =====================================================

export const fetchDepartments = createAsyncThunk(
  'departments/fetchAll',
  async () => {
    const response = await apiService.get(API_ENDPOINTS.DEPARTMENTS.GET_ALL);
    console.log('🔍 Departments API Response:', response.data);
    return response.data.data?.departments || response.data.departments || [];
  }
);

export const createDepartment = createAsyncThunk(
  'departments/create',
  async (deptData) => {
    const response = await apiService.post(API_ENDPOINTS.DEPARTMENTS.CREATE, deptData);
    return response.data.data.department;
  }
);

export const updateDepartment = createAsyncThunk(
  'departments/update',
  async ({ id, data }) => {
    const response = await apiService.put(API_ENDPOINTS.DEPARTMENTS.UPDATE(id), data);
    return response.data.data.department;
  }
);

export const deleteDepartment = createAsyncThunk(
  'departments/delete',
  async (id) => {
    await apiService.delete(API_ENDPOINTS.DEPARTMENTS.DELETE(id));
    return id;
  }
);

// =====================================================
// SLICE
// =====================================================

const departmentSlice = createSlice({
  name: 'departments',
  initialState: {
    departments: [],
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
      .addCase(fetchDepartments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.loading = false;
        state.departments = action.payload;
      })
      .addCase(fetchDepartments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(createDepartment.fulfilled, (state, action) => {
        state.departments.push(action.payload);
      })
      .addCase(updateDepartment.fulfilled, (state, action) => {
        const index = state.departments.findIndex(d => d.id === action.payload.id);
        if (index !== -1) {
          state.departments[index] = action.payload;
        }
      })
      .addCase(deleteDepartment.fulfilled, (state, action) => {
        state.departments = state.departments.filter(d => d.id !== action.payload);
      });
  }
});

export const { clearError } = departmentSlice.actions;
export default departmentSlice.reducer;