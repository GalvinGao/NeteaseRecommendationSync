import { dispatchNeteaseAuth } from 'action/neteaseAuth'
import { dispatchSpotifyAuth } from 'action/spotifyAuth'
import { syncNeteaseLikelist } from "action/sync/syncNeteaseLikelistToSpotify"

async function main() {
  await dispatchNeteaseAuth()
  await dispatchSpotifyAuth()
  await syncNeteaseLikelist()
}

main()
