import { resolveSpotifySongsFromNeteaseSongs } from '../../modules/spotifyResolver'
import { SyncContext } from 'action/sync/dispatcher'
import { persistDailyRecommendationSynchronizationContext } from 'action/sync/snapshot'
import { getNeteaseRecommendations } from 'api/netease'
import { addSpotifyTracks, createSpotifyPlaylist } from 'api/spotify'
import { logger } from 'modules/logger'
import { asyncSleep } from 'utils/timeout'

export class InsufficientDailyRecommendationSongsError extends Error {
  constructor(length: number) {
    super('netease: insufficient daily recommendation songs: ' + length)
  }
}

async function performSyncDailyRecommendation({
  syncId,
  nowISO,
  dailyFlushDate: nowDateInShanghai,
}: SyncContext) {
  const {
    recommendations: neteaseRecommendations,
    original: neteaseRecommendationsOriginal,
  } = await getNeteaseRecommendations()
  logger.info(
    `netease: got ${neteaseRecommendations.length} recommendation songs`,
  )

  if (neteaseRecommendations.length < 10) {
    throw new InsufficientDailyRecommendationSongsError(
      neteaseRecommendations.length,
    )
  }

  const spotifyTracks = await resolveSpotifySongsFromNeteaseSongs(
    neteaseRecommendations,
  )
  logger.info(`spotify: found ${spotifyTracks.length} tracks`)

  neteaseRecommendations.forEach((song) => {
    const track = spotifyTracks.find((track) => track.originalId === song.id)
    if (!track) {
      logger.warn(`spotify: netease song "${song.name}" not found in spotify`)
    } else {
      song.spotifyId = track.id
    }
  })

  const spotifyTrackUris = spotifyTracks.map((track) => track.uri)
  const spotifyPlaylistId = await createSpotifyPlaylist(
    'Netease Daily ' + nowDateInShanghai,
    `Netease Daily crawled at ${nowISO}`,
  )
  logger.info('spotify: created playlist ' + spotifyPlaylistId)
  await addSpotifyTracks(spotifyPlaylistId, spotifyTrackUris)
  logger.info('spotify: added tracks to playlist')

  persistDailyRecommendationSynchronizationContext({
    syncId,
    nowISO,
    nowDateInShanghai,
    neteaseRecommendations,
    neteaseRecommendationsOriginal,
    spotifyTracks,
  })
}

export async function syncDailyRecommendation(context: SyncContext) {
  try {
    await performSyncDailyRecommendation(context)
  } catch (err) {
    if (err instanceof InsufficientDailyRecommendationSongsError) {
      if ((context.dailyRecommendationRetries || 0) > 5) {
        logger.error(
          err,
          'netease: insufficient daily recommendation songs; giving up after 5 retries',
        )
        throw err
      }
      context.dailyRecommendationRetries =
        (context.dailyRecommendationRetries || 0) + 1

      logger.warn(err.message + '; retrying in 5 minutes')
      await asyncSleep(5 * 60 * 1000)
      await syncDailyRecommendation(context)
    } else {
      throw err
    }
  }
}
