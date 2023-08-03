import {
  APIBaseResponse,
  Response,
  login_cellphone,
  recommend_resource as neteaseGetPersonalFM,
  playlist_track_all as neteaseGetPlaylistTracks,
  recommend_songs as neteaseGetRecommendations,
  like as neteaseLikeResource,
  login_refresh as neteaseRefreshToken,
  playlist_tracks,
  user_account,
  user_playlist,
} from 'NeteaseCloudMusicApi'
import { uniqBy } from 'lodash'
import { logger } from 'modules/logger'
import { store } from 'store'
import { neteaseCookieChanged } from 'store/neteaseSlice'

function getNeteaseAuthCookie() {
  const cookie = store.getState().netease.cookie
  if (!cookie) {
    throw new Error('netease: cookie is not set, please login first')
  }
  return cookie
}

export function processNeteaseResponse<T = APIBaseResponse>(res: Response): T {
  if (res.status !== 200 || res.body.code !== 200) {
    const err = new Error(
      `netease: fetch failed (non-200 body code response code): ${res.status} ${res.body}`,
    )
    logger.warn(
      {
        status: res.status,
        body: res.body,
      },
      'netease: non-200 body code response for request',
    )
    logger.warn(err.stack)
    throw err
  }
  if (res.cookie && res.cookie.length > 0) {
    const currentCookies = store.getState().netease.cookie
    const cookies = res.cookie
      .map((cookie) => cookie.split(';', 1)[0])
      .map((cookie) => cookie.split('=', 2))
      .filter((cookie) => cookie.length === 2)

    const uniqCookies = uniqBy(cookies, (cookie) => cookie[0])

    // mergedCookies merges uniqCookies and currentCookies
    const mergedCookies = uniqCookies
      .map((cookie) => cookie.join('='))
      .concat(currentCookies ? currentCookies.split('; ') : [])
      .join('; ')

    store.dispatch(neteaseCookieChanged(mergedCookies))
  }
  return res.body as T
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
  const res = processNeteaseResponse(json) as any
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
  const res = processNeteaseResponse(json) as any
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
  const res = processNeteaseResponse(json) as any
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
  const res = await neteaseLikeResource({
    id,
    like,
    cookie: getNeteaseAuthCookie(),
  })
  const json = processNeteaseResponse(res)
  return json
}

export async function loginNeteaseViaPhone(
  phone: string,
  password: string,
): Promise<any> {
  const json = await login_cellphone({ phone, password })
  const res = processNeteaseResponse(json) as any
  return res
}

export async function getNeteaseUserDetail() {
  const json = await user_account({ cookie: getNeteaseAuthCookie() })
  const res = processNeteaseResponse(json) as any
  return res
}

export async function getNeteaseUserPlaylist(uid: number | string) {
  const json = await user_playlist({ cookie: getNeteaseAuthCookie(), uid })
  const res = processNeteaseResponse(json) as any
  return res
}

export async function getNeteaseUserLikeList() {
  const userDetail = await getNeteaseUserDetail()
  const subcount = await getNeteaseUserPlaylist(userDetail.account.id)
  const likelistNameReg = new RegExp(`.*喜欢的音乐$`)
  const userLikeList =
    subcount.playlist.find((playList) => likelistNameReg.test(playList.name)) ||
    subcount.playlist[0]

  return userLikeList
}

export async function editNeteasePlaylistSong(
  op: 'add' | 'del',
  playlistId: number,
  songIds: number[],
) {
  const json = await playlist_tracks({
    op,
    pid: playlistId,
    tracks: songIds.join(','),
    cookie: getNeteaseAuthCookie(),
  })
  const res = processNeteaseResponse(json) as any
  return res
}

export async function refreshNeteaseToken() {
  const json = await neteaseRefreshToken({ cookie: getNeteaseAuthCookie() })
  const res = processNeteaseResponse(json) as any
  return res
}
