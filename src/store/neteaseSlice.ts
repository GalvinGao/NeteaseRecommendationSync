import { PayloadAction, createSlice } from '@reduxjs/toolkit'

interface NeteaseState {
  cookie: string | null
}

const initialState: NeteaseState = {
  cookie: null,
}

export const neteaseSlice = createSlice({
  name: 'netease',
  initialState,
  reducers: {
    neteaseCookieChanged: (state, action: PayloadAction<string | null>) => {
      state.cookie = action.payload
    },
  },
})

export const { neteaseCookieChanged } = neteaseSlice.actions

export const neteaseReducer = neteaseSlice.reducer
