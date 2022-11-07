import { schedulerShouldSkip } from "action/scheduler";
import { dispatchSpotifyAuth } from "action/spotifyAuth";
import { dispatchSyncRecommendations } from "action/syncRecommendations";

import schedule from "node-schedule";
import { SYNC_TIME_PARSED, SYNC_TIME_TZ } from "./config";

async function update() {
  if (await schedulerShouldSkip()) return;
  await dispatchSpotifyAuth();
  await dispatchSyncRecommendations();
  console.log("update finished, will wait until next update schedule");
}

async function main() {
  await update();

  const rule = new schedule.RecurrenceRule();
  rule.hour = SYNC_TIME_PARSED.hour;
  rule.minute = SYNC_TIME_PARSED.minute;
  rule.second = SYNC_TIME_PARSED.second;
  rule.tz = SYNC_TIME_TZ;

  schedule.scheduleJob(rule, update);
}

main();
