import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_ENDPOINTS, apiService } from '@/services/api';

// =====================================================
// ASYNC THUNKS - Keep it simple!
// =====================================================

// Fetch all applications
export const fetchApplications = createAsyncThunk(
  'applications/fetchAll',
  async () => {
    const response = await apiService.get(API_ENDPOINTS.APPLICATIONS.GET_ALL);
    // apiService.get returns response.data, which is { success: true, data: { applications: [...], count: N } }
    return response.data?.applications || response.applications || [];
  }
);

// Fetch current user's applications
export const fetchMyApplications = createAsyncThunk(
  'applications/fetchMy',
  async (_, { rejectWithValue }) => {
    try {
      // Use the /my endpoint which doesn't require user ID matching
      const response = await apiService.get(API_ENDPOINTS.APPLICATIONS.GET_MY);
      const applications = response.data.data || response.data || [];
      return Array.isArray(applications) ? applications : [];
    } catch (error) {
      let errorMessage = 'Failed to fetch applications';
      let statusCode = null;
      
      if (error?.response) {
        statusCode = error.response.status;
        const responseData = error.response.data;
        errorMessage = responseData?.message || 
                      error.response.statusText || 
                      `HTTP ${statusCode} Error`;
      } else if (error?.message) {
        errorMessage = error.message;
        statusCode = error.status || null;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.status) {
        statusCode = error.status;
        errorMessage = error.message || error.statusText || `HTTP ${statusCode} Error`;
      } else {
        errorMessage = 'Unknown error occurred while fetching applications';
      }
      
      const errorPayload = {
        message: String(errorMessage),
        status: statusCode || null
      };
      
      return rejectWithValue(errorPayload);
    }
  }
);

// Fetch application by ID (for current user - uses session)
export const fetchApplicationById = createAsyncThunk(
  'applications/fetchById',
  async (applicationId, { rejectWithValue }) => {
    try {
      const response = await apiService.get(API_ENDPOINTS.APPLICATIONS.GET_BY_ID(applicationId));
      const application = response.data.data || response.data;
      
      if (!application || !application.id) {
        return rejectWithValue({
          message: 'Application not found',
          status: 404
        });
      }
      
      return application;
    } catch (error) {
      let errorMessage = 'Failed to fetch application';
      let statusCode = null;
      
      if (error?.response) {
        statusCode = error.response.status;
        const responseData = error.response.data.data || error.response.data;
        errorMessage = responseData?.message || error.response.statusText || `HTTP ${statusCode} Error`;
      } else if (error?.message) {
        errorMessage = error.message;
        statusCode = error.status || null;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.status) {
        statusCode = error.status;
        errorMessage = error.message || error.statusText || `HTTP ${statusCode} Error`;
      }
      
      const errorPayload = {
        message: String(errorMessage),
        status: statusCode || null
      };
      
      return rejectWithValue(errorPayload);
    }
  }
);

// Fetch application schemas
export const fetchApplicationSchemas = createAsyncThunk(
  'applications/fetchSchemas',
  async () => {
    const response = await apiService.get(API_ENDPOINTS.APPLICATIONS.SCHEMAS.GET_ALL);
    // Handle both array and object response
    return Array.isArray(response.data) ? response.data : (response.data.schemas || response.data.data?.schemas || []);
  }
);

// Create application
export const createApplication = createAsyncThunk(
  'applications/create',
  async (applicationData) => {
    const response = await apiService.post(API_ENDPOINTS.APPLICATIONS.CREATE, applicationData);
    // Backend returns: { success: true, message: 'Applicant created successfully', data: application }
    return response.data.data || response.data;
  }
);

// Update application
export const updateApplication = createAsyncThunk(
  'applications/update',
  async ({ id, data }) => {
    const response = await apiService.put(API_ENDPOINTS.APPLICATIONS.UPDATE(id), data);
    return response.data.data || response.data;
  }
);

// Delete application
export const deleteApplication = createAsyncThunk(
  'applications/delete',
  async (id) => {
    await apiService.delete(API_ENDPOINTS.APPLICATIONS.DELETE(id));
    return id;
  }
);

