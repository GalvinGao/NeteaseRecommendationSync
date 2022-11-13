import { dispatchMigrateLikes } from "action/migrateLikes";
import { schedulerShouldSkip } from "action/scheduler";
import { dispatchSpotifyAuth } from "action/spotifyAuth";
import { dispatchSyncRecommendations } from "action/syncRecommendations";
import { SYNC_TIME_PARSED, SYNC_TIME_TZ } from "config";

import schedule from "node-schedule";

async function sync() {
  if (await schedulerShouldSkip()) return;
  await dispatchSpotifyAuth();
  await dispatchSyncRecommendations();
  console.log("update finished, will wait until next update schedule");
}

async function migrate() {
  await dispatchMigrateLikes();
  console.log(
    "likes migration finished, will wait until next migration schedule"
  );
}

async function addSchedule(
  name: string,
  hour: schedule.RecurrenceSegment,
  minute: schedule.RecurrenceSegment,
  second: schedule.RecurrenceSegment,
  tz: string,
  cb: () => Promise<void>
) {
  const rule = new schedule.RecurrenceRule();
  rule.hour = hour;
  rule.minute = minute;
  rule.second = second;
  rule.tz = tz;

  const job = schedule.scheduleJob(rule, (time) => {
    console.log(`scheduler: ${name}: timer fired at`, time);
    cb().finally(() => {
      console.log(
        `scheduler: ${name}: cb invoked; next timer will fire at`,
        job.nextInvocation().toString()
      );
    });
  });
  if (!job) {
    console.error(`scheduler: ${name}: failed to schedule job: empty job`);
    return;
  }
  console.log(
    `scheduler: scheduled ${name}; next run at:`,
    job.nextInvocation().toString()
  );
}

async function main() {
  await sync();
  await migrate();

  addSchedule(
    "sync",
    Array(4)
      .fill(SYNC_TIME_PARSED.hour)
      .map((el, i) => (el + (i * 6 + 3)) % 24), // every 6 hours, starting from SYNC_TIME_PARSED.hour, offset by [3, 9, 15, 21] hours
    // which if SYNC_TIME_PARSED.hour is 6, this will be [9, 15, 21, 3]
    SYNC_TIME_PARSED.minute,
    SYNC_TIME_PARSED.second,
    SYNC_TIME_TZ,
    sync
  );
  addSchedule(
    "migrate",
    SYNC_TIME_PARSED.hour,
    SYNC_TIME_PARSED.minute,
    SYNC_TIME_PARSED.second,
    SYNC_TIME_TZ,
    migrate
  );
}

main();
