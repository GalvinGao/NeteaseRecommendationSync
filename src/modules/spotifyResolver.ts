import { NeteaseSong } from 'api/netease'
import { searchSpotify } from 'api/spotify'
import { logger } from 'modules/logger'

export async function resolveSpotifySongsFromNeteaseSongs(
  neteaseRecommendations: NeteaseSong[],
) {
  return (
    await Promise.all(
      neteaseRecommendations.map(async (song) => {
        const track = await searchSpotify(song)
        if (!track) {
          logger.info(
            `spotify: netease song "${song.name}" not found in spotify`,
          )
        }
        return {
          ...track,
          originalId: song.id,
          originalName: song.name,
          originalArtists: song.artists.join(', '),
          originalAlbum: song.album,
          originalReason: song.reason,
        }
      }),
    )
  ).filter((track) => !!track.uri)
}
