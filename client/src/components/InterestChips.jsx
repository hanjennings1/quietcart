/*
 * InterestChips: a recipient's interest chips, plus a box to add more.
 *
 * - Clicking a chip opens /interests/:id (everyone who shares it).
 * - The ✕ on a chip removes it from this recipient.
 * - Typing a label and pressing Enter adds it (the backend reuses an
 *   existing chip with that label, or creates a new one).
 *
 * The parent reloads the recipient through onChange, so this component
 * never keeps its own copy of the chip list.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Box, Chip, Stack, TextField } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { apiFetch } from '../api'

export default function InterestChips({ recipientId, interests, color, onChange }) {
    const navigate = useNavigate()
    const [label, setLabel] = useState('')      // what is typed in the add box
    const [error, setError] = useState(null)
    const [busy, setBusy] = useState(false)     // disables chips while a request runs

    async function handleAdd(event) {
        event.preventDefault()      // stops the form from reloading the page
        if (!label.trim()) return   // ignore an empty Enter
        setBusy(true)
        setError(null)
        try {
            await apiFetch(`/recipients/${recipientId}/interests`, {
                method: 'POST',
                body: { label },
            })
            setLabel('')
            onChange()           // parent reloads, new chip appears
        } catch (err) {
            setError(err.message)
        } finally {
            setBusy(false)      // runs whether it worked or failed
        }
    }

    async function handleRemove(interestId) {
        setBusy(true)
        setError(null)
        try {
            await apiFetch(`/recipients/${recipientId}/interests/${interestId}`, {
                method: 'DELETE',
            })
            onChange()
        } catch (err) {
            setError(err.message)
        } finally {
            setBusy(false)
        }
    }
    return (
        <Box>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
                {interests.map((interest) => (
                    <Chip
                        key={interest.id}
                        label={interest.label}
                        onClick={() => navigate(`/interests/${interest.id}`)}
                        onDelete={() => handleRemove(interest.id)}
                        disabled={busy}
                        sx={{
                            bgcolor: alpha(color, 0.25),             // tinted in the recipient's color
                            '&:hover': { bgcolor: alpha(color, 0.4) },
                        }}
                    />
                ))}

                {/* A form, so pressing Enter submits */}
                <Box component="form" onSubmit={handleAdd}>
                    <TextField
                        size="small"
                        placeholder="Add interest"
                        value={label}
                        onChange={(event) => setLabel(event.target.value)}
                        disabled={busy}
                        slotProps={{ htmlInput: { maxLength: 30, 'aria-label': 'Add interest' } }}
                    />
                </Box>
            </Stack>

            {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
        </Box>
    )
}