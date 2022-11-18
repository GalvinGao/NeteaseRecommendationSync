import { neteaseCalendarDate } from '../../utils/chrono'
import { syncDailyRecommendation } from 'action/sync/dailyRecommendation'
import { syncPrivateRadar } from 'action/sync/privateRadar'
import { SYNC_DAILY, SYNC_RADAR } from 'config'
import { DateTime } from 'luxon'
import { logger } from 'modules/logger'
import { store } from 'store'
import { schedulerLastSyncChanged } from 'store/schedulerSlice'

export interface SyncContext {
  syncId: string
  nowISO: string

  // dailyFlushDate is the date we considered to be in Shanghai timezone;
  // this date increments at 6:00 AM (instead of 0:00 AM) in Shanghai timezone
  dailyFlushDate: string

  dailyRecommendationRetries?: number
}

export async function dispatchSyncRecommendations() {
  const now = DateTime.now()
  const nowISO = now.toISO()
  const dailyFlushDate = neteaseCalendarDate(now).toISODate()

  const syncId = `${dailyFlushDate}_${now.toMillis()}`
  if (SYNC_DAILY) {
    await syncDailyRecommendation({
      syncId,
      nowISO,
      dailyFlushDate,
    })
    store.dispatch(schedulerLastSyncChanged(nowISO))
  }

  if (SYNC_RADAR) {
    await syncPrivateRadar({
      syncId,
      nowISO,
      dailyFlushDate,
    })
  }

  logger.info(
    {
      syncId,
      syncStart: nowISO,
    },
    'sync: finished',
  )
}
