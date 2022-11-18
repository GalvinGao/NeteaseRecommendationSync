import { NETEASE_CALENDAR_DAY_BEGINNING_TIME } from '../config'
import { DateTime } from 'luxon'

export const neteaseCalendarDate = (date: DateTime) => {
  return date
    .setZone('Asia/Shanghai')
    .minus(NETEASE_CALENDAR_DAY_BEGINNING_TIME)
}
