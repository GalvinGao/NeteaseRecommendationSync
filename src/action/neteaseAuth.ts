import { neteaseApiRequest } from "api/netease";
import { NETEASE_MUSIC_PASSWORD, NETEASE_MUSIC_PHONE } from "config";
import { store } from "store";
import { neteaseLoggedIn } from "store/neteaseSlice";

async function neteaseVerifyTokenValidity() {
  const auth = store.getState().netease.cookie;
  if (!auth) return false;

  const response = await neteaseApiRequest("/login/refresh");
  if (!response.ok || response.status >= 400) {
    return false;
  }

  console.log("netease: token is valid");

  return true;
}

async function initiateNeteaseAuth() {
  const searchParams = new URLSearchParams({
    phone: NETEASE_MUSIC_PHONE,
    password: NETEASE_MUSIC_PASSWORD,
  });
  const response = await neteaseApiRequest(
    "/login/cellphone?" + searchParams.toString()
  );
  const cookie = response.headers.get("set-cookie");
  if (!cookie) {
    throw new Error(
      "netease: failed to login: cookie not set; api response: " +
        (await response.text())
    );
  }

  store.dispatch(neteaseLoggedIn(cookie));
}

export async function dispatchNeteaseAuth() {
  if (await neteaseVerifyTokenValidity()) return;

  return initiateNeteaseAuth();
}
