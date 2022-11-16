import { getNeteaseRecommendations, NeteaseSong ,getNeteaseRecommendPlayLists ,getNeteasePlayListAllTrack} from "api/netease";
import {
  addSpotifyTracks,
  createSpotifyPlaylist,
  searchSpotify,
} from "api/spotify";
import { mkdir, writeFile } from "fs/promises";
import { DateTime } from "luxon";
import { prisma } from "prisma";
import { store } from "store";
import { schedulerLastSyncChanged } from "store/schedulerSlice";
import { SYNC_LIKE, SYNC_RADAR } from "../config";

interface SyncContextSnapshot {
  syncId: string;
  neteaseRecommendations: any;
  spotifyTracks: any;
  summaryText: string;
}

async function saveSyncContextSnapshot(syncContext: SyncContextSnapshot) {
  const base = `state/snapshots/${syncContext.syncId}`;
  await mkdir(base, { recursive: true });
  await writeFile(
    `${base}/netease-recommendations.json`,
    JSON.stringify(syncContext.neteaseRecommendations, null, 2)
  );
  await writeFile(
    `${base}/spotify-tracks.json`,
    JSON.stringify(syncContext.spotifyTracks, null, 2)
  );
  await writeFile(`${base}/summary.md`, syncContext.summaryText);
}

export async function dispatchSyncRecommendations() {
  const now = DateTime.now();
  const nowISO = now.toISO();
  const nowDateInShanghai = now.setZone("Asia/Shanghai").toFormat("yyyy-MM-dd");
  const syncId = `${nowDateInShanghai}_${now.toMillis()}`;
  if(SYNC_LIKE){
    let {
      recommendations: neteaseRecommendations,
      original: neteaseRecommendationsOriginal,
    } = await getNeteaseRecommendations();
    console.log(
      "netease: got " + neteaseRecommendations.length + " recommendations"
    );
  
    const spotifyTracks = (
      await Promise.all(
        neteaseRecommendations.map(async (song) => {
          const track = await searchSpotify(song);
          if (!track) {
            console.log(`spotify: ${song.name} not found`);
          }
          return {
            ...track,
            originalId: song.id,
            originalName: song.name,
            originalArtists: song.artists.join(", "),
            originalAlbum: song.album,
            originalReason: song.reason,
          };
        })
      )
    ).filter((track) => track !== null);
    console.log("spotify: found " + spotifyTracks.length + " tracks");
  
    neteaseRecommendations.forEach((song) => {
      const track = spotifyTracks.find((track) => track.originalId === song.id);
      if (!track) {
        console.log(`spotify: ${song.name} not found`);
      } else {
        song.spotifyId = track.id;
      }
    });
  
    const spotifyTrackUris = spotifyTracks.map((track) => track.uri);
    const spotifyPlaylistId = await createSpotifyPlaylist(
      "Netease Daily " + nowDateInShanghai,
      `Netease Daily crawled at ${nowISO}`
    );
    console.log("spotify: created playlist " + spotifyPlaylistId);
    await addSpotifyTracks(spotifyPlaylistId, spotifyTrackUris);
    console.log("spotify: added tracks to playlist");
  
    saveSyncRecommendationsDispatch({
      syncId,
      nowISO,
      nowDateInShanghai,
      neteaseRecommendations,
      neteaseRecommendationsOriginal,
      spotifyTracks,
    });
  }
  if(SYNC_RADAR){
    let {playLists} = await getNeteaseRecommendPlayLists();
    let privateRadarId = playLists.find(playList=>(/^私人雷达/).test(playList.name))?.id || null
    let {
      tracks:neteasePrivateRadarTracks,
      original:neteasePrivateRadarTracksOriginal
    } = await getNeteasePlayListAllTrack(privateRadarId)
    console.log(
      "netease: got " + neteasePrivateRadarTracks.length + " song from privateRadar"
    );
  
    const spotifyTracks = (
      await Promise.all(
        neteasePrivateRadarTracks.map(async (song) => {
          const track = await searchSpotify(song);
          if (!track) {
            console.log(`spotify: ${song.name} not found`);
          }
          return {
            ...track,
            originalId: song.id,
            originalName: song.name,
            originalArtists: song.artists.join(", "),
            originalAlbum: song.album,
            originalReason: song.reason,
          };
        })
      )
    ).filter((track) => track !== null);
    console.log("spotify: found " + spotifyTracks.length + " tracks");
  
    neteasePrivateRadarTracks.forEach((song) => {
      const track = spotifyTracks.find((track) => track.originalId === song.id);
      if (!track) {
        console.log(`spotify: ${song.name} not found`);
      } else {
        song.spotifyId = track.id;
      }
    });
  
    const spotifyTrackUris = spotifyTracks.map((track) => track.uri);
    const spotifyPlaylistId = await createSpotifyPlaylist(
      "Netease privateRadar " + nowDateInShanghai,
      `Netease privateRadar crawled at ${nowISO}`
    );
    console.log("spotify: created playlist " + spotifyPlaylistId);
    await addSpotifyTracks(spotifyPlaylistId, spotifyTrackUris);
    console.log("spotify: added tracks to playlist");
  
    // saveSyncRecommendationsDispatch({
    //   syncId,
    //   nowISO,
    //   nowDateInShanghai,
    //   neteasePrivateRadarTracks,
    //   neteasePrivateRadarTracksOriginal,
    //   spotifyTracks,
    // });
  
  }

  
  store.dispatch(schedulerLastSyncChanged(nowISO));
  console.log("finished syncing recommendations at " + nowISO);
}

async function saveSyncRecommendationsDispatch({
  syncId,
  nowISO,
  nowDateInShanghai,
  neteaseRecommendations,
  neteaseRecommendationsOriginal,
  spotifyTracks,
}: {
  syncId: string;
  nowISO: string;
  nowDateInShanghai: string;
  neteaseRecommendations: NeteaseSong[];
  neteaseRecommendationsOriginal: any;
  spotifyTracks: any[];
}) {
  const summary = `## Netease Daily crawled at ${nowISO}

## Original Songs
${spotifyTracks
  .map(
    (track) =>
      `- ${track.originalName} (${track.originalArtists}) - ${track.originalAlbum} - ${track.originalReason}`
  )
  .join("\n")}`;

  await saveSyncContextSnapshot({
    syncId,
    neteaseRecommendations: neteaseRecommendationsOriginal,
    spotifyTracks: spotifyTracks,
    summaryText: summary,
  });

  console.log("saved sync context snapshot");

  const synchronization = await prisma.synchronization.create({
    data: {
      id: syncId,
      createdAt: nowISO,
      dailyRecommendationDate: nowDateInShanghai,
      neteaseSongSynchronization: {
        create: neteaseRecommendations.map((song) => ({
          neteaseId: song.id,
          name: song.name,
          artists: JSON.stringify(song.artists),
          album: song.album,
          reason: song.reason,
          spotifyId: song.spotifyId,
        })),
      },
      spotifySongSynchronization: {
        create: spotifyTracks.map((track) => ({
          spotifyId: track.id,
          name: track.name,
          artists: JSON.stringify(track.artists.map((artist) => artist.name)),
          album: track.album.name,
          neteaseId: track.originalId,
        })),
      },
    },
  });

  console.log("saved synchronization to database: " + synchronization.id);
}
