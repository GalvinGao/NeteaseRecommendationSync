import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface SpotifyState {
  auth: SpotifyAuthStateLoggedIn | SpotifyAuthStateEmpty;
}

interface SpotifyAuthStateLoggedIn {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

type SpotifyAuthStateEmpty = null;

const initialState: SpotifyState = {
  auth: null,
};

export const spotifySlice = createSlice({
  name: "spotify",
  initialState,
  reducers: {
    spotifyLoggedIn: (
      state,
      action: PayloadAction<SpotifyAuthStateLoggedIn>
    ) => {
      state.auth = action.payload;
    },
    spotifyLoggedOut: (state) => {
      state.auth = null;
    },
  },
});

export const { spotifyLoggedIn, spotifyLoggedOut } = spotifySlice.actions;

export default spotifySlice.reducer;
