import { configureStore } from '@reduxjs/toolkit'

import { schedulerReducer } from './store/schedulerSlice'
import { spotifyReducer } from './store/spotifySlice'
import fs from 'fs'
import { neteaseReducer } from 'store/neteaseSlice'

const persistMiddleware = (store) => (next) => (action) => {
  const result = next(action)
  fs.mkdirSync('state', { recursive: true })
  fs.writeFileSync('state/store.json', JSON.stringify(store.getState()))
  return result
}

const restoredState = () => {
  try {
    const state = fs.readFileSync('state/store.json', 'utf-8')
    return JSON.parse(state)
  } catch (e) {
    return undefined
  }
}

export const store = configureStore({
  reducer: {
    netease: neteaseReducer,
    spotify: spotifyReducer,
    scheduler: schedulerReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(persistMiddleware),
  preloadedState: restoredState(),
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>

export type AppDispatch = typeof store.dispatch
