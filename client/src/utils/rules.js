/*
 * Moving-date rules ("3rd Sunday of June"), shared by the dialog and the calendar.
 * Same numbering as the backend: month 1–12, weekday 0–6 (Sunday = 0), week 1–4 or -1 (last).
 */

import dayjs from 'dayjs'

// Dropdown options for the dialog
export const WEEK_OPTIONS = [
    { value: 1, label: '1st' },
    { value: 2, label: '2nd' },
    { value: 3, label: '3rd' },
    { value: 4, label: '4th' },
    { value: -1, label: 'Last' },
]
export const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
]

// True when the occasion uses a rule instead of a fixed date
export function isMoving(occasion) {
    return occasion.rule_month  != null     // != also catches undefined
}

// The rule's date in a given year, as a dayjs date (same math as the backend's _rule_date)
export function ruleDate(occasion, year) {
    const { rule_week: week, rule_weekday: weekday, rule_month: month } = occasion
    const firstDay = dayjs(new Date(year, month - 1, 1))   // JS months start at 0

    if (week === -1) {
        // "last" -> start at the month's final day and step back to the weekday
        const lastDay = firstDay.endOf('month').startOf('day')
        const daysBack = (lastDay.day() - weekday + 7) % 7    // + 7 keeps it from going negative
        return lastDay.subtract(daysBack, 'day')
    }
    // "nth": find the first matching weekday, then add whole weeks
    const daysAhead = (weekday - firstDay.day() + 7) % 7
    return firstDay.add(daysAhead + 7 * (week - 1), 'day')
}

// "3rd Sunday of June" / "Last Monday of May"
export function describeRule(occasion) {
    const week = WEEK_OPTIONS.find((option) => option.value === occasion.rule_week)?.label
    return `${week} ${WEEKDAY_NAMES[occasion.rule_weekday]} of ${MONTH_NAMES[occasion.rule_month - 1]}`
}