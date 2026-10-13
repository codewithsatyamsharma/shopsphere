import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api, getErrorMessage, getFieldErrors } from "../../lib/api";

// rejectWithValue must receive plain data. Passing the AxiosError itself triggers
// Redux's "non-serializable value" warning.
const failure = (error) => ({ message: getErrorMessage(error), errors: getFieldErrors(error) });

export const fetchMe = createAsyncThunk("auth/fetchMe", async (_, { rejectWithValue }) => {
  try {
    return (await api.get("/auth/me")).data.data;
  } catch (error) {
    return rejectWithValue(failure(error)); // a 401 here is normal: it just means "guest"
  }
});

export const login = createAsyncThunk("auth/login", async (credentials, { rejectWithValue }) => {
  try {
    return (await api.post("/auth/login", credentials)).data.data;
  } catch (error) {
    return rejectWithValue(failure(error));
  }
});

export const register = createAsyncThunk("auth/register", async (values, { rejectWithValue }) => {
  try {
    return (await api.post("/auth/register", values)).data.data;
  } catch (error) {
    return rejectWithValue(failure(error));
  }
});

export const updateProfile = createAsyncThunk("auth/updateProfile", async (values, { rejectWithValue }) => {
  try {
    return (await api.patch("/auth/me", values)).data.data;
  } catch (error) {
    return rejectWithValue(failure(error));
  }
});

export const logout = createAsyncThunk("auth/logout", async () => {
  try {
    await api.post("/auth/logout");
  } catch {
    // even if the request fails, the user wants to be signed out locally
  }
});

const authSlice = createSlice({
  name: "auth",
  // `bootstrapped` = "the first /auth/me check has finished".
  // Without it a logged-in user would be bounced to /login for a split second on every refresh.
  initialState: { user: null, bootstrapped: false },
  reducers: {
    sessionExpired(state) {
      state.user = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMe.fulfilled, (state, { payload }) => {
        state.user = payload;
        state.bootstrapped = true;
      })
      .addCase(fetchMe.rejected, (state) => {
        state.user = null;
        state.bootstrapped = true;
      })
      .addCase(login.fulfilled, (state, { payload }) => {
        state.user = payload;
      })
      .addCase(register.fulfilled, (state, { payload }) => {
        state.user = payload;
      })
      .addCase(updateProfile.fulfilled, (state, { payload }) => {
        state.user = payload;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
      });
  },
});

export const { sessionExpired } = authSlice.actions;
export default authSlice.reducer;
