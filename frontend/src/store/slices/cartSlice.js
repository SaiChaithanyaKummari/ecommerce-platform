import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../utils/axios';

const initialState = {
  items: JSON.parse(localStorage.getItem('cartItems')) || [],
  couponCode: localStorage.getItem('couponCode') || null,
  totalAfterDiscount: parseFloat(localStorage.getItem('totalAfterDiscount')) || 0,
  isLoading: false,
  error: null
};

export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/cart');
      return response.data.data.cart;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch cart');
    }
  }
);

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ productId, quantity }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/cart', { productId, quantity });
      return response.data.data.cart;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add to cart');
    }
  }
);

export const updateCartItem = createAsyncThunk(
  'cart/updateCartItem',
  async ({ itemId, quantity }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/cart/${itemId}`, { quantity });
      return response.data.data.cart;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update cart');
    }
  }
);

export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async (itemId, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`/cart/${itemId}`);
      return response.data.data.cart;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove from cart');
    }
  }
);

export const applyCoupon = createAsyncThunk(
  'cart/applyCoupon',
  async (code, { rejectWithValue }) => {
    try {
      const response = await axios.post('/cart/apply-coupon', { code });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to apply coupon');
    }
  }
);

export const clearCart = createAsyncThunk(
  'cart/clearCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.delete('/cart/clear');
      return response.data.data.cart;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to clear cart');
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    loadCartFromStorage: (state) => {
      state.items = JSON.parse(localStorage.getItem('cartItems')) || [];
      state.couponCode = localStorage.getItem('couponCode') || null;
      state.totalAfterDiscount = parseFloat(localStorage.getItem('totalAfterDiscount')) || 0;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.items = action.payload.items;
        state.couponCode = action.payload.couponCode;
        state.totalAfterDiscount = action.payload.totalAfterDiscount;
        localStorage.setItem('cartItems', JSON.stringify(action.payload.items));
        localStorage.setItem('couponCode', action.payload.couponCode || '');
        localStorage.setItem('totalAfterDiscount', action.payload.totalAfterDiscount);
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.items = action.payload.items;
        state.couponCode = action.payload.couponCode;
        state.totalAfterDiscount = action.payload.totalAfterDiscount;
        localStorage.setItem('cartItems', JSON.stringify(action.payload.items));
        localStorage.setItem('couponCode', action.payload.couponCode || '');
        localStorage.setItem('totalAfterDiscount', action.payload.totalAfterDiscount);
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.items = action.payload.items;
        state.couponCode = action.payload.couponCode;
        state.totalAfterDiscount = action.payload.totalAfterDiscount;
        localStorage.setItem('cartItems', JSON.stringify(action.payload.items));
        localStorage.setItem('couponCode', action.payload.couponCode || '');
        localStorage.setItem('totalAfterDiscount', action.payload.totalAfterDiscount);
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.items = action.payload.items;
        state.couponCode = action.payload.couponCode;
        state.totalAfterDiscount = action.payload.totalAfterDiscount;
        localStorage.setItem('cartItems', JSON.stringify(action.payload.items));
        localStorage.setItem('couponCode', action.payload.couponCode || '');
        localStorage.setItem('totalAfterDiscount', action.payload.totalAfterDiscount);
      })
      .addCase(applyCoupon.fulfilled, (state, action) => {
        state.couponCode = action.payload.cart.couponCode;
        state.totalAfterDiscount = action.payload.cart.totalAfterDiscount;
        localStorage.setItem('couponCode', action.payload.cart.couponCode || '');
        localStorage.setItem('totalAfterDiscount', action.payload.cart.totalAfterDiscount);
      })
      .addCase(clearCart.fulfilled, (state, action) => {
        state.items = action.payload.items;
        state.couponCode = null;
        state.totalAfterDiscount = 0;
        localStorage.setItem('cartItems', JSON.stringify([]));
        localStorage.removeItem('couponCode');
        localStorage.removeItem('totalAfterDiscount');
      });
  }
});

export const { loadCartFromStorage, clearError } = cartSlice.actions;
export default cartSlice.reducer;
