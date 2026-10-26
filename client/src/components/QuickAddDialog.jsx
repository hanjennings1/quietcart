// The quick-add pop-up (opened by "+ Idea" button)
// pick who it's for, type in the idea, save -> re-uses GiftForm

import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
    Alert, Box, CircularProgress, Dialog, DialogContent, DialogTitle, Link, MenuItem, Stack,
    TextField, Typography,
} from '@mui/material'

import { apiFetch } from '../api.js'
import GiftForm from './GiftForm.jsx'

// open =       where the pop-up is showing
// onClose =    closes pop-up (Cancel/Escape/Clicking outside of it)
// onSaved =    runs after an idea is saved; recieves the recipient
// defaultRecipientId = pre-selects a recipient (when on their page/etc)

function QuickAddDialog({ open, onClose, onSaved, defaultRecipientId = null }) {
    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Save a gift idea</DialogTitle>
            <DialogContent>
                {/* MUI removes the dialog's contents while it's closed, so
                QuickAddContent starts fresh (new state) every time it opens */}
                <QuickAddContent
                    onClose={onClose}
                    onSaved={onSaved}
                    defaultRecipientId={defaultRecipientId}
                />
            </DialogContent>
        </Dialog>
    )
}

// The inside of the pop-up: loads recipients, then shows the form
function QuickAddContent({ onClose, onSaved, defaultRecipientId }) {

    // the user's recipients, for the "For" dropdown; null = still loading
    const [recipients, setRecipients] = useState(null)
    const [loadError, setLoadError] = useState('')

    // all of the user's occasions; filetered below to the ones that fit the chosen recipient
    const [occasions, setOccasions] = useState([])

    // who the idea is for ('' = no one chosen yet)
    const [recipientId, setRecipientId] = useState(defaultRecipientId ?? '')

    // load the recipients when the pop-up opens
    useEffect(() => {
        apiFetch('/recipients')
            .then((data) => setRecipients(data))
            .catch((err) => setLoadError(err.message))
        // occasions are a bonus: if they fail to load, the form still works (without the dropdown):
        apiFetch('/occasions')
            .then((data) => setOccasions(data))
            .catch(() => setOccasions([]))
    }, [])

    // GiftForm calls this with the idea's values,
    // anything thrown here is shown as an error in the form
    async function handleSubmit(values) {
        if (recipientId === '') {
            throw new Error('Choose who this idea is for')
        }
        await apiFetch('/gifts', {
            method: 'POST',
            body: {
                ...values,
                recipient_id: recipientId,
                // if "For" changed after picking an occasion, drop one that no longer fits
                occasion_id: giftOccasions.some((o) => o.id === values.occasion_id)
                    ? values.occasion_id
                    : null,
            },
        })
        onSaved(recipients.find((recipient) => recipient.id === recipientId))
    }

    if (loadError) {
        return <Alert severity='error'>{loadError}</Alert>
    }

    if (recipients === null) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress />
            </Box>
        )
    }

    // No recipients yet (no one to save an idea under)
    if (recipients.length === 0) {
        return (
            <Typography>
                Add a recipient first, then save ideas for them.{' '}
                <Link component={RouterLink} to="/recipients/new" onClick={onClose}>
                    Add a recipient
                </Link>
            </Typography>
        )
    }

    // Same options as on a recipient's page: their own occasions (birthday) plus holidays.
    // Recalculated on every render, so it follows the "For" dropdown when it changes.
    const giftOccasions = occasions.filter(
        (occasion) => occasion.recipient_id === null || occasion.recipient_id === recipientId
    )

    return (
        <Stack spacing={2} sx={{ pt: 1 }}>
            {/* "select" turns a TextField into a dropdown */}
            <TextField
                select
                label="For"
                value={recipientId}
                onChange={(event) => setRecipientId(event.target.value)}
                size="small"
            >
                {recipients.map((recipient) => (
                    <MenuItem key={recipient.id} value={recipient.id}>
                        {recipient.name}
                    </MenuItem>
                ))}
            </TextField>

            <GiftForm submitLabel="Save" onSubmit={handleSubmit} onCancel={onClose} occasions={giftOccasions} />
        </Stack>
    )
}


export default QuickAddDialog