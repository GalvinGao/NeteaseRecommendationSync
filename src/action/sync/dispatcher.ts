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
  nowDateInShanghai: string
  dailyRecommendationRetries?: number
}

export async function dispatchSyncRecommendations() {
  const now = DateTime.now()
  const nowISO = now.toISO()
  const nowDateInShanghai = now.setZone('Asia/Shanghai').toFormat('yyyy-MM-dd')
  const syncId = `${nowDateInShanghai}_${now.toMillis()}`
  if (SYNC_DAILY) {
    await syncDailyRecommendation({
      syncId,
      nowISO,
      nowDateInShanghai,
    })
    store.dispatch(schedulerLastSyncChanged(nowISO))
  }

  if (SYNC_RADAR) {
    await syncPrivateRadar({
      syncId,
      nowISO,
      nowDateInShanghai,
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
