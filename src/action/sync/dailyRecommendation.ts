import { resolveSpotifySongsFromNeteaseSongs } from '../../modules/spotifyResolver'
import { SyncContext } from 'action/sync/dispatcher'
import { persistDailyRecommendationSynchronizationContext } from 'action/sync/snapshot'
import { getNeteaseRecommendations } from 'api/netease'
import { addSpotifyTracks, createSpotifyPlaylist } from 'api/spotify'
import { logger } from 'modules/logger'

export async function syncDailyRecommendation({
  syncId,
  nowISO,
  nowDateInShanghai,
}: SyncContext) {
  const {
    recommendations: neteaseRecommendations,
    original: neteaseRecommendationsOriginal,
  } = await getNeteaseRecommendations()
  logger.info(
    `netease: got ${neteaseRecommendations.length} recommendation songs`,
  )

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
