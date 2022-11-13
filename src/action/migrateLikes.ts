import { SynchronizationSpotifySong } from "@prisma/client";
import { likeNeteaseMusic } from "api/netease";
import { listSpotifyLikedSongs } from "api/spotify";
import pLimit from "p-limit";
import { prisma } from "prisma";

async function migrateLike(
  spotifySong: any
): Promise<SynchronizationSpotifySong | null> {
  const spotify = await prisma.synchronizationSpotifySong.findFirst({
    where: {
      spotifyId: spotifySong.track.id,
    },
    orderBy: {
      id: "desc",
    },
  });
  if (!spotify) {
    return null;
  }

  const netease = await prisma.synchronizationNeteaseSong.findFirst({
    where: {
      neteaseId: spotify.neteaseId,
    },
    orderBy: {
      id: "desc",
    },
  });
  if (!netease) {
    console.warn(
      `netease: song ${spotify.neteaseId} not found for spotify song ${spotify.spotifyId}`
    );
    return null;
  }

  if (netease.liked) {
    console.log(`netease: song ${netease.neteaseId} already liked`);
    return spotify;
  }

  console.log(
    "migrating like",
    spotifySong.track.name,
    "to",
    spotify.neteaseId
  );
  await likeNeteaseMusic(spotify.neteaseId);

  await prisma.synchronizationNeteaseSong.update({
    where: {
      id: netease.id,
    },
    data: {
      liked: true,
    },
  });

  return spotify;
}

export async function dispatchMigrateLikes() {
  const likes = await listSpotifyLikedSongs({ max: 60 }); // list recent 60 likes
  console.log("spotify: got " + likes.length + " liked songs");

  const limiter = pLimit(1); // netease has got a very strict rate limit so we need to limit the concurrency

  const migrations = await (Promise.all(
    likes.map((song) => limiter(() => migrateLike(song)))
  ) as Promise<(SynchronizationSpotifySong | null)[]>);
  const migrated = migrations.filter(
    (m) => m !== null
  ) as SynchronizationSpotifySong[];

  console.log(
    "migrate likes: done; migrated: " +
      migrated.length +
      " songs: " +
      migrated.map((m) => m.name).join(", ")
  );
}
