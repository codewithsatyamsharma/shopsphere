import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api, getErrorMessage } from "../../lib/api";
import { logout, sessionExpired } from "../auth/authSlice";

export const fetchWishlist = createAsyncThunk("wishlist/fetch", async () => {
  const { data } = await api.get("/wishlist");
  return data.data.map((product) => product.id);
});

// `wished` is the state BEFORE the click
export const toggleWishlist = createAsyncThunk(
  "wishlist/toggle",
  async ({ productId, wished }, { rejectWithValue }) => {
    try {
      if (wished) await api.delete(`/wishlist/${productId}`);
      else await api.put(`/wishlist/${productId}`);
    } catch (error) {
      return rejectWithValue({ message: getErrorMessage(error) });
    }
  },
);

const set = (ids, productId, shouldContain) => {
  const index = ids.indexOf(productId);
  if (shouldContain && index === -1) ids.push(productId);
  if (!shouldContain && index !== -1) ids.splice(index, 1);
};

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState: { ids: [] }, // one list of ids is the single source of truth for every heart
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.fulfilled, (state, { payload }) => {
        state.ids = payload;
      })
      // `pending` runs the instant you dispatch, before the server answers: this IS the optimistic update
      .addCase(toggleWishlist.pending, (state, { meta }) => set(state.ids, meta.arg.productId, !meta.arg.wished))
      // if the request fails, put it back
      .addCase(toggleWishlist.rejected, (state, { meta }) => set(state.ids, meta.arg.productId, meta.arg.wished))
      .addCase(logout.fulfilled, (state) => {
        state.ids = [];
      })
      .addCase(sessionExpired, (state) => {
        state.ids = [];
      });
  },
});

export default wishlistSlice.reducer;
