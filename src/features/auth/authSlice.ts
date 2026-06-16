import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import type { AuthState, LoginRequest } from './authTypes';
import {
  loginApi,
  meApi,
  updateProfileImageApi,
  uploadProfileImageApi,
} from './authService';

const ACCESS_TOKEN_KEY = 'moka_access_token';

const initialState: AuthState = {
  token: localStorage.getItem(ACCESS_TOKEN_KEY),
  user: null,
  loading: false,
  error: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async (data: LoginRequest, thunkApi) => {
    try {
      const loginResponse = await loginApi(data);

      localStorage.setItem(ACCESS_TOKEN_KEY, loginResponse.accessToken);

      const user = await meApi();

      return {
        token: loginResponse.accessToken,
        user,
      };
    } catch (error) {
      console.error('LOGIN ERROR:', error);
      return thunkApi.rejectWithValue('Login Failed');
    }
  },
);

export const loadCurrentUser = createAsyncThunk(
  'auth/loadCurrentUser',
  async (_, thunkApi) => {
    try {
      const user = await meApi();
      return user;
    } catch (error) {
      console.error('LOAD CURRENT USER ERROR:', error);
      localStorage.removeItem(ACCESS_TOKEN_KEY);

      return thunkApi.rejectWithValue(
        'Session Expired. Please log in again',
      );
    }
  },
);

export const updateCurrentUserProfileImage = createAsyncThunk(
  'auth/updateCurrentUserProfileImage',
  async (
    payload: { userId: number; profileImageUrl: string },
    thunkApi,
  ) => {
    try {
      return await updateProfileImageApi(
        payload.userId,
        payload.profileImageUrl,
      );
    } catch (error) {
      console.error('UPDATE CURRENT USER PROFILE IMAGE ERROR:', error);

      return thunkApi.rejectWithValue(
        'Error while uploading the profile image.',
      );
    }
  },
);

export const uploadCurrentUserProfileImage = createAsyncThunk(
  'auth/uploadCurrentUserProfileImage',
  async (payload: { userId: number; file: File }, thunkApi) => {
    try {
      return await uploadProfileImageApi(payload.userId, payload.file);
    } catch (error) {
      console.error('UPLOAD CURRENT USER PROFILE IMAGE ERROR:', error);

      return thunkApi.rejectWithValue(
        'Error while uploading the profile image ',
      );
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.token = null;
      state.user = null;
      state.loading = false;
      state.error = null;
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.token = null;
        state.user = null;
        state.error =
          typeof action.payload === 'string'
            ? action.payload
            : 'Login Failed';
      })
      .addCase(loadCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.user = action.payload;
        state.token = localStorage.getItem(ACCESS_TOKEN_KEY);
      })
      .addCase(loadCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.token = null;
        state.user = null;
        state.error =
          typeof action.payload === 'string'
            ? action.payload
            : 'Session Expired. Please log in again.';
      })
      .addCase(updateCurrentUserProfileImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCurrentUserProfileImage.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.user = action.payload;
      })
      .addCase(updateCurrentUserProfileImage.rejected, (state, action) => {
        state.loading = false;
        state.error =
          typeof action.payload === 'string'
            ? action.payload
            : 'Error while uploading the profile image.';
      })
      .addCase(uploadCurrentUserProfileImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadCurrentUserProfileImage.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.user = action.payload;
      })
      .addCase(uploadCurrentUserProfileImage.rejected, (state, action) => {
        state.loading = false;
        state.error =
          typeof action.payload === 'string'
            ? action.payload
            : 'Error Loading Profile image';
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;

export default authSlice.reducer; 