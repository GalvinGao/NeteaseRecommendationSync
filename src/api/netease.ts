import { NETEASE_MUSIC_API_SERVER } from "config";
import fetch from "node-fetch";
import { store } from "store";

export async function neteaseApiRequest(path: string) {
  const cookie = store.getState().netease.cookie;
  if (!cookie) {
    throw new Error("netease: cookie is not set, please login first");
  }

  return fetch(`${NETEASE_MUSIC_API_SERVER}${path}`, {
    headers: {
      Cookie: cookie,
    },
  }).then((res) => {
    if (res.status !== 200) {
      console.log("netease: non-200 response for request", path, res.status);
      throw new Error(
        `netease: fetch failed (non-200 response code) ${res.status} ${res.statusText}`
      );
    }
    return res;
  });
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
  const request = await neteaseApiRequest("/recommend/songs");
  const list = (await request.json()) as any;
  return {
    recommendations: list.data.dailySongs.map((song: any) => ({
      id: song.id,
      name: song.name,
      artists: song.ar.map((artist: any) => artist.name),
      album: song.al.name,
      reason: song.reason,
    })),
    original: list,
  };
}

export async function likeNeteaseMusic(id: number) {
  const request = await neteaseApiRequest(`/like?id=${id}&like=true`);
  return request.json();
}
