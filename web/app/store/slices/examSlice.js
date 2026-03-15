import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_ENDPOINTS, apiService } from '@/services/api';

// =====================================================
// ASYNC THUNKS - Simple!
// =====================================================

// Fetch entry dates
export const fetchEntryDates = createAsyncThunk(
  'exams/fetchEntryDates',
  async () => {
    const response = await apiService.get(API_ENDPOINTS.EXAMS.ENTRY_DATES.GET_ALL);
    // API returns data directly as array, not wrapped in data property
    return response.data || [];
  }
);

// Fetch exam cards
export const fetchExamCards = createAsyncThunk(
  'exams/fetchExamCards',
  async () => {
    const response = await apiService.get(API_ENDPOINTS.EXAMS.CARDS.GET_ALL);
    // Backend returns: { success, message, data: [...examCards], pagination }
    // Check if response.data is an array or has a data property
    const result = Array.isArray(response.data) ? response.data : (response.data.data || []);
    return result;
  }
);

// Create entry date
export const createEntryDate = createAsyncThunk(
  'exams/createEntryDate',
  async (entryDateData) => {
    const response = await apiService.post(API_ENDPOINTS.EXAMS.ENTRY_DATES.CREATE, entryDateData);
    // apiService returns backend JSON body directly: { success, message, data }
    return response.data || response.entryDate || response;
  }
);

// Create exam card
export const createExamCard = createAsyncThunk(
  'exams/createExamCard',
  async (examCardData) => {
    const response = await apiService.post(API_ENDPOINTS.EXAMS.CARDS.CREATE, examCardData);
    // Backend returns: { success, message, data: { id, card_number } }
    return response.data.data || response.data;
  }
);

// Update entry date
export const updateEntryDate = createAsyncThunk(
  'exams/updateEntryDate',
  async ({ id, data }) => {
    const response = await apiService.put(API_ENDPOINTS.EXAMS.ENTRY_DATES.UPDATE(id), data);
    // apiService returns backend JSON body directly: { success, message, data }
    return response.data || response.entryDate || response;
  }
);

// Update exam card
export const updateExamCard = createAsyncThunk(
  'exams/updateExamCard',
  async (params) => {
    const { id, data, entry_date_id } = params;
    
    // Handle both generic data updates and specific exam date updates
    const payload = entry_date_id ? { entry_date_id } : data;
    
    const response = await apiService.put(API_ENDPOINTS.EXAMS.CARDS.UPDATE(id), payload);
    return response.data.data || response.data;
  }
);

// Delete entry date
export const deleteEntryDate = createAsyncThunk(
  'exams/deleteEntryDate',
  async (id) => {
    await apiService.delete(API_ENDPOINTS.EXAMS.ENTRY_DATES.DELETE(id));
    return id;
  }
);

// Delete exam card
export const deleteExamCard = createAsyncThunk(
  'exams/deleteExamCard',
  async (id) => {
    await apiService.delete(API_ENDPOINTS.EXAMS.CARDS.DELETE(id));
    return id;
  }
);

// Mark exam card as printed
export const markExamCardAsPrinted = createAsyncThunk(
  'exams/markAsPrinted',
  async (id) => {
    const response = await apiService.post(API_ENDPOINTS.EXAMS.CARDS.PRINT(id));
    // Backend returns: { success, message, data: updatedExamCard }
    return response.data.data || response.data;
  }
);

// Fetch exam stats
export const fetchExamStats = createAsyncThunk(
  'exams/fetchStats',
  async () => {
    const response = await apiService.get(API_ENDPOINTS.EXAMS.ENTRY_DATES.STATS);
    return response.data.data || response.data;
  }
);

// =====================================================
// SLICE - Simple state
// =====================================================

const examSlice = createSlice({
  name: 'exams',
  initialState: {
    entryDates: [],
    examCards: [],
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
      // Fetch entry dates
      .addCase(fetchEntryDates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEntryDates.fulfilled, (state, action) => {
        state.loading = false;
        state.entryDates = action.payload;
      })
      .addCase(fetchEntryDates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      
      // Fetch exam cards
      .addCase(fetchExamCards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExamCards.fulfilled, (state, action) => {
        state.loading = false;
        state.examCards = action.payload;
      })
      .addCase(fetchExamCards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      
      // Create entry date
      .addCase(createEntryDate.fulfilled, (state, action) => {
        if (action.payload && action.payload.id) {
          state.entryDates.push(action.payload);
        }
      })
      
      // Create exam card
      .addCase(createExamCard.fulfilled, (state, action) => {
        state.examCards.push(action.payload);
      })
      
      // Update entry date
      .addCase(updateEntryDate.fulfilled, (state, action) => {
        if (!action.payload || !action.payload.id) return;
        const index = state.entryDates.findIndex(e => e.id === action.payload.id);
        if (index !== -1) {
          state.entryDates[index] = action.payload;
        }
      })
      
      // Update exam card
      .addCase(updateExamCard.fulfilled, (state, action) => {
        const index = state.examCards.findIndex(e => e.id === action.payload.id);
        if (index !== -1) {
          state.examCards[index] = action.payload;
        }
      })
      
      // Delete entry date
      .addCase(deleteEntryDate.fulfilled, (state, action) => {
        state.entryDates = state.entryDates.filter(e => e.id !== action.payload);
      })
      
      // Delete exam card
      .addCase(deleteExamCard.fulfilled, (state, action) => {
        state.examCards = state.examCards.filter(e => e.id !== action.payload);
      })
      
      // Mark as printed
      .addCase(markExamCardAsPrinted.fulfilled, (state, action) => {
        const index = state.examCards.findIndex(e => e.id === action.payload.id);
        if (index !== -1) {
          state.examCards[index] = action.payload;
        }
      });
  }
});

export const { clearError } = examSlice.actions;
export default examSlice.reducer;
