// One form for both adding AND editing a recipient:
//   /recipients/new       → empty form, creates with POST
//   /recipients/:id/edit  → filled-in form, updates with PATCH

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
    Alert, Box, Button, CircularProgress, InputAdornment, Paper, Stack, TextField, Typography,
} from '@mui/material'

import { apiFetch } from '../api.js'

function RecipientFormPage() {

    // the :id from the address, or undefined on /recipients/new
    const { id } = useParams()
    const isEditing = id !== undefined
    const navigate = useNavigate()

    // all four fields in one state object
    const [form, setForm] = useState({ name: '', relationship: '', budget: '', notes: '' })

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
                }),
            )
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false))
    }, [id, isEditing])

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

                    <TextField
                        label="Name"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        autoFocus   // cursor starts here, so typing can begin right away
                    />
                    <TextField
                        label="Relationship"
                        name="relationship"
                        value={form.relationship}
                        onChange={handleChange}
                        placeholder="sister, coworker, best friend"
                    />
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