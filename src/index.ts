import { dispatchMigrateLikes } from 'action/migrateLikes'
import { dispatchNeteaseAuth } from 'action/neteaseAuth'
import { schedulerShouldSkip } from 'action/scheduler'
import { dispatchSpotifyAuth } from 'action/spotifyAuth'
import { dispatchSyncRecommendations } from 'action/sync/dispatcher'
import { SYNC_TIME_PARSED, SYNC_TIME_TZ } from 'config'
import { logger } from 'modules/logger'
import { addSchedule } from 'modules/scheduler'

const shouldIgnoreSkipCheck = process.argv.includes('--ignore-skip-check')

async function sync() {
  if (shouldIgnoreSkipCheck) {
    logger.info('scheduler: skipping duplication check')
  } else if (await schedulerShouldSkip()) {
    return
  }
  await dispatchNeteaseAuth()
  await dispatchSpotifyAuth()
  await dispatchSyncRecommendations()
}

async function migrate() {
  await dispatchMigrateLikes()
}

async function main() {
  await sync()
  await migrate()

  addSchedule(
    'migrate',
    Array(4)
      .fill(SYNC_TIME_PARSED.hour)
      .map((el, i) => (el + (i * 6 + 3)) % 24),
    // every 6 hours, starting from SYNC_TIME_PARSED.hour, offset by [3, 9, 15, 21] hours
    // which if SYNC_TIME_PARSED.hour is 6, this will be [9, 15, 21, 3]
    SYNC_TIME_PARSED.minute,
    SYNC_TIME_TZ,
    migrate,
  )
  addSchedule(
    'sync',
    SYNC_TIME_PARSED.hour,
    SYNC_TIME_PARSED.minute,
    SYNC_TIME_TZ,
    sync,
  )
}

main()
