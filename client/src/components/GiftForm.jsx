// The form for adding/editing a gift idea
// starts as one quick field & "more details" reveals link, price, and notes

import { useState } from 'react'
import { Alert, Box, Button, Collapse, InputAdornment, Stack, TextField } from '@mui/material'

// an empty form used for new ideas and for cleaning after one's been added
const EMPTY_FORM = { name: '', url: '', price: '', notes: '' }

// Turns a gift from Flask into form values:
function toFormValues(gift) {
    if (!gift) return EMPTY_FORM

    return {
        name: gift.name,
        url: gift.url ?? '',
        price: gift.price === null ? '' : String(gift.price),
        notes: gift.notes ?? '',
    }
}

// initialGift = a gift to edit, or null for new idea
// submitLabel = the button text ("Add" or "Save")
// onSubmit = receives form values & page saves them to Flask (error shown if it throws)
// onCancel = optional; shows a Cancel button / used when editing

function GiftForm({ initialGift = null, submitLabel = 'Add', onSubmit, onCancel }) {

    // the function form of useState runs just once, on first render
    const [form, setForm] = useState(() => toFormValues(initialGift))

    // details start as open when editing / closed when just writing down new idea
    const [showDetails, setShowDetails] = useState(initialGift !== null)
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)

    function handleChange(event) {
        const { name, value } = event.target
        setForm((current) => ({ ...current, [name]: value }))
    }

    async function handleSubmit(event) {
        event.preventDefault()
        setError('')
        setSaving(true)
        try {
            await onSubmit({
                name: form.name,
                url: form.url,
                // price: empty means 'no price yet' - send null, not 0
                price: form.price.trim() === '' ? null : form.price,
                notes: form.notes
            })

            // Adding a new idea: clear the form, ready for next one
            if (initialGift === null) {
                setForm(EMPTY_FORM)
                setShowDetails(false)
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={1.5}>
                {error && <Alert severity="error">{error}</Alert>}

                {/* THE QUICK PART: name and the submit button, side by side */}
                <Stack direction="row" spacing={1}>
                    <TextField
                        label="Gift idea"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Something they mentioned..."
                        required
                        size="small"
                        sx={{ flexGrow: 1 }}
                    />
                    <Button type="submit" variant="contained" disabled={saving}>
                        {saving ? 'Saving...' : submitLabel}
                    </Button>
                </Stack>

                {/* THE OPTIONAL PART: Collapse slides open and closed */}
                <Collapse in={showDetails}>
                    <Stack spacing={1.5}>
                        <TextField
                            label="Link"
                            name="url"
                            type="url"   // shows a web-address keyboard on phones
                            value={form.url}
                            onChange={handleChange}
                            placeholder="https://..."
                            size="small"
                        />
                        <TextField
                            label="Price"
                            name="price"
                            type="number"
                            value={form.price}
                            onChange={handleChange}
                            size="small"
                            slotProps={{
                                input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
                                htmlInput: { min: 0, step: '0.01' },
                            }}
                        />
                        <TextField
                            label="Notes"
                            name="notes"
                            value={form.notes}
                            onChange={handleChange}
                            placeholder="Size, color, where to buy..."
                            multiline
                            minRows={2}
                            size="small"
                        />
                    </Stack>
                </Collapse>

                <Stack direction="row" spacing={1}>
                    <Button size="small" onClick={() => setShowDetails(!showDetails)}>
                        {showDetails ? 'Fewer details' : 'More details'}
                    </Button>
                    {onCancel && <Button size="small" onClick={onCancel}>Cancel</Button>}
                </Stack>
            </Stack>
        </Box>
    )
}

export default GiftForm