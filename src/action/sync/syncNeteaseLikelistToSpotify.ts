import {
  getNeteasePlayListAllTrack,
  getNeteaseUserDetail,
  getNeteaseUserPlaylist,
} from 'api/netease'
import { addSpotifyTracks, createSpotifyPlaylist } from 'api/spotify'
import { DateTime } from 'luxon'
import { logger } from 'modules/logger'
import { resolveSpotifySongsFromNeteaseSongs } from 'modules/spotifyResolver'

export async function syncNeteaseLikelist() {
  const now = DateTime.now()
  const nowISO = now.toISO()
  const nowDateInShanghai = now.setZone('Asia/Shanghai').toFormat('yyyy-MM-dd')

  const userDetail = await getNeteaseUserDetail()
  const subcount = await getNeteaseUserPlaylist(userDetail.account.id)
  const likelistNameReg = new RegExp(
    `^${userDetail.profile.nickname}喜欢的音乐$`,
  )
  const userLikeList =
    subcount.playlist.find((playList) => likelistNameReg.test(playList.name)) ||
    subcount.playlist[0]
  const { tracks: neteaseLikelistTracks } = await getNeteasePlayListAllTrack(
    userLikeList.id,
  )

  const spotifyTracks = await resolveSpotifySongsFromNeteaseSongs(
    neteaseLikelistTracks,
  )
  logger.info(`spotify: found ${spotifyTracks.length} tracks`)

  neteaseLikelistTracks.forEach((song) => {
    const track = spotifyTracks.find((track) => track.originalId === song.id)
    if (!track) {
      logger.warn(`spotify: netease song "${song.name}" not found in spotify`)
    } else {
      song.spotifyId = track.id
    }
  })

  const spotifyTrackUris = spotifyTracks.map((track) => track.uri)
  const spotifyPlaylistId = await createSpotifyPlaylist(
    `${userLikeList.name} ${nowDateInShanghai}`,
    `Netease likelist crawled at ${nowISO}`,
  )
  logger.info(`spotify: created playlist ${spotifyPlaylistId}`)
  logger.info('spotify: add tracks to playlist,this takes time')
  for (const uri of spotifyTrackUris) {
    await addSpotifyTracks(spotifyPlaylistId, [uri])
  }
  logger.info('spotify: complete')
}
