import {
  login_cellphone,
  recommend_resource as neteaseGetPersonalFM,
  playlist_track_all as neteaseGetPlaylistTracks,
  recommend_songs as neteaseGetRecommendations,
  like as neteaseLikeResource,
  user_account,
} from 'NeteaseCloudMusicApi'
import { logger } from 'modules/logger'
import { store } from 'store'

function getNeteaseAuthCookie() {
  const cookie = store.getState().netease.cookie
  if (!cookie) {
    throw new Error('netease: cookie is not set, please login first')
  }
  return cookie
}

function processNeteaseResponse(res: any) {
  if (res.status !== 200) {
    logger.warn(
      {
        status: res.status,
        body: res.body,
      },
      'netease: non-200 body code response for request',
    )
    throw new Error(
      `netease: fetch failed (non-200 body code response code): ${res.status} ${res.body}`,
    )
  }
  return res.body
}

export interface NeteaseSong {
  id: number
  name: string
  artists: string[]
  album: string
  reason: string
  spotifyId?: string
}

export async function getNeteaseRecommendations(): Promise<{
  recommendations: NeteaseSong[]
  original: any
}> {
  const json = await neteaseGetRecommendations({
    cookie: getNeteaseAuthCookie(),
  })
  const res = processNeteaseResponse(json)
  return {
    recommendations: res.data.dailySongs.map((song: any) => ({
      id: song.id,
      name: song.name,
      artists: song.ar.map((artist: any) => artist.name),
      album: song.al.name,
      reason: song.reason,
    })),
    original: json,
  }
}

export async function getNeteaseRecommendPlayLists(): Promise<{
  playLists: any[]
}> {
  const json = await neteaseGetPersonalFM({ cookie: getNeteaseAuthCookie() })
  const res = processNeteaseResponse(json)
  return {
    playLists: res.recommend,
  }
}

export async function getNeteasePlayListAllTrack(id: number): Promise<{
  tracks: NeteaseSong[]
  original: any
}> {
  const json = await neteaseGetPlaylistTracks({
    id,
    cookie: getNeteaseAuthCookie(),
  })
  const res = processNeteaseResponse(json)
  return {
    tracks: res.songs.map((song: any) => ({
      id: song.id,
      name: song.name,
      artists: song.ar.map((artist: any) => artist.name),
      album: song.al.name,
      reason: '',
    })),
    original: res,
  }
}

export async function likeNeteaseMusic(id: number, like: boolean = true) {
  return await neteaseLikeResource({ id, like })
}

export async function loginNeteaseViaPhone(
  phone: string,
  password: string,
): Promise<any> {
  const json = await login_cellphone({ phone, password })
  const res = processNeteaseResponse(json)
  return res
}

export async function getNeteaseUserDetail() {
  const json = await user_account({ cookie: getNeteaseAuthCookie() })
  const res = processNeteaseResponse(json)
  return res
}
