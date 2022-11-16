import { getNeteaseUserDetail, loginNeteaseViaPhone } from 'api/netease'
import { NETEASE_MUSIC_PASSWORD, NETEASE_MUSIC_PHONE } from 'config'
import { store } from 'store'
import { neteaseLoggedIn } from 'store/neteaseSlice'

async function neteaseVerifyTokenValidity() {
  try {
    await getNeteaseUserDetail()
    return true
  } catch (e) {
    console.warn('netease: token invalid')
  }

  return false
}

async function initiateNeteaseAuth() {
  console.log('netease: authenticating using phone and password')
  const response = await loginNeteaseViaPhone(
    NETEASE_MUSIC_PHONE,
    NETEASE_MUSIC_PASSWORD,
  )
  console.log('netease: successfully logged in')

  store.dispatch(neteaseLoggedIn('MUSIC_U=' + response.token))
}

export async function dispatchNeteaseAuth() {
  if (await neteaseVerifyTokenValidity()) return

  return initiateNeteaseAuth()
}
