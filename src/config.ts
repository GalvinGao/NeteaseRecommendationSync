import * as dotenv from 'dotenv'
import { DateTime } from 'luxon'

dotenv.config()

function getRequiredEnvVar(name: string): string {
  const value = process.env[name]
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

// Obtain Spotify Client ID and Secret at https://developer.spotify.com/dashboard/applications
export const SPOTIFY_CLIENT_ID = getRequiredEnvVar('SPOTIFY_CLIENT_ID')
export const SPOTIFY_CLIENT_SECRET = getRequiredEnvVar('SPOTIFY_CLIENT_SECRET')

export const SYNC_TIME_TZ = 'Asia/Shanghai'

// SYNC_TIME is the time to sync recommendations, in format of "HH:mm" (24-hour clock)
// Timezone of SYNC_TIME is defined as Asia/Shanghai and is not configurable due to the nature
// of interacting with Netease API in which is also in Asia/Shanghai.
export const SYNC_TIME = process.env.SYNC_TIME || '06:10'

export const SYNC_TIME_PARSED = DateTime.fromFormat(SYNC_TIME, 'HH:mm', {
  zone: SYNC_TIME_TZ,
})

export const OAUTH_REDIRECT_SERVER_PORT = parseInt(
  process.env.OAUTH_REDIRECT_SERVER_PORT || '3000',
)

export const NETEASE_MUSIC_PHONE = getRequiredEnvVar('NETEASE_MUSIC_PHONE')
export const NETEASE_MUSIC_PASSWORD = getRequiredEnvVar(
  'NETEASE_MUSIC_PASSWORD',
)

export const SYNC_DAILY = getRequiredEnvVar('SYNC_DAILY') === 'true'
export const SYNC_RADAR = getRequiredEnvVar('SYNC_RADAR') === 'true'
