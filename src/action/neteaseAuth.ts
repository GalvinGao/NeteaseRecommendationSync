import { getNeteaseUserDetail, loginNeteaseViaPhone } from 'api/netease'
import { NETEASE_MUSIC_PASSWORD, NETEASE_MUSIC_PHONE } from 'config'
import { logger } from 'modules/logger'
import { store } from 'store'
import { neteaseLoggedIn } from 'store/neteaseSlice'

async function neteaseVerifyTokenValidity() {
  try {
    await getNeteaseUserDetail()
    logger.info('netease: verify token validity: token is valid')
    return true
  } catch (e) {
    logger.warn('netease: verify token validity: token invalid or expired')
  }

  return false
}

async function initiateNeteaseAuth() {
  logger.info('netease: auth: authenticating using phone and password...')
  const response = await loginNeteaseViaPhone(
    NETEASE_MUSIC_PHONE,
    NETEASE_MUSIC_PASSWORD,
  )
  logger.info('netease: auth: successfully logged in using phone and password')

  store.dispatch(neteaseLoggedIn('MUSIC_U=' + response.token))
}

export async function dispatchNeteaseAuth() {
  if (await neteaseVerifyTokenValidity()) return

  return initiateNeteaseAuth()
}
