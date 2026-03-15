import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_ENDPOINTS, apiService } from '@/services/api';

// =====================================================
// ASYNC THUNKS
// =====================================================

export const fetchStudents = createAsyncThunk(
  'students/fetchAll',
  async () => {
    const response = await apiService.get(API_ENDPOINTS.STUDENTS.GET_ALL);
    console.log('🔍 Students API Response:', response.data.data?.students);
    return response.data.data?.students || response.data.students || [];
  }
);

export const createStudent = createAsyncThunk(
  'students/create',
  async (studentData) => {
    const response = await apiService.post(API_ENDPOINTS.STUDENTS.CREATE, studentData);
    return response.data.data;
  }
);

export const updateStudent = createAsyncThunk(
  'students/update',
  async (payload) => {
    // Handle both {id, data} object and direct parameters
    let id, data;
    if (payload && typeof payload === 'object' && 'id' in payload && 'data' in payload) {
      id = payload.id;
      data = payload.data;
    } else {
      throw new Error('Invalid payload format. Expected {id, data}');
    }
    
    const response = await apiService.put(API_ENDPOINTS.STUDENTS.UPDATE(id), data);
    return response.data.data.student;
  }
);

export const deleteStudent = createAsyncThunk(
  'students/delete',
  async (id) => {
    await apiService.delete(API_ENDPOINTS.STUDENTS.DELETE(id));
    return id;
  }
);

export const createStudentLogin = createAsyncThunk(
  'students/createLogin',
  async ({ id, send_welcome_email = false }) => {
    const response = await apiService.post(API_ENDPOINTS.STUDENTS.CREATE_LOGIN(id), {
      send_welcome_email
    });
    return response.data;
  }
);

// Student Schema Thunks
export const fetchStudentSchemas = createAsyncThunk(
  'students/fetchSchemas',
  async () => {
    const response = await apiService.get(API_ENDPOINTS.STUDENTS.SCHEMAS.GET_ALL);
    return response.data.data?.schemas || response.data.schemas || [];
  }
);

export const createStudentSchema = createAsyncThunk(
  'students/createSchema',
  async (schemaData) => {
    const response = await apiService.post(API_ENDPOINTS.STUDENTS.SCHEMAS.CREATE, schemaData);
    return response.data.data?.schema || response.data.schema;
  }
);

export const updateStudentSchema = createAsyncThunk(
  'students/updateSchema',
  async ({ id, data }) => {
    const response = await apiService.put(API_ENDPOINTS.STUDENTS.SCHEMAS.UPDATE(id), data);
    return response.data.data?.schema || response.data.schema;
  }
);

export const deleteStudentSchema = createAsyncThunk(
  'students/deleteSchema',
  async (id) => {
    await apiService.delete(API_ENDPOINTS.STUDENTS.SCHEMAS.DELETE(id));
    return id;
  }
);

// =====================================================
// SLICE
// =====================================================

const studentSlice = createSlice({
  name: 'students',
  initialState: {
    students: [],
    schemas: [], // Student schemas
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
      .addCase(fetchStudents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudents.fulfilled, (state, action) => {
        state.loading = false;
        state.students = action.payload;
      })
      .addCase(fetchStudents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(createStudent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createStudent.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload?.student) {
          state.students.push(action.payload.student);
        }
      })
      .addCase(createStudent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(updateStudent.fulfilled, (state, action) => {
        const index = state.students.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.students[index] = action.payload;
        }
      })
      .addCase(deleteStudent.fulfilled, (state, action) => {
        state.students = state.students.filter(s => s.id !== action.payload);
      })
      // Student Schema Reducers
      .addCase(fetchStudentSchemas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudentSchemas.fulfilled, (state, action) => {
        state.loading = false;
        state.schemas = action.payload;
      })
      .addCase(fetchStudentSchemas.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(createStudentSchema.fulfilled, (state, action) => {
        state.schemas.push(action.payload);
      })
      .addCase(updateStudentSchema.fulfilled, (state, action) => {
        const index = state.schemas.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.schemas[index] = action.payload;
        }
      })
      .addCase(deleteStudentSchema.fulfilled, (state, action) => {
        state.schemas = state.schemas.filter(s => s.id !== action.payload);
      });
  }
});

export const { clearError } = studentSlice.actions;
export default studentSlice.reducer;
