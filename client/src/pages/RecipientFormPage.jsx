// One form for both adding AND editing a recipient:
//   /recipients/new       → empty form, creates with POST
//   /recipients/:id/edit  → filled-in form, updates with PATCH

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
    Alert, Box, Button, ButtonBase, CircularProgress, InputAdornment, Paper, Stack, TextField, Typography,
} from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'

import { apiFetch } from '../api.js'
import { NAVY, RECIPIENT_COLORS } from '../theme.js'

function RecipientFormPage() {

    // the :id from the address, or undefined on /recipients/new
    const { id } = useParams()
    const isEditing = id !== undefined
    const navigate = useNavigate()

    // all the fields in one state object (color: a position in RECIPIENT_COLORS; null = not chosen yet)
    const [form, setForm] = useState({ name: '', relationship: '', budget: '', notes: '', color: null })

    // edit mode starts by loading the recipient; create mode has nothing to load
    const [loading, setLoading] = useState(isEditing)
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)

    // EDIT MODE: load the recipient & fill in the form
    useEffect(() => {
        if (!isEditing) return

        apiFetch(`/recipients/${id}`)
            .then((recipient) =>
                setForm({
                    name: recipient.name,
                    relationship: recipient.relationship ?? '', // ?? '' -> turns a missing (null) value into an empty field
                    budget: recipient.budget === null ? '' : String(recipient.budget),
                    notes: recipient.notes ?? '',
                    color: recipient.color,
                }),
            )
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false))
    }, [id, isEditing])


    // ADD MODE: pre-select the color this user has used least (same rule as Flask's).
    // If this fails, color stays null and Flask picks one when saving.
    useEffect(() => {
        if (isEditing) return

        apiFetch('/recipients')
            .then((recipients) => {
                const counts = RECIPIENT_COLORS.map(() => 0)        // one counter per color
                recipients.forEach((recipient) => { counts[recipient.color] += 1 })
                const leastUsed = counts.indexOf(Math.min(...counts))
                setForm((current) => ({ ...current, color: leastUsed }))
            })
            .catch(() => { })
    }, [isEditing])

    // one change handler for every field:
    // each TextField has a "name" matching its key in the form object (so this updates the right one)
    function handleChange(event) {
        const { name, value } = event.target
        setForm((current) => ({ ...current, [name]: value }))
    }

    async function handleSubmit(event) {
        event.preventDefault()
        setError('')
        setSaving(true)

        const body = {
            name: form.name,
            relationship: form.relationship,
            // NOTE: an empty budget means "no budget" (unlimited) so it must be set as null, never as 0
            budget: form.budget.trim() === '' ? null : form.budget,
            notes: form.notes,
            color: form.color,      // null → Flask picks the least-used color
        }

        try {
            const saved = isEditing
                ? await apiFetch(`/recipients/${id}`, { method: 'PATCH', body })
                : await apiFetch('/recipients', { method: 'POST', body })
            navigate(`/recipients/${saved.id}`)     // go to their page
        } catch (err) {
            setError(err.message)       // example: "Budget can't be negative."
            setSaving(false)
        }
    }

    // Loading an existing recipient:
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
                <CircularProgress />
            </Box>
        )
    }

    return (
        <Paper sx={{ p: 4, maxWidth: 560 }}>
            <Typography variant="h4" color="primary" sx={{ mb: 3 }}>
                {isEditing ? 'Edit recipient' : 'Add a recipient'}
            </Typography>

            <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={2}>
                    {error && <Alert severity="error">{error}</Alert>}

                    {/* NAME */}
                    <TextField
                        label="Name"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        autoFocus   // cursor starts here, so typing can begin right away
                    />

                    {/* RELATIONSHIP */}
                    <TextField
                        label="Relationship"
                        name="relationship"
                        value={form.relationship}
                        onChange={handleChange}
                        placeholder="sister, coworker, best friend"
                    />

                    {/* COLOR: pick one of the palette's swatches */}
                    <Box>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                            Color
                        </Typography>
                        {/* radiogroup/radio tell screen readers this is a "pick one" choice */}
                        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }} role="radiogroup" aria-label="Color">
                            {RECIPIENT_COLORS.map((hex, index) => {
                                const selected = form.color === index
                                return (
                                    <ButtonBase
                                        key={hex}
                                        role="radio"
                                        aria-checked={selected}
                                        aria-label={`Color ${index + 1}`}
                                        onClick={() => setForm((current) => ({ ...current, color: index }))}
                                        sx={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: '50%',
                                            bgcolor: hex,
                                            // selected: a navy ring with a thin white gap, plus a check
                                            boxShadow: selected ? `0 0 0 2px #FFFFFF, 0 0 0 4px ${NAVY}` : 'none',
                                        }}
                                    >
                                        {selected && <CheckIcon sx={{ color: NAVY, fontSize: 20 }} />}
                                    </ButtonBase>
                                )
                            })}
                        </Stack>
                    </Box>

                    {/* BUDGET */}
                    <TextField
                        label="Budget"
                        name="budget"
                        type="number"
                        value={form.budget}
                        onChange={handleChange}
                        helperText="Leave empty for no budget limit"
                        slotProps={{
                            input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
                            htmlInput: { min: 0, step: '0.01' },   // no negatives; allows cents
                        }}
                    />

                    {/* NOTES */}
                    <TextField
                        label="Notes"
                        name="notes"
                        value={form.notes}
                        onChange={handleChange}
                        placeholder="Sizes, favorite colors, things they already have..."
                        multiline
                        minRows={3}
                    />

                    <Stack direction="row" spacing={2}>
                        <Button type="submit" variant="contained" disabled={saving}>
                            {saving ? 'Saving...' : 'Save'}
                        </Button>
                        {/* navigate(-1) is the browser's Back button */}
                        <Button variant="outlined" onClick={() => navigate(-1)}>Cancel</Button>
                    </Stack>
                </Stack>
            </Box>
        </Paper>
    )
}

export default RecipientFormPage