// Submit application
export const submitApplication = createAsyncThunk(
  'applications/submit',
  async (id) => {
    const response = await apiService.post(API_ENDPOINTS.APPLICATIONS.SUBMIT(id));
    return response.data.data?.application || response.data.application;
  }
);

// Update application status
export const updateApplicationStatus = createAsyncThunk(
  'applications/updateStatus',
  async ({ id, status, notes }) => {
    const response = await apiService.put(API_ENDPOINTS.APPLICATIONS.UPDATE_STATUS(id), { 
      status, 
      review_notes: notes 
    });
    return response.data.data?.application || response.data.application;
  }
);

// Update payment status
export const updateApplicationPaymentStatus = createAsyncThunk(
  'applications/updatePaymentStatus',
  async ({ id, paymentStatus, paymentReference }) => {
    const response = await apiService.put(API_ENDPOINTS.APPLICATIONS.UPDATE_PAYMENT_STATUS(id), {
      payment_status: paymentStatus,
      payment_reference: paymentReference
    });
    return response.data.data?.application || response.data.application;
  }
);

// Fetch application stats
export const fetchApplicationStats = createAsyncThunk(
  'applications/fetchStats',
  async () => {
    const response = await apiService.get(API_ENDPOINTS.APPLICATIONS.STATS);
    return response.data.data || response.data;
  }
);

// =====================================================
// EXAM ASSIGNMENT MANAGEMENT THUNKS
// =====================================================

// Assign exam to multiple applicants
export const assignExam = createAsyncThunk(
  'applications/assignExam',
  async ({ applicant_ids, exam_date_id }) => {
    const response = await apiService.post(API_ENDPOINTS.APPLICATIONS.ASSIGN_EXAM, {
      applicant_ids,
      exam_date_id
    });
    return response.data;
  }
);

// Update exam assignment for a single applicant
export const updateExamAssignment = createAsyncThunk(
  'applications/updateExamAssignment',
  async ({ id, exam_date_id }) => {
    const response = await apiService.put(API_ENDPOINTS.APPLICATIONS.UPDATE_EXAM_ASSIGNMENT(id), {
      exam_date_id
    });
    return response.data.data || response.data;
  }
);

// Remove exam assignment from multiple applicants
export const removeExamAssignment = createAsyncThunk(
  'applications/removeExamAssignment',
  async ({ applicant_ids }) => {
    const response = await apiService.post(API_ENDPOINTS.APPLICATIONS.REMOVE_EXAM_ASSIGNMENT, {
      applicant_ids
    });
    return response.data;
  }
);

// Get exam assignment statistics
export const fetchExamAssignmentStats = createAsyncThunk(
  'applications/fetchExamAssignmentStats',
  async () => {
    const response = await apiService.get(API_ENDPOINTS.APPLICATIONS.EXAM_ASSIGNMENT_STATS);
    return response.data.data || response.data;
  }
);

// Upload passport photo
export const uploadApplicationPassportPhoto = createAsyncThunk(
  'applications/uploadPassport',
  async ({ applicationId, formData }) => {
    const response = await apiService.post(
      API_ENDPOINTS.APPLICATIONS.UPLOAD_PASSPORT(applicationId),
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    );
    return { applicationId, ...response.data.data };
  }
);

// Send acceptance letter
export const sendAcceptanceLetter = createAsyncThunk(
  'applications/sendAcceptanceLetter',
  async (applicationId) => {
    const response = await apiService.post(API_ENDPOINTS.APPLICATIONS.SEND_ACCEPTANCE_LETTER(applicationId));
    return response.data;
  }
);

// Generate admission letter
export const generateAdmissionLetter = createAsyncThunk(
  'applications/generateAdmissionLetter',
  async (applicationId) => {
    const response = await apiService.get(
      API_ENDPOINTS.APPLICATIONS.GENERATE_ADMISSION_LETTER(applicationId),
      { responseType: 'blob' }
    );
    return { applicationId, blob: response.data };
  }
);

// Send rejection letter
// Create application schema
export const createApplicationSchema = createAsyncThunk(
  'applications/createSchema',
  async (schemaData) => {
    const response = await apiService.post(API_ENDPOINTS.APPLICATIONS.SCHEMAS.CREATE, schemaData);
    // Backend returns: { success: true, message: 'Application schema created successfully', data: schema }
    return response.data.data || response.data;
  }
);

