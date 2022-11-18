import { neteaseCalendarDate as neteaseCalendarDateTime } from '../utils/chrono'
import { DateTime } from 'luxon'
import { logger } from 'modules/logger'
import { store } from 'store'

export async function schedulerShouldSkip() {
  const lastSync = store.getState().scheduler.lastSync
  if (!lastSync) return false

  const lastSyncDate = neteaseCalendarDateTime(DateTime.fromISO(lastSync))
  const cutTimeOfToday = neteaseCalendarDateTime(DateTime.now()).startOf('day')
  // If the last sync is after the cut time of today, we should skip (we already synced today)
  const shouldSkip = lastSyncDate > cutTimeOfToday
  if (shouldSkip) {
    logger.info(
      `scheduler: skipping due to already synced at ${DateTime.fromISO(
        lastSync,
      ).toString()}`,
    )
  }
  return shouldSkip
}
