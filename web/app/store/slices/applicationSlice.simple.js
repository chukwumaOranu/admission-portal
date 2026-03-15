import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_ENDPOINTS, apiService } from '@/services/api';

// =====================================================
// ASYNC THUNKS - SIMPLE!
// =====================================================

export const fetchApplications = createAsyncThunk(
  'applications/fetchAll',
  async () => {
    const response = await apiService.get(API_ENDPOINTS.APPLICATIONS.GET_ALL);
    console.log('🔍 Applications API Response:', response.data);
    return response.data.data?.applications || response.data.applications || [];
  }
);

export const createApplication = createAsyncThunk(
  'applications/create',
  async (applicationData) => {
    const response = await apiService.post(API_ENDPOINTS.APPLICATIONS.CREATE, applicationData);
    return response.data.data?.application || response.data.application;
  }
);

export const updateApplication = createAsyncThunk(
  'applications/update',
  async ({ id, data }) => {
    const response = await apiService.put(API_ENDPOINTS.APPLICATIONS.UPDATE(id), data);
    return response.data.data?.application || response.data.application;
  }
);

export const deleteApplication = createAsyncThunk(
  'applications/delete',
  async (id) => {
    await apiService.delete(API_ENDPOINTS.APPLICATIONS.DELETE(id));
    return id;
  }
);

// =====================================================
// SLICE - SIMPLE!
// =====================================================

const applicationSlice = createSlice({
  name: 'applications',
  initialState: {
    applications: [],
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
      .addCase(fetchApplications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchApplications.fulfilled, (state, action) => {
        state.loading = false;
        state.applications = action.payload;
      })
      .addCase(fetchApplications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(createApplication.fulfilled, (state, action) => {
        state.applications.push(action.payload);
      })
      .addCase(updateApplication.fulfilled, (state, action) => {
        const index = state.applications.findIndex(a => a.id === action.payload.id);
        if (index !== -1) {
          state.applications[index] = action.payload;
        }
      })
      .addCase(deleteApplication.fulfilled, (state, action) => {
        state.applications = state.applications.filter(a => a.id !== action.payload);
      });
  }
});

export const { clearError } = applicationSlice.actions;
export default applicationSlice.reducer;
