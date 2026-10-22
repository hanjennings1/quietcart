// One row of a recipient's gift checklist:
// a checkbox, gift's name (w/ optional link), price, and notes
// Purchased gifts: faded and crossed out

import { Box, Checkbox, Link, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'

import { formatMoney } from '../utils/format.js'

// gift:        one gift from the recipient's "gifts" list
// color:       the recipient's neon color, for the row's tint
// onToggle:    runs when the checkbox is clicked (the page saves the change)
// disabled:    true while a save is in progress, to prevent double-clicks

function GiftItem({ gift, color, onToggle, disabled = false }) {
    const purchased = gift.purchased

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1,
                pr: 2,
                py: 0.5,
                borderRadius: 2,
                // Ideas still to buy stand out; purchased ones fade back
                bgcolor: purchased ? 'transparent' : alpha(color, 0.15),
                opacity: purchased ? 0.55 : 1,
            }}
        >
            <Checkbox
                checked={purchased}
                onChange={() => onToggle(gift)}
                disabled={disabled}
                // Screen readers announce what the checkbox does
                slotProps={{ input: { 'aria-label': `Mark ${gift.name} as purchased` } }}
            />

            {/* NAME AND NOTES (takes up the remaining width) */}
            <Box sx={{ flexGrow: 1, pt: 1 }}>
                {gift.url ? (
                    // Store link: opens in a new tab
                    <Link
                        href={gift.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ textDecoration: purchased ? 'line-through' : undefined }}
                    >
                        {gift.name}
                    </Link>
                ) : (
                    <Typography sx={{ textDecoration: purchased ? 'line-through' : 'none' }}>
                        {gift.name}
                    </Typography>
                )}
                {gift.notes && (
                    <Typography variant="body2" color="text.secondary">{gift.notes}</Typography>
                )}
            </Box>

            {/* PRICE (on the right) */}
            <Typography sx={{ pt: 1, whiteSpace: 'nowrap' }}>{formatMoney(gift.price)}</Typography>
        </Box>
    )
}

export default GiftItem