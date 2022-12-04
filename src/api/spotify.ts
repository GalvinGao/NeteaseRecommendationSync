import { refreshSpotifyAccessToken } from 'action/spotifyAuth'
import { NeteaseSong } from 'api/netease'
import fastLevenshtein from 'fast-levenshtein'
import { logger } from 'modules/logger'
import fetch, { RequestInit } from 'node-fetch'
import { store } from 'store'

export async function spotifyApiRequest(
  path: string,
  init?: RequestInit | undefined,
): Promise<any> {
  const auth = store.getState().spotify.auth
  if (!auth) throw new Error('spotify: not logged in')

  if (auth.expiresAt < Date.now()) {
    logger.info('spotify: access token expired (by time), refreshing')
    // refresh token
    await refreshSpotifyAccessToken()
  }

  const response = await fetch('https://api.spotify.com' + path, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${auth.accessToken}`,
    },
  })
  if (response.status === 429) {
    logger.info('spotify: API rate limit exceeded, wait 30s to Rerequest')
    const wait = (timeout = 0) =>
      new Promise((res) => {
        setTimeout(() => {
          res(null)
        }, timeout)
      })
    await wait(1000 * 30)
    return spotifyApiRequest(path, init)
  }
  const json = (await response.json()) as any
  if (json.error && json.error.status === 401) {
    logger.info('spotify: access token expired (by response body), refreshing')
    // refresh token
    await refreshSpotifyAccessToken()
    return spotifyApiRequest(path, init)
  }

  if (response.status >= 400 || json.error) {
    logger.error(
      { status: response.status, body: json },
      'spotify: non-200 response',
    )
    throw new Error(
      `spotify: non-200 response: ${response.status} ${JSON.stringify(json)}`,
    )
  }

  return json
}

async function searchSpotifyNameArtist(song: NeteaseSong) {
  const query = [
    song.name,
    ...(song.artists.length > 0 ? [`${song.artists.join(' ')}`] : []),
  ].join(' ')

  const response = await spotifyApiRequest(
    `/v1/search?q=${encodeURIComponent(query)}&type=track&limit=3`,
  )
  if (response.tracks.items.length === 0) {
    return []
  }

  return response.tracks.items as any[]
}

async function searchSpotifyName(song: NeteaseSong) {
  const response = await spotifyApiRequest(
    `/v1/search?q=${encodeURIComponent(song.name)}&type=track&limit=3`,
  )
  if (response.tracks.items.length === 0) {
    return []
  }

  return response.tracks.items as any[]
}

export async function searchSpotify(song: NeteaseSong) {
  logger.debug(
    { song },
    `spotify: searching song "${song.name}" with multiple strategies`,
  )
  const matches = await Promise.all([
    searchSpotifyNameArtist(song),
    searchSpotifyName(song),
  ])
  const match = matches
    .filter((m) => !!m)
    .map((m) =>
      m.map((t: any, index: number) => ({
        ...t,
        distance: fastLevenshtein.get(song.name, t.name),
        index,
      })),
    )
    .flat()
    .sort(
      (a, b) =>
        // sort by distance, then by index (so that the first result is the best)
        a.distance - b.distance || a.index - b.index,
    )

  if (match.length === 0) {
    logger.info(`spotify: song "${song.name}" not found in spotify`)
    return null
  }

  const track = match[0]
  logger.info(
    `spotify: song "${song.name}" found in spotify: ${
      track.name
    } by ${track.artists.map((a: any) => a.name).join(', ')}`,
  )
  return track
}

export async function createSpotifyPlaylist(name: string, description: string) {
  const account = await spotifyApiRequest('/v1/me')
  const userId = account.id

  const playlist = await spotifyApiRequest(`/v1/users/${userId}/playlists`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      description,
      public: false,
    }),
  })
  return playlist.id
}

export async function listSpotifyPlaylists() {
  const playlists = await spotifyApiRequest(`/v1/me/playlists`)
  return playlists.items
}

export async function listSpotifyLikedSongs({ max = 50 }: { max?: number }) {
  const songs: any[] = []
  const limit = 20
  let offset = 0
  let response: any
  do {
    response = await spotifyApiRequest(
      `/v1/me/tracks?limit=${limit}&offset=${offset}`,
    )
    songs.push(...response.items)
    offset += limit
  } while (response.next && songs.length < max)
  return songs
}

export async function addSpotifyTracks(
  playlistId: string,
  trackUris: string[],
) {
  const modification = await spotifyApiRequest(
    `/v1/playlists/${playlistId}/tracks`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uris: trackUris,
      }),
    },
  )

  return modification.snapshot_id
}