// Update application schema
export const updateApplicationSchema = createAsyncThunk(
  'applications/updateSchema',
  async ({ id, data }) => {
    const response = await apiService.put(API_ENDPOINTS.APPLICATIONS.SCHEMAS.UPDATE(id), data);
    // Backend returns: { success: true, message: 'Schema updated successfully', data: updatedSchema }
    return response.data.data || response.data;
  }
);

// Delete application schema
export const deleteApplicationSchema = createAsyncThunk(
  'applications/deleteSchema',
  async (id) => {
    await apiService.delete(API_ENDPOINTS.APPLICATIONS.SCHEMAS.DELETE(id));
    return id;
  }
);

// =====================================================
// SLICE - Simple state
// =====================================================

const applicationSlice = createSlice({
  name: 'applications',
  initialState: {
    applications: [],
    schemas: [],
    examAssignmentStats: null,
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
      // Fetch applications
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
      
      // Fetch my applications
      .addCase(fetchMyApplications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyApplications.fulfilled, (state, action) => {
        state.loading = false;
        state.applications = action.payload;
      })
      .addCase(fetchMyApplications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.error?.message || 'Failed to fetch applications';
      })
      
      // Fetch application by ID
      .addCase(fetchApplicationById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchApplicationById.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.applications.findIndex(a => a.id === action.payload.id);
        if (index !== -1) {
          state.applications[index] = action.payload;
        } else {
          state.applications.push(action.payload);
        }
      })
      .addCase(fetchApplicationById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.error?.message || 'Failed to fetch application';
      })
      
      // Fetch schemas
      .addCase(fetchApplicationSchemas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchApplicationSchemas.fulfilled, (state, action) => {
        state.loading = false;
        state.schemas = action.payload;
      })
      .addCase(fetchApplicationSchemas.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      
      // Create application
      .addCase(createApplication.fulfilled, (state, action) => {
        state.applications.push(action.payload);
      })
      
      // Create application schema
      .addCase(createApplicationSchema.fulfilled, (state, action) => {
        if (action.payload) {
          state.schemas.push(action.payload);
        }
      })
      
      // Create application schema - handle rejected case
      .addCase(createApplicationSchema.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      
      // Update application
      .addCase(updateApplication.fulfilled, (state, action) => {
        if (action.payload && action.payload.id) {
          const index = state.applications.findIndex(a => a.id === action.payload.id);
          if (index !== -1) {
            state.applications[index] = action.payload;
          }
        }
      })
      .addCase(updateApplication.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      
      // Delete application
      .addCase(deleteApplication.fulfilled, (state, action) => {
        state.applications = state.applications.filter(a => a.id !== action.payload);
      })
      
      // Submit application
      .addCase(submitApplication.fulfilled, (state, action) => {
        const index = state.applications.findIndex(a => a.id === action.payload.id);
        if (index !== -1) {
          state.applications[index] = action.payload;
        }
      })
      
      // Update status
      .addCase(updateApplicationStatus.fulfilled, (state, action) => {
        const index = state.applications.findIndex(a => a.id === action.payload.id);
        if (index !== -1) {
          state.applications[index] = action.payload;
        }
      })
      
      // Update payment status
      .addCase(updateApplicationPaymentStatus.fulfilled, (state, action) => {
        const index = state.applications.findIndex(a => a.id === action.payload.id);
        if (index !== -1) {
          state.applications[index] = action.payload;
        }
      })
      
      // Update application schema
      .addCase(updateApplicationSchema.fulfilled, (state, action) => {
        if (action.payload && action.payload.id) {
          const index = state.schemas.findIndex(s => s.id === action.payload.id);
          if (index !== -1) {
            state.schemas[index] = action.payload;
          }
        }
      })
      
      // Update application schema - handle rejected case
      .addCase(updateApplicationSchema.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      
      // Delete application schema
      .addCase(deleteApplicationSchema.fulfilled, (state, action) => {
        state.schemas = state.schemas.filter(s => s.id !== action.payload);
      })
      
      // Delete application schema - handle rejected case
      .addCase(deleteApplicationSchema.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  }
});

export const { clearError } = applicationSlice.actions;
export default applicationSlice.reducer;