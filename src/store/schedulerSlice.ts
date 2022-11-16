import { PayloadAction, createSlice } from '@reduxjs/toolkit'

interface SchedulerState {
  lastSync: string | null
}

const initialState: SchedulerState = {
  lastSync: null,
}

export const schedulerSlice = createSlice({
  name: 'netease',
  initialState,
  reducers: {
    schedulerLastSyncChanged: (state, action: PayloadAction<string | null>) => {
      state.lastSync = action.payload
    },
  },
})

export const { schedulerLastSyncChanged } = schedulerSlice.actions

export const schedulerReducer = schedulerSlice.reducer
