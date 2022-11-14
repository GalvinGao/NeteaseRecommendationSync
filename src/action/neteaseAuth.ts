import { neteaseApiRequest } from "api/netease";
import {
  NETEASE_MUSIC_API_SERVER,
  NETEASE_MUSIC_PASSWORD,
  NETEASE_MUSIC_PHONE,
} from "config";
import fetch from "node-fetch";
import { store } from "store";
import { neteaseLoggedIn } from "store/neteaseSlice";
import { formatResponseError } from "utils/responseError";

async function neteaseVerifyTokenValidity() {
  const auth = store.getState().netease.cookie;
  if (!auth) return false;

  try {
    await neteaseApiRequest("/user/account");
    return true;
  } catch (e) {
    console.log("netease: token invalid, re-authenticating");
  }

  return false;
}

async function initiateNeteaseAuth() {
  console.log("netease: authenticating using phone and password");
  const searchParams = new URLSearchParams({
    phone: NETEASE_MUSIC_PHONE,
    password: NETEASE_MUSIC_PASSWORD,
  });
  const response = await fetch(
    NETEASE_MUSIC_API_SERVER + "/login/cellphone?" + searchParams.toString()
  );
  if (!response.ok || response.status >= 400) {
    throw new Error(
      "netease: failed to initiate auth: " +
        (await formatResponseError(response))
    );
  }

  const json = (await response.json()) as any;
  if (!json) {
    throw new Error("netease: failed to login: empty body");
  }

  console.log("netease: successfully logged in");

  store.dispatch(neteaseLoggedIn("MUSIC_U=" + json.token));
}

export async function dispatchNeteaseAuth() {
  if (await neteaseVerifyTokenValidity()) return;

  return initiateNeteaseAuth();
}
