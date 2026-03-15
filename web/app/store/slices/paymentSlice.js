import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_ENDPOINTS, apiService } from '@/services/api';

// =====================================================
// ASYNC THUNKS - Simple!
// =====================================================

// Fetch payments by applicant ID
export const fetchPaymentsByApplicant = createAsyncThunk(
  'payments/fetchByApplicant',
  async (applicantId) => {
    const response = await apiService.get(API_ENDPOINTS.PAYMENTS.GET_BY_APPLICANT(applicantId));
    return response.data.data || response.data || [];
  }
);

// Fetch all payments (for admin use)
export const fetchPayments = createAsyncThunk(
  'payments/fetchAll',
  async () => {
    const response = await apiService.get(API_ENDPOINTS.PAYMENTS.GET_ALL);
    
    // Handle different response structures
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data.data && Array.isArray(response.data.data)) {
      return response.data.data;
    } else {
      return [];
    }
  }
);

// Fetch current user's payments (student portal)
export const fetchMyPayments = createAsyncThunk(
  'payments/fetchMy',
  async () => {
    const response = await apiService.get(API_ENDPOINTS.PAYMENTS.GET_MY);

    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data.data && Array.isArray(response.data.data)) {
      return response.data.data;
    } else {
      return [];
    }
  }
);

// Initialize payment
export const initializePayment = createAsyncThunk(
  'payments/initialize',
  async (paymentData) => {
    const response = await apiService.post(API_ENDPOINTS.PAYMENTS.INITIALIZE, paymentData);
    const result = response.data.data || response.data;
    return result;
  }
);

// Verify payment
export const verifyPayment = createAsyncThunk(
  'payments/verify',
  async (reference) => {
    const response = await apiService.get(API_ENDPOINTS.PAYMENTS.VERIFY(reference));
    const result = response.data.data || response.data;
    return result;
  }
);

// Fetch payment stats
export const fetchPaymentStats = createAsyncThunk(
  'payments/fetchStats',
  async () => {
    const response = await apiService.get(API_ENDPOINTS.PAYMENTS.STATS);
    console.log('🔍 Payment Stats API Response:', response.data);
    return response.data.data || response.data;
  }
);

// Fetch payment overview
export const fetchPaymentOverview = createAsyncThunk(
  'payments/fetchOverview',
  async () => {
    const response = await apiService.get(API_ENDPOINTS.PAYMENTS.OVERVIEW);
    console.log('🔍 Payment Overview API Response:', response.data);
    return response.data.data || response.data;
  }
);

// =====================================================
// SLICE - Simple state
// =====================================================

const paymentSlice = createSlice({
  name: 'payments',
  initialState: {
    payments: [],
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
      .addCase(fetchPayments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.payments = action.payload;
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchMyPayments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.payments = action.payload;
      })
      .addCase(fetchMyPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchPaymentsByApplicant.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPaymentsByApplicant.fulfilled, (state, action) => {
        state.loading = false;
        state.payments = action.payload;
      })
      .addCase(fetchPaymentsByApplicant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      
      // Payment verification updates the payment
      .addCase(verifyPayment.fulfilled, (state, action) => {
        const index = state.payments.findIndex(p => p.payment_reference === action.payload.reference);
        if (index !== -1) {
          state.payments[index] = { ...state.payments[index], ...action.payload };
        }
      });
  }
});

export const { clearError } = paymentSlice.actions;
export default paymentSlice.reducer;
