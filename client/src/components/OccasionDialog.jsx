/*
 * OccasionDialog: a pop-up form to add or edit an occasion.
 *
 * Props:
 *   open, onClose          - show/hide, like any MUI Dialog
 *   onSaved(occasion)      - called with Flask's saved occasion
 *   occasion               - an existing occasion to edit (null = add a new one)
 *   recipientId            - fixed recipient (used on a recipient's page)
 *   recipients             - list for a "For" dropdown (used on the Calendar page)
 *   defaultDate            - "YYYY-MM-DD" to prefill when adding (from clicking a calendar day)
 *
 * The form lives in its own inner component: MUI removes a Dialog's contents
 * when it closes, so the form starts fresh every time it opens.
 */

import { useState } from 'react'
import {
    Alert, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle,
    FormControlLabel, MenuItem, Stack, TextField,
} from '@mui/material'
import { apiFetch } from '../api.js'


export default function OccasionDialog({
    open, onClose, onSaved, occasion = null, recipientId = null, recipients = null, defaultDate = null,
}) {
    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
            <OccasionForm
                occasion={occasion}
                recipientId={recipientId}
                recipients={recipients}
                onClose={onClose}
                onSaved={onSaved}
                defaultDate={defaultDate}
            />
        </Dialog>
    )
}

function OccasionForm({ occasion, recipientId, recipients, defaultDate, onClose, onSaved }) {
    const isEdit = occasion !== null

    // Start from the occasion being edited, or defaults for new occasion
    const [form, setForm] = useState({
        name: occasion?.name ?? '',
        date: occasion?.date ?? defaultDate ?? '',                      // editing → its date; clicked a day → that day
        repeats_yearly: occasion?.repeats_yearly ?? true,               // default since most do repeat yearly
        recipient_id: occasion?.recipient_id ?? recipientId ?? '',      // no recipient = holiday (like Christmas)
    })
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)

    function handleChange(event) {
        const { name, value } = event.target
        setForm({ ...form, [name]: value })
    }

    async function handleSubmit(event) {
        event.preventDefault()
        setSaving(true)
        setError('')
        // the dropdown uses '' for no one; Flask expects null:
        const body = { ...form, recipient_id: form.recipient_id === '' ? null : form.recipient_id }
        try {
            const saved = await apiFetch(isEdit ? `/occasions/${occasion.id}` : '/occasions', {
                method: isEdit ? 'PATCH' : 'POST',
                body,
            })
            onSaved(saved)
        } catch (err) {
            setError(err.message)
            setSaving(false)            // only re-enable on failure - on success the dialog closes
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <DialogTitle>{isEdit ? 'Edit occasion' : 'Add an occasion'}</DialogTitle>

            <DialogContent>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    {error && <Alert severity="error">{error}</Alert>}

                    <TextField
                        label="Name"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Birthday, Christmas, Housewarming..."
                        required
                        autoFocus
                        slotProps={{ htmlInput: { maxLength: 50 } }}
                    />

                    {/* type="date" gives a built-in date picker and a "YYYY-MM-DD" value */}
                    <TextField
                        label="Date"
                        name="date"
                        type="date"
                        value={form.date}
                        onChange={handleChange}
                        required
                        slotProps={{ inputLabel: { shrink: true } }}   // keeps the label above the date
                    />

                    {/* Only on the Calendar page: choose who it's for, or no one */}
                    {recipients && (
                        <TextField
                            select
                            label="For"
                            name="recipient_id"
                            value={form.recipient_id}
                            onChange={handleChange}
                        >
                            <MenuItem value="">No one (holiday)</MenuItem>
                            {recipients.map((recipient) => (
                                <MenuItem key={recipient.id} value={recipient.id}>{recipient.name}</MenuItem>
                            ))}
                        </TextField>
                    )}

                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={form.repeats_yearly}
                                onChange={(event) => setForm({ ...form, repeats_yearly: event.target.checked })}
                            />
                        }
                        label="Repeats every year"
                    />
                </Stack>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} disabled={saving}>Cancel</Button>
                <Button type="submit" variant="contained" disabled={saving}>
                    {isEdit ? 'Save' : 'Add'}
                </Button>
            </DialogActions>
        </form>
    )
}