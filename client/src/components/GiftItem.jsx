// One row of a recipient's gift checklist:
// a checkbox, gift's name (w/ optional link), price, notes, and a ⋮ menu (Edit, Delete)
// Purchased gifts: faded and crossed out

import { useState } from 'react'
import {
    Box, Checkbox, IconButton, Link, ListItemIcon, Menu, MenuItem, Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import MoreVertIcon from '@mui/icons-material/MoreVert'

import { formatMoney } from '../utils/format.js'

// gift:     one gift from the recipient's "gifts" list
// color:    the recipient's neon color, for the row's tint
// onToggle: runs when the checkbox is clicked (the page saves the change)
// onEdit:   runs when Edit is chosen from the ⋮ menu
// onDelete: runs when Delete is chosen from the ⋮ menu
// disabled: true while a save is in progress, to prevent double-clicks

function GiftItem({ gift, color, onToggle, onEdit, onDelete, disabled = false }) {
    const purchased = gift.purchased

    // The ⋮ button that the menu opens next to; null means menu is closed
    const [menuAnchor, setMenuAnchor] = useState(null)

    // Close the menu, then run the chosen action (onEdit or onDelete)
    function choose(action) {
        setMenuAnchor(null)
        action(gift)
    }

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1,
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

            {/* ⋮ MENU BUTTON: an icon-only button needs an aria-label to be announced */}
            <IconButton
                aria-label={`More options for ${gift.name}`}
                onClick={(event) => setMenuAnchor(event.currentTarget)}
                disabled={disabled}
                sx={{ alignSelf: 'center' }}
            >
                <MoreVertIcon />
            </IconButton>

            {/* THE MENU: shows when menuAnchor is set, positioned next to the ⋮ button */}
            <Menu anchorEl={menuAnchor} open={menuAnchor !== null} onClose={() => setMenuAnchor(null)}>
                <MenuItem onClick={() => choose(onEdit)}>
                    <ListItemIcon><EditOutlinedIcon fontSize="small" /></ListItemIcon>
                    Edit
                </MenuItem>
                <MenuItem onClick={() => choose(onDelete)} sx={{ color: 'error.main' }}>
                    <ListItemIcon><DeleteOutlinedIcon fontSize="small" color="error" /></ListItemIcon>
                    Delete
                </MenuItem>
            </Menu>
        </Box>
    )
}

export default GiftItem