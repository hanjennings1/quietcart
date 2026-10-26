/*
 * OccasionList: a list of occasions, each with its date, countdown,
 * and how many gift ideas are planned for it.
 *
 * Props:
 *   occasions        - from Flask (already sorted soonest first)
 *   color            - row tint (the recipient's color; navy by default)
 *   onEdit, onDelete - optional; the buttons only show when given
 *   showRecipient    - show who each occasion is for (Calendar page)
 */

import { Box, Chip, IconButton, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'

import { NAVY } from '../theme.js'
import { formatCountdown, formatShortDate } from '../utils/format.js'

// Occasions this close get a gold countdown chip (so they stand out):
const SOON_DAYS = 14

export default function OccasionList({
    occasions, color = NAVY, onEdit, onDelete, showRecipient = false,
}) {
    if (occasions.length === 0) {
        return <Typography color="text.secondary">No occasions yet.</Typography>
    }

    return (
        <Stack spacing={1}>
            {occasions.map((occasion) => {
                const soon = occasion.days_until >= 0 && occasion.days_until <= SOON_DAYS
                return (
                    <Box
                        key={occasion.id}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            px: 1.5,
                            py: 1,
                            borderRadius: 2,
                            bgcolor: alpha(color, 0.12),
                            }}
                        >

                            {/* DATE: the next time it happens */}
                            <Typography variant="subtitle2" sx={{ minWidth: 52 }}>
                                {formatShortDate(occasion.next_date)}
                            </Typography>

                            {/* NAME + DETAILS (minWidth: 0 lets long names shrink instead of overflowing) */}
                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                <Typography sx={{ fontWeight: 600 }}>{occasion.name}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {showRecipient && occasion.recipient_name && `${occasion.recipient_name} · `}
                                    {occasion.idea_count} {occasion.idea_count === 1 ? 'idea' : 'ideas'}
                                    {occasion.repeats_yearly && ' · every year'}
                                </Typography>
                            </Box>

                            {/* COUNTDOWN */}
                            <Chip
                                size="small"
                                label={formatCountdown(occasion.days_until)}
                                color={soon ? 'secondary' : 'default'}
                                variant={soon ? 'filled' : 'outlined'}
                            />

                            {/* ACTIONS (only when the page passes them in) */}
                            {onEdit && (
                                <IconButton size="small" aria-label={`Edit ${occasion.name}`} onClick={() => onEdit(occasion)}>
                                    <EditOutlinedIcon fontSize="small" />
                                </IconButton>
                            )}
                            {onDelete && (
                                <IconButton size="small" aria-label={`Delete ${occasion.name}`} onClick={() => onDelete(occasion)}>
                                    <DeleteOutlinedIcon fontSize="small" />
                                </IconButton>
                            )}
                        </Box>
                    )
                })}
            </Stack >
        )
    }