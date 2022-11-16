import { logger } from 'modules/logger'
import schedule from 'node-schedule'

export async function addSchedule(
  name: string,
  hour: schedule.RecurrenceSegment,
  minute: schedule.RecurrenceSegment,
  timezone: string,
  task: () => Promise<void>,
) {
  const rule = new schedule.RecurrenceRule()
  rule.hour = hour
  rule.minute = minute
  rule.tz = timezone

  const job = schedule.scheduleJob(rule, (time) => {
    logger.info(`scheduler: ${name}: timer fired`)
    task().finally(() => {
      logger.info(
        `scheduler: ${name}: task finished; next timer will fire at ${job
          .nextInvocation()
          .toString()}`,
      )
    })
  })
  if (!job) {
    logger.error(
      `scheduler: ${name}: failed to schedule job: unexpected empty job`,
    )
    return
  }
  logger.info(
    `scheduler: scheduled ${name} for next run at: ${job
      .nextInvocation()
      .toString()}`,
  )
}
