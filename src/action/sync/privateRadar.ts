import { SyncContext } from 'action/sync/dispatcher'
import {
  getNeteasePlayListAllTrack,
  getNeteaseRecommendPlayLists,
} from 'api/netease'
import { addSpotifyTracks, createSpotifyPlaylist } from 'api/spotify'
import { logger } from 'modules/logger'
import { resolveSpotifySongsFromNeteaseSongs } from 'modules/spotifyResolver'

export async function syncPrivateRadar({
  nowISO,
  dailyFlushDate: nowDateInShanghai,
}: SyncContext) {
  const { playLists } = await getNeteaseRecommendPlayLists()
  const privateRadarId =
    playLists.find((playList) => /^私人雷达/.test(playList.name))?.id || null
  if (!privateRadarId) {
    logger.error('netease: private radar playlist not found')
    return
  }

  const { tracks: neteasePrivateRadarTracks } =
    await getNeteasePlayListAllTrack(privateRadarId)
  logger.info(
    `netease: got ${neteasePrivateRadarTracks.length} song from privateRadar`,
  )

  const spotifyTracks = await resolveSpotifySongsFromNeteaseSongs(
    neteasePrivateRadarTracks,
  )
  logger.info(`spotify: found ${spotifyTracks.length} tracks`)

  neteasePrivateRadarTracks.forEach((song) => {
    const track = spotifyTracks.find((track) => track.originalId === song.id)
    if (!track) {
      logger.warn(`spotify: netease song "${song.name}" not found in spotify`)
    } else {
      song.spotifyId = track.id
    }
  })

  const spotifyTrackUris = spotifyTracks.map((track) => track.uri)
  const spotifyPlaylistId = await createSpotifyPlaylist(
    'Netease privateRadar ' + nowDateInShanghai,
    `Netease privateRadar crawled at ${nowISO}`,
  )
  logger.info(`spotify: created playlist ${spotifyPlaylistId}`)
  await addSpotifyTracks(spotifyPlaylistId, spotifyTrackUris)
  logger.info('spotify: added tracks to playlist')
}
