/*
 * MonthGrid: a month calendar (like Google Calendar's month view).
 * Each day is a box; occasions are written inside their day,
 * tinted in their recipient's color (gold for holidays).
 *
 * Props:
 *   month            - a dayjs date anywhere in the month to show
 *   occasions        - all occasions; each day picks out its own
 *   onOccasionClick  - called with an occasion when its label is clicked
 *   onDayClick       - called with a dayjs date when an empty part of a day is clicked
 */
import dayjs from 'dayjs'
import { Box, ButtonBase } from '@mui/material'
import { alpha } from '@mui/material/styles'

import { GOLD, NAVY, recipientColor } from '../theme.js'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Does this occasion land on this exact day?
// Yearly: same month and day, any year. One-time: the exact date.
function occursOn(occasion, day) {
    const date = dayjs(occasion.date)
    if (occasion.repeats_yearly) {
        return date.month() === day.month() && date.date() === day.date()
    }
    return date.isSame(day, 'day')
}

// Same colors as everywhere else: the recipient's color, or gold for holidays
function occasionColor(occasion) {
    return occasion.recipient_id ? recipientColor(occasion.recipient_color) : GOLD
}

export default function MonthGrid({ month, occasions, onOccasionClick, onDayClick }) {
    const today = dayjs()
    const firstOfMonth = month.startOf('month')

    // The grid starts on the Sunday on or before the 1st, and runs whole weeks
    const gridStart = firstOfMonth.startOf('week')
    const weekCount = Math.ceil((firstOfMonth.day() + firstOfMonth.daysInMonth()) / 7)
    const days = Array.from({ length: weekCount * 7 }, (_, i) => gridStart.add(i, 'day'))

    return (
        <Box
            sx={{
                display: 'grid',
                // minmax(0, 1fr): equal columns that never stretch to fit a long name
                gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                borderTop: 1,
                borderLeft: 1,
                borderColor: 'divider',
            }}
        >
            {/* WEEKDAY HEADINGS */}
            {WEEKDAYS.map((weekday) => (
                <Box
                    key={weekday}
                    sx={{
                        py: 1,
                        borderRight: 1,
                        borderBottom: 1,
                        borderColor: 'divider',
                        textAlign: 'center',
                        fontSize: 14,
                        fontWeight: 600,
                        color: 'text.secondary',
                    }}
                >
                    {weekday}
                </Box>
            ))}

            {/* DAYS */}
            {days.map((day) => {
                const inMonth = day.month() === firstOfMonth.month()
                const isToday = day.isSame(today, 'day')
                // Days from the neighboring months stay empty, so the grid isn't confusing
                const dayOccasions = inMonth ? occasions.filter((o) => occursOn(o, day)) : []

                return (
                    <Box
                        key={day.format('YYYY-MM-DD')}
                        onClick={() => inMonth && onDayClick(day)}
                        sx={{
                            minHeight: { xs: 72, md: 95 },
                            p: 0.75,
                            borderRight: 1,
                            borderBottom: 1,
                            borderColor: 'divider',
                            bgcolor: inMonth ? 'background.paper' : 'action.hover',
                            cursor: inMonth ? 'pointer' : 'default',
                            '&:hover': inMonth ? { bgcolor: alpha(NAVY, 0.03) } : {},
                        }}
                    >
                        {/* DAY NUMBER: a navy circle for today */}
                        <Box
                            sx={{
                                width: 28,
                                height: 28,
                                mb: 0.5,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 14,
                                fontWeight: isToday ? 700 : 400,
                                bgcolor: isToday ? NAVY : 'transparent',
                                color: isToday ? '#FFFFFF' : inMonth ? 'text.primary' : 'text.disabled',
                            }}
                        >
                            {day.date()}
                        </Box>

                        {/* OCCASION LABELS */}
                        {dayOccasions.map((occasion) => {
                            const color = occasionColor(occasion)
                            return (
                                <ButtonBase
                                    key={occasion.id}
                                    title={occasion.name}        // full name on hover if it's cut off
                                    onClick={(event) => {
                                        event.stopPropagation()  // don't also trigger the day's click
                                        onOccasionClick(occasion)
                                    }}
                                    sx={{
                                        display: 'block',
                                        width: '100%',
                                        mb: 0.5,
                                        px: 0.75,
                                        py: 0.25,
                                        borderRadius: 1,
                                        borderLeft: `3px solid ${color}`,
                                        bgcolor: alpha(color, 0.25),
                                        textAlign: 'left',
                                        fontSize: 13,
                                        fontWeight: 600,
                                        // long names end in "…" instead of wrapping
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}
                                >
                                    {occasion.name}
                                </ButtonBase>
                            )
                        })}
                    </Box>
                )
            })}
        </Box>
    )
}