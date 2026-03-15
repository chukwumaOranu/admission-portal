import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_ENDPOINTS, apiService } from '@/services/api';

// =====================================================
// ASYNC THUNKS - All settings functions
// =====================================================

// ============ SCHOOL SETTINGS ============
export const fetchSchoolSettings = createAsyncThunk(
  'settings/fetchSchoolSettings',
  async () => {
    const response = await apiService.get(API_ENDPOINTS.SETTINGS.SCHOOL.GET);
    console.log('🔍 School Settings API Response:', response.data);
    return response.data.data || response.data;
  }
);

export const updateSchoolSettings = createAsyncThunk(
  'settings/updateSchoolSettings',
  async (settingsData) => {
    const response = await apiService.put(API_ENDPOINTS.SETTINGS.SCHOOL.UPDATE, settingsData);
    return response.data.data || response.data;
  }
);

export const uploadSchoolLogo = createAsyncThunk(
  'settings/uploadSchoolLogo',
  async (formData) => {
    const response = await apiService.post(API_ENDPOINTS.SETTINGS.UPLOADS.UPLOAD_LOGO, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
);

export const uploadSchoolFavicon = createAsyncThunk(
  'settings/uploadSchoolFavicon',
  async (formData) => {
    const response = await apiService.post(API_ENDPOINTS.SETTINGS.UPLOADS.UPLOAD_FAVICON, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
);

// ============ SYSTEM SETTINGS ============
export const fetchSystemSettings = createAsyncThunk(
  'settings/fetchSystemSettings',
  async () => {
    const response = await apiService.get(API_ENDPOINTS.SETTINGS.SYSTEM.GET);
    console.log('🔍 System Settings API Response:', response.data);
    return response.data.data || response.data;
  }
);

export const updateSystemSettings = createAsyncThunk(
  'settings/updateSystemSettings',
  async (settingsData) => {
    const response = await apiService.put(API_ENDPOINTS.SETTINGS.SYSTEM.UPDATE, settingsData);
    return response.data.data || response.data;
  }
);

export const resetSystemSettings = createAsyncThunk(
  'settings/resetSystemSettings',
  async () => {
    const response = await apiService.post(API_ENDPOINTS.SETTINGS.SYSTEM.RESET);
    return response.data.data || response.data;
  }
);

// ============ EMAIL SETTINGS ============
export const fetchEmailSettings = createAsyncThunk(
  'settings/fetchEmailSettings',
  async () => {
    const response = await apiService.get(API_ENDPOINTS.SETTINGS.EMAIL.GET);
    console.log('🔍 Email Settings API Response:', response);
    return response.data || response;
  }
);

export const updateEmailSettings = createAsyncThunk(
  'settings/updateEmailSettings',
  async (settingsData) => {
    const response = await apiService.put(API_ENDPOINTS.SETTINGS.EMAIL.UPDATE, settingsData);
    return response.data || response;
  }
);

export const testEmailSettings = createAsyncThunk(
  'settings/testEmailSettings',
  async (testData) => {
    const response = await apiService.post(API_ENDPOINTS.SETTINGS.EMAIL.TEST, testData);
    return response.data || response;
  }
);

// ============ SECURITY SETTINGS ============
export const fetchSecuritySettings = createAsyncThunk(
  'settings/fetchSecuritySettings',
  async () => {
    const response = await apiService.get(API_ENDPOINTS.SETTINGS.SECURITY.GET);
    console.log('🔍 Security Settings API Response:', response.data);
    return response.data.data || response.data;
  }
);

export const updateSecuritySettings = createAsyncThunk(
  'settings/updateSecuritySettings',
  async (settingsData) => {
    const response = await apiService.put(API_ENDPOINTS.SETTINGS.SECURITY.UPDATE, settingsData);
    return response.data.data || response.data;
  }
);

export const resetSecuritySettings = createAsyncThunk(
  'settings/resetSecuritySettings',
  async () => {
    const response = await apiService.post(API_ENDPOINTS.SETTINGS.SECURITY.RESET);
    return response.data.data || response.data;
  }
);

// ============ FILE UPLOADS ============
export const fetchFileUploads = createAsyncThunk(
  'settings/fetchFileUploads',
  async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const url = queryParams ? `${API_ENDPOINTS.SETTINGS.UPLOADS.GET_ALL}?${queryParams}` : API_ENDPOINTS.SETTINGS.UPLOADS.GET_ALL;
    const response = await apiService.get(url);
    console.log('🔍 File Uploads API Response:', response.data);
    return response.data.data || response.data;
  }
);

export const fetchFileUploadById = createAsyncThunk(
  'settings/fetchFileUploadById',
  async (fileId) => {
    const response = await apiService.get(API_ENDPOINTS.SETTINGS.UPLOADS.GET_BY_ID(fileId));
    return response.data.data || response.data;
  }
);

export const createFileUpload = createAsyncThunk(
  'settings/createFileUpload',
  async (formData) => {
    const response = await apiService.post(API_ENDPOINTS.SETTINGS.UPLOADS.CREATE, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.data || response.data;
  }
);

export const updateFileUpload = createAsyncThunk(
  'settings/updateFileUpload',
  async ({ id, fileData }) => {
    const response = await apiService.put(API_ENDPOINTS.SETTINGS.UPLOADS.UPDATE(id), fileData);
    return response.data.data || response.data;
  }
);

export const deleteFileUpload = createAsyncThunk(
  'settings/deleteFileUpload',
  async (fileId) => {
    await apiService.delete(API_ENDPOINTS.SETTINGS.UPLOADS.DELETE(fileId));
    return { id: fileId };
  }
);

export const fetchFileUploadStats = createAsyncThunk(
  'settings/fetchFileUploadStats',
  async () => {
    const response = await apiService.get(API_ENDPOINTS.SETTINGS.UPLOADS.STATS);
    return response.data.data || response.data;
  }
);

export const fetchFileUploadsByCategory = createAsyncThunk(
  'settings/fetchFileUploadsByCategory',
  async (category) => {
    const response = await apiService.get(API_ENDPOINTS.SETTINGS.UPLOADS.BY_CATEGORY(category));
    return response.data.data || response.data;
  }
);

export const updateFileUploadSettings = createAsyncThunk(
  'settings/updateFileUploadSettings',
  async (settingsData) => {
    const response = await apiService.put(API_ENDPOINTS.SETTINGS.UPLOADS.UPDATE_SETTINGS, settingsData);
    return response.data.data || response.data;
  }
);

// =====================================================
// SLICE - Simple state
// =====================================================

const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    schoolSettings: null,
    systemSettings: null,
    emailSettings: null,
    securitySettings: null,
    fileUploads: [],
    selectedFileUpload: null,
    fileUploadStats: null,
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
      // ============ SCHOOL SETTINGS ============
      .addCase(fetchSchoolSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSchoolSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.schoolSettings = action.payload;
      })
      .addCase(fetchSchoolSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      
      .addCase(updateSchoolSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSchoolSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.schoolSettings = action.payload;
      })
      .addCase(updateSchoolSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      
      .addCase(uploadSchoolLogo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadSchoolLogo.fulfilled, (state, action) => {
        state.loading = false;
        // Update school settings with new logo path
        if (state.schoolSettings && action.payload?.fileUpload) {
          const logoPath = action.payload.fileUpload.file_path.replace('./uploads/', '');
          state.schoolSettings.school_logo = logoPath;
        }
      })
      .addCase(uploadSchoolLogo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      
      .addCase(uploadSchoolFavicon.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadSchoolFavicon.fulfilled, (state, action) => {
        state.loading = false;
        // Update school settings with new favicon path
        if (state.schoolSettings && action.payload?.favicon) {
          const faviconPath = action.payload.favicon.filePath.replace('./uploads/', '');
          state.schoolSettings.school_favicon = faviconPath;
        }
      })
      .addCase(uploadSchoolFavicon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      
      // ============ SYSTEM SETTINGS ============
      .addCase(fetchSystemSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSystemSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.systemSettings = action.payload;
      })
      .addCase(fetchSystemSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      
      .addCase(updateSystemSettings.fulfilled, (state, action) => {
        state.systemSettings = action.payload;
      })
      
      .addCase(resetSystemSettings.fulfilled, (state, action) => {
        state.systemSettings = action.payload;
      })
      
      // ============ EMAIL SETTINGS ============
      .addCase(fetchEmailSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmailSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.emailSettings = action.payload;
      })
      .addCase(fetchEmailSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      
      .addCase(updateEmailSettings.fulfilled, (state, action) => {
        state.emailSettings = action.payload;
      })
      
      .addCase(testEmailSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(testEmailSettings.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(testEmailSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      
      // ============ SECURITY SETTINGS ============
      .addCase(fetchSecuritySettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSecuritySettings.fulfilled, (state, action) => {
        state.loading = false;
        state.securitySettings = action.payload;
      })
      .addCase(fetchSecuritySettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      
      .addCase(updateSecuritySettings.fulfilled, (state, action) => {
        state.securitySettings = action.payload;
      })
      
      .addCase(resetSecuritySettings.fulfilled, (state, action) => {
        state.securitySettings = action.payload;
      })
      
      // ============ FILE UPLOADS ============
      .addCase(fetchFileUploads.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFileUploads.fulfilled, (state, action) => {
        state.loading = false;
        // Handle both array and object with fileUploads property
        state.fileUploads = Array.isArray(action.payload) 
          ? action.payload 
          : action.payload?.fileUploads || [];
      })
      .addCase(fetchFileUploads.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      
      .addCase(fetchFileUploadById.fulfilled, (state, action) => {
        state.selectedFileUpload = action.payload;
      })
      
      .addCase(createFileUpload.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createFileUpload.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.fileUploads.unshift(action.payload);
        }
      })
      .addCase(createFileUpload.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      
      .addCase(updateFileUpload.fulfilled, (state, action) => {
        const updated = action.payload;
        const index = state.fileUploads.findIndex(f => f.id === updated.id);
        if (index !== -1) {
          state.fileUploads[index] = updated;
        }
        if (state.selectedFileUpload?.id === updated.id) {
          state.selectedFileUpload = updated;
        }
      })
      
      .addCase(deleteFileUpload.fulfilled, (state, action) => {
        state.fileUploads = state.fileUploads.filter(f => f.id !== action.payload.id);
        if (state.selectedFileUpload?.id === action.payload.id) {
          state.selectedFileUpload = null;
        }
      })
      
      .addCase(fetchFileUploadStats.fulfilled, (state, action) => {
        state.fileUploadStats = action.payload;
      })
      
      .addCase(fetchFileUploadsByCategory.fulfilled, (state, action) => {
        // Handle both array and object with files property
        state.fileUploads = Array.isArray(action.payload)
          ? action.payload
          : action.payload?.files || [];
      });
  }
});

export const { clearError } = settingsSlice.actions;
export default settingsSlice.reducer;
