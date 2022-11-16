import { cookie, checkResponse } from "api/netease";
import { user_account, login_cellphone } from 'NeteaseCloudMusicApi'
import {
  NETEASE_MUSIC_PASSWORD,
  NETEASE_MUSIC_PHONE,
} from "config";
import { store } from "store";
import { neteaseLoggedIn } from "store/neteaseSlice";

async function neteaseVerifyTokenValidity() {
  const auth = store.getState().netease.cookie;
  if (!auth) return false;

  try {
    await user_account({cookie:cookie()});
    return true;
  } catch (e) {
    console.log("netease: token invalid, re-authenticating");
  }

  return false;
}

async function initiateNeteaseAuth() {
  console.log("netease: authenticating using phone and password");
  const response = await login_cellphone({
    phone: NETEASE_MUSIC_PHONE,
    password: NETEASE_MUSIC_PASSWORD,
  })
  const json = checkResponse(response)
  console.log("netease: successfully logged in");

  store.dispatch(neteaseLoggedIn("MUSIC_U=" + json.token));
}

export async function dispatchNeteaseAuth() {
  if (await neteaseVerifyTokenValidity()) return;

  return initiateNeteaseAuth();
}
