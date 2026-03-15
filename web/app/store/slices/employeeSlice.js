import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_ENDPOINTS, apiService } from '@/services/api';

// =====================================================
// ASYNC THUNKS
// =====================================================

export const fetchEmployees = createAsyncThunk(
  'employees/fetchAll',
  async () => {
    const response = await apiService.get(API_ENDPOINTS.EMPLOYEES.GET_ALL);
    console.log('🔍 Employees API Response:', response.data);
    return response.data.data?.employees || response.data.employees || [];
  }
);

export const fetchEmployeeSchemas = createAsyncThunk(
  'employees/fetchSchemas',
  async () => {
    const response = await apiService.get(API_ENDPOINTS.EMPLOYEES.SCHEMAS.GET_ALL);
    console.log('🔍 Employee Schemas API Response:', response.data);
    return response.data.data?.schemas || response.data.schemas || [];
  }
);

export const createEmployee = createAsyncThunk(
  'employees/create',
  async (employeeData) => {
    const response = await apiService.post(API_ENDPOINTS.EMPLOYEES.CREATE, employeeData);
    console.log('🔍 Create Employee API Response:', response);
    console.log('🔍 Response Data:', response.data);
    return response.data; // Return the data property from the response
  }
);

export const updateEmployee = createAsyncThunk(
  'employees/update',
  async ({ id, data }) => {
    const response = await apiService.put(API_ENDPOINTS.EMPLOYEES.UPDATE(id), data);
    return response.data.data.employee;
  }
);

export const deleteEmployee = createAsyncThunk(
  'employees/delete',
  async (id) => {
    await apiService.delete(API_ENDPOINTS.EMPLOYEES.DELETE(id));
    return id;
  }
);

export const createEmployeeLogin = createAsyncThunk(
  'employees/createLogin',
  async ({ id, send_welcome_email = false }) => {
    const response = await apiService.post(API_ENDPOINTS.EMPLOYEES.CREATE_LOGIN(id), {
      send_welcome_email
    });
    return response.data;
  }
);

export const fetchEmployeeStats = createAsyncThunk(
  'employees/fetchStats',
  async () => {
    const response = await apiService.get(API_ENDPOINTS.EMPLOYEES.STATS);
    console.log('🔍 Employee Stats API Response:', response.data);
    return response.data.data || response.data;
  }
);

// Employee Schema Actions
export const createEmployeeSchema = createAsyncThunk(
  'employees/createSchema',
  async (schemaData) => {
    const response = await apiService.post(API_ENDPOINTS.EMPLOYEES.SCHEMAS.CREATE, schemaData);
    return response.data.data;
  }
);

export const updateEmployeeSchema = createAsyncThunk(
  'employees/updateSchema',
  async ({ id, data }) => {
    const response = await apiService.put(API_ENDPOINTS.EMPLOYEES.SCHEMAS.UPDATE(id), data);
    return response.data.data;
  }
);

export const deleteEmployeeSchema = createAsyncThunk(
  'employees/deleteSchema',
  async (id) => {
    await apiService.delete(API_ENDPOINTS.EMPLOYEES.SCHEMAS.DELETE(id));
    return id;
  }
);

export const getEmployeeSchemaById = createAsyncThunk(
  'employees/getSchemaById',
  async (id) => {
    const response = await apiService.get(API_ENDPOINTS.EMPLOYEES.SCHEMAS.GET_BY_ID(id));
    return response.data.data;
  }
);

export const getEmployeeSchemaFields = createAsyncThunk(
  'employees/getSchemaFields',
  async (schemaId) => {
    const response = await apiService.get(API_ENDPOINTS.EMPLOYEES.SCHEMAS.FIELDS.GET_ALL(schemaId));
    return response.data.data;
  }
);

export const addEmployeeSchemaField = createAsyncThunk(
  'employees/addSchemaField',
  async ({ schemaId, fieldData }) => {
    const response = await apiService.post(API_ENDPOINTS.EMPLOYEES.SCHEMAS.FIELDS.CREATE(schemaId), fieldData);
    return response.data.data;
  }
);

export const updateEmployeeSchemaField = createAsyncThunk(
  'employees/updateSchemaField',
  async ({ schemaId, fieldId, fieldData }) => {
    const response = await apiService.put(API_ENDPOINTS.EMPLOYEES.SCHEMAS.FIELDS.UPDATE(schemaId, fieldId), fieldData);
    return response.data.data;
  }
);

export const deleteEmployeeSchemaField = createAsyncThunk(
  'employees/deleteSchemaField',
  async ({ schemaId, fieldId }) => {
    await apiService.delete(API_ENDPOINTS.EMPLOYEES.SCHEMAS.FIELDS.DELETE(schemaId, fieldId));
    return fieldId;
  }
);

// =====================================================
// SLICE
// =====================================================

const employeeSlice = createSlice({
  name: 'employees',
  initialState: {
    employees: [],
    schemas: [],
    currentSchema: null,
    schemaFields: [],
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
      .addCase(fetchEmployees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.loading = false;
        state.employees = action.payload;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(createEmployee.fulfilled, (state, action) => {
        state.employees.push(action.payload);
      })
      .addCase(updateEmployee.fulfilled, (state, action) => {
        const index = state.employees.findIndex(e => e.id === action.payload.id);
        if (index !== -1) {
          state.employees[index] = action.payload;
        }
      })
      .addCase(deleteEmployee.fulfilled, (state, action) => {
        state.employees = state.employees.filter(e => e.id !== action.payload);
      })
      
      // Fetch employee schemas
      .addCase(fetchEmployeeSchemas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployeeSchemas.fulfilled, (state, action) => {
        state.loading = false;
        state.schemas = action.payload;
      })
      .addCase(fetchEmployeeSchemas.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      
      // Employee Schema Actions
      .addCase(createEmployeeSchema.fulfilled, (state, action) => {
        state.schemas.push(action.payload);
      })
      .addCase(updateEmployeeSchema.fulfilled, (state, action) => {
        const index = state.schemas.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.schemas[index] = action.payload;
        }
      })
      .addCase(deleteEmployeeSchema.fulfilled, (state, action) => {
        state.schemas = state.schemas.filter(s => s.id !== action.payload);
      })
      .addCase(getEmployeeSchemaById.fulfilled, (state, action) => {
        state.currentSchema = action.payload.schema;
        state.schemaFields = action.payload.fields || [];
      })
      .addCase(getEmployeeSchemaFields.fulfilled, (state, action) => {
        state.schemaFields = action.payload;
      })
      .addCase(addEmployeeSchemaField.fulfilled, (state, action) => {
        state.schemaFields.push(action.payload);
      })
      .addCase(updateEmployeeSchemaField.fulfilled, (state, action) => {
        const index = state.schemaFields.findIndex(f => f.id === action.payload.id);
        if (index !== -1) {
          state.schemaFields[index] = action.payload;
        }
      })
      .addCase(deleteEmployeeSchemaField.fulfilled, (state, action) => {
        state.schemaFields = state.schemaFields.filter(f => f.id !== action.payload);
      });
  }
});

export const { clearError } = employeeSlice.actions;
export default employeeSlice.reducer;