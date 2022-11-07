import {
  OAUTH_REDIRECT_SERVER_PORT,
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
} from "config";
import http from "http";
import fetch from "node-fetch";
import { store } from "store";
import { spotifyLoggedIn } from "store/spotifySlice";

const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
const SPOTIFY_AUTH_SCOPES = [
  "playlist-modify-public",
  "playlist-modify-private",
  "user-library-modify",
];

function getSpotifyOAuthRequestUrl(redirectUri: string) {
  const url = new URL(SPOTIFY_AUTH_URL);
  url.searchParams.append("response_type", "code");
  url.searchParams.append("client_id", SPOTIFY_CLIENT_ID);
  url.searchParams.append("scope", SPOTIFY_AUTH_SCOPES.join(" "));
  url.searchParams.append("redirect_uri", redirectUri);
  return url.toString();
}

async function getSpotifyAccessTokenWithOAuthAuthorizationCode(
  redirectUri: string,
  code: string
): Promise<any> {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(
        `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
      ).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });
  const json = await response.json();
  return json;
}

export async function getSpotifyAccessTokenWithRefreshToken() {
  const auth = store.getState().spotify.auth;
  if (!auth) throw new Error("spotify: not logged in");

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(
        `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
      ).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: auth.refreshToken,
    }),
  });
  const json = (await response.json()) as any;
  store.dispatch(
    spotifyLoggedIn({
      accessToken: json.access_token,
      refreshToken: auth.refreshToken,
      expiresAt: Date.now() + json.expires_in * 1000,
    })
  );
}

export async function spotifyVerifyTokenValidity() {
  const auth = store.getState().spotify.auth;
  if (!auth) {
    console.log("spotify: not logged in");
    return false;
  }

  if (auth.expiresAt < Date.now()) {
    console.log("spotify: access token expired (by time), refreshing");
    // refresh token
    try {
      await getSpotifyAccessTokenWithRefreshToken();
      return true;
    } catch (e) {
      console.log("spotify: refresh token failed:", e);
      return false;
    }
  }

  console.log("spotify: access token valid in time");
  return true;
}

async function initiateSpotifyOAuth() {
  return new Promise<void>(async (resolve) => {
    const serverUri = `http://localhost:${OAUTH_REDIRECT_SERVER_PORT}`;
    const redirectPath = "/oauth/spotify/callback";
    const redirectUri = `${serverUri}${redirectPath}`;
    const authUrl = getSpotifyOAuthRequestUrl(redirectUri);

    // create a http server on a random port that is not in use
    const server = http.createServer((req, res) => {
      const url = new URL(req.url || "", serverUri);
      if (url.pathname === redirectPath) {
        // handle spotify callback
        const code = url.searchParams.get("code");
        if (code) {
          getSpotifyAccessTokenWithOAuthAuthorizationCode(
            redirectUri,
            code
          ).then((payload) => {
            store.dispatch(
              spotifyLoggedIn({
                accessToken: payload.access_token,
                refreshToken: payload.refresh_token,
                expiresAt: Date.now() + payload.expires_in * 1000,
              })
            );
            res.end("Logged in! You can close this window now.");
            server.close();
            resolve();
          });
        } else {
          res.end("Login failed; see console for details.");
        }
      } else {
        res.end("Invalid request");
      }
    });

    server.listen(OAUTH_REDIRECT_SERVER_PORT, () => {
      // open spotify auth url in browser
      console.log(
        "Open this URL in your browser to continue with Spotify OAuth:",
        authUrl
      );
    });
  });
}

export async function dispatchSpotifyAuth() {
  if (await spotifyVerifyTokenValidity()) return;

  return initiateSpotifyOAuth();
}
