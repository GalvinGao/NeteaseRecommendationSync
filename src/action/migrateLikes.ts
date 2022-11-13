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
      liked: "desc",
    },
  });
  if (!spotify) {
    return null;
  }
  if (spotify.liked) {
    return spotify;
  }

  const netease = await prisma.synchronizationNeteaseSong.findFirst({
    where: {
      neteaseId: spotify.neteaseId,
      liked: true,
    },
    orderBy: {
      id: "desc",
      liked: "desc",
    },
  });
  if (netease?.liked) {
    console.log(`netease: song ${netease.neteaseId} already liked`);
    return spotify;
  }
  if (!netease) {
    console.log(`netease: song ${spotify.neteaseId} not found`);
    return spotify;
  }

  console.log(
    "migrating like",
    spotifySong.track.name,
    `(spotifyId=${spotifySong.track.id}, neteaseId=${spotify.neteaseId})`,
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

  await prisma.synchronizationSpotifySong.update({
    where: {
      id: spotify.id,
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
