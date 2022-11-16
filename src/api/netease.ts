import { store } from "store";
import { recommend_songs, recommend_resource ,playlist_track_all, like as likeRadio } from 'NeteaseCloudMusicApi'

export function cookie (){
  const cookie = store.getState().netease.cookie
  if (!cookie) {
    throw new Error("netease: cookie is not set, please login first");
  }
  return cookie
}

export function checkResponse (res:any){
  if (res.status !== 200) {
    console.log(
      "netease: non-200 body code response for request",
      res.status
    );
    throw new Error(
      `netease: fetch failed (non-200 body code response code): ${
        res.status
      } ${res.body}`
    );
  }
  return res.body;
}

export interface NeteaseSong {
  id: number;
  name: string;
  artists: string[];
  album: string;
  reason: string;
  spotifyId?: string;
}
export async function getNeteaseRecommendations(): Promise<{
  recommendations: NeteaseSong[];
  original: any;
}> {
  const json = await recommend_songs({cookie:cookie()})
  let res = checkResponse(json)
  return {
    recommendations: res.data.dailySongs.map((song: any) => ({
      id: song.id,
      name: song.name,
      artists: song.ar.map((artist: any) => artist.name),
      album: song.al.name,
      reason: song.reason,
    })),
    original: json,
  };
}

export async function getNeteaseRecommendPlayLists(): Promise<{
  playLists: any[];
}> {
  const json = await recommend_resource({cookie:cookie()});  
  let res = checkResponse(json)
  return {
    playLists: res.recommend,
  };
}

export async function getNeteasePlayListAllTrack(id: number): Promise<{
  tracks: NeteaseSong[];
  original: any;
}> {
  const json = await playlist_track_all({id,cookie:cookie()});
  let res = checkResponse(json)
  return {
    tracks: res.songs.map((song: any) => ({
      id: song.id,
      name: song.name,
      artists: song.ar.map((artist: any) => artist.name),
      album: song.al.name,
      reason: "",
    })),
    original: res,
  };
}


export async function likeNeteaseMusic(id: number,like: boolean=true) {
  return await likeRadio({id,like});
}
