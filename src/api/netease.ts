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
  })
    .then((res) => {
      if (res.status !== 200) {
        console.log(
          "netease: non-200 http status response for request",
          path,
          res.status
        );
        throw new Error(
          `netease: fetch failed (non-200 http status response code) ${res.status} ${res.statusText}`
        );
      }
      return res;
    })
    .then(async (res) => {
      const json = (await res.json()) as any;
      if (json.code !== 200) {
        console.log(
          "netease: non-200 body code response for request",
          path,
          json.code
        );
        throw new Error(
          `netease: fetch failed (non-200 body code response code): ${
            res.status
          } ${JSON.stringify(json)}`
        );
      }
      return json;
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
  const json = await neteaseApiRequest("/recommend/songs");
  return {
    recommendations: json.data.dailySongs.map((song: any) => ({
      id: song.id,
      name: song.name,
      artists: song.ar.map((artist: any) => artist.name),
      album: song.al.name,
      reason: song.reason,
    })),
    original: json,
  };
}

export async function likeNeteaseMusic(id: number) {
  return await neteaseApiRequest(`/like?id=${id}&like=true`);
}
