import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface NeteaseState {
  server: string;
  cookie: string | null;
}

const initialState: NeteaseState = {
  server: "http://localhost:3000",
  cookie: null,
};

export const neteaseSlice = createSlice({
  name: "netease",
  initialState,
  reducers: {
    neteaseLoggedIn: (state, action: PayloadAction<string | null>) => {
      state.cookie = action.payload;
    },
    neteaseServerChanged: (state, action: PayloadAction<string>) => {
      state.server = action.payload;
    },
  },
});

export const { neteaseLoggedIn, neteaseServerChanged } = neteaseSlice.actions;

export default neteaseSlice.reducer;
