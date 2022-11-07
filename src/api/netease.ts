import fetch from "node-fetch";
import { store } from "store";

export async function neteaseApiRequest(path: string) {
  const cookie = store.getState().netease.cookie;
  if (!cookie) {
    throw new Error("netease: cookie is not set, please login first");
  }

  return fetch(`${store.getState().netease.server}${path}`, {
    headers: {
      Cookie: cookie,
    },
  });
}

export interface NeteaseSong {
  name: string;
  artists: string[];
  album: string;
  reason: string;
}

export async function getNeteaseRecommendations(): Promise<{
  recommendations: NeteaseSong[];
  recommendationsOriginal: any;
}> {
  const list = (await (
    await neteaseApiRequest("/recommend/songs")
  ).json()) as any;
  return {
    recommendations: list.data.dailySongs.map((song: any) => ({
      name: song.name,
      artists: song.ar.map((artist: any) => artist.name),
      album: song.al.name,
      reason: song.reason,
    })),
    recommendationsOriginal: list,
  };
}
