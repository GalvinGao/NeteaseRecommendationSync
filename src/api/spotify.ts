import { getSpotifyAccessTokenWithRefreshToken } from 'action/spotifyAuth'
import { NeteaseSong } from 'api/netease'
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
    console.log('spotify: access token expired (by time), refreshing')
    // refresh token
    await getSpotifyAccessTokenWithRefreshToken()
  }

  const response = await fetch('https://api.spotify.com' + path, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${auth.accessToken}`,
    },
  })
  const json = (await response.json()) as any
  if (json.error && json.error.status === 401) {
    console.log('spotify: access token expired (by response body), refreshing')
    // refresh token
    await getSpotifyAccessTokenWithRefreshToken()
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

export async function searchSpotify(song: NeteaseSong) {
  const query = [
    song.name,
    ...(song.artists.length > 0 ? [`${song.artists.join(' ')}`] : []),
    // ...(song.album ? [`album:${song.album}`] : []),
  ].join(' ')

  console.log(`searching for ${JSON.stringify(song)} with query "${query}"`)

  const response = await spotifyApiRequest(
    `/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`,
  )
  if (response.tracks.items.length === 0) {
    return null
  }

  return response.tracks.items[0]
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
