import { SynchronizationSpotifySong } from '@prisma/client'

import { likeNeteaseMusic } from 'api/netease'
import { listSpotifyLikedSongs } from 'api/spotify'
import { logger } from 'modules/logger'
import pLimit from 'p-limit'
import { prisma } from 'prisma'
import { sleep } from 'utils/chrono'

async function migrateLike(
  spotifySong: any,
): Promise<SynchronizationSpotifySong | null> {
  const spotify = await prisma.synchronizationSpotifySong.findFirst({
    where: {
      spotifyId: spotifySong.track.id,
    },
    orderBy: {
      id: 'desc',
    },
  })
  if (!spotify) {
    return null
  }

  const spotifyAnyLikedSong = await prisma.synchronizationSpotifySong.findFirst(
    {
      where: {
        spotifyId: spotifySong.track.id,
        liked: true,
      },
      orderBy: {
        id: 'desc',
      },
    },
  )
  if (spotifyAnyLikedSong) {
    logger.info(
      `like migration: song "${spotifySong.track.name}": like already migrated`,
    )
    return null
  }

  const netease = await prisma.synchronizationNeteaseSong.findFirst({
    where: {
      neteaseId: spotify.neteaseId,
    },
    orderBy: {
      id: 'desc',
    },
  })
  if (!netease) {
    logger.warn(`like migration: netease: song ${spotify.neteaseId} not found`)
    return null
  }

  logger.info(
    `like migration: migrating song "${spotifySong.track.name}" to netease with neteaseId ${spotify.neteaseId}`,
  )
  await likeNeteaseMusic(spotify.neteaseId, true)
  await sleep(15000)

  await prisma.synchronizationNeteaseSong.update({
    where: {
      id: netease.id,
    },
    data: {
      liked: true,
    },
  })

  await prisma.synchronizationSpotifySong.update({
    where: {
      id: spotify.id,
    },
    data: {
      liked: true,
    },
  })

  return spotify
}

export async function dispatchMigrateLikes() {
  logger.info('like migration: started')
  const likes = await listSpotifyLikedSongs({ max: 200 }) // list recent likes
  logger.info(`spotify: got ${likes.length} liked songs`)

  const limiter = pLimit(1) // netease has got a very strict rate limit so we need to limit the concurrency

  const migrations = await (Promise.all(
    likes.map((song) => limiter(() => migrateLike(song))),
  ) as Promise<(SynchronizationSpotifySong | null)[]>)
  const migrated = migrations.filter(
    (m) => m !== null,
  ) as SynchronizationSpotifySong[]

  logger.info(
    {
      songs: migrated.map((m) => m.name),
    },
    `migrate likes: migrated ${migrated.length} songs`,
  )
}
