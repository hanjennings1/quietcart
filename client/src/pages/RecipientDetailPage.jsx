// The /recipients/:id page:
// one recipient's details, budget, and gift ideas; also where they're edited or deleted.

import { useCallback, useEffect, useState } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import { Alert, Box, Button, CircularProgress, Link, Paper, Stack, Typography } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'

import { apiFetch } from '../api.js'
import BudgetBar from '../components/BudgetBar.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { recipientColor } from '../theme.js'
import GiftItem from '../components/GiftItem.jsx'

function RecipientDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()

    // The recipient (from Flask), including their gifts list; null = not loaded yet
    const [recipient, setRecipient] = useState(null)
    const [error, setError] = useState('')

    // the delete confirmation pop-up:
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [deleting, setDeleting] = useState(false)

    // The id of the gift being saved (or null), so only that row's checkbox is disabled while it saves
    const [savingGiftId, setSavingGiftId] = useState(null)

    // Loads (or reloads) the recipient
    // wrapped in useCallback so React reuses the same function between renders
    const loadRecipient = useCallback(() => {
        return apiFetch(`/recipients/${id}`)
            .then((data) => setRecipient(data))
            .catch((err) => setError(err.message))
    }, [id])

    // Load when the page opens (& again if the id in address is changed)
    useEffect(() => {
        loadRecipient()
    }, [loadRecipient])

    async function handleDelete() {
        setDeleting(true)
        try {
            await apiFetch(`/recipients/${id}`, { method: 'DELETE' })
            navigate('/recipients')         // return to main list when recipient is deleted
        } catch (err) {
            setError(err.message)
            setDeleting(false)
            setConfirmOpen(false)
        }
    }

    // Check a gift off (or un-check it), then reload the recipient
    // so that the spent total and checklist order come fresh from Flask
    async function handleToggle(gift) {
        setError('')
        setSavingGiftId(gift.id)
        try {
            await apiFetch(`/gifts/${gift.id}`, {
                method: 'PATCH',
                body: { purchased: !gift.purchased },
            })
            await loadRecipient()
        } catch (err) {
            setError(err.message)
        } finally {
            // runs whether or not the saved worked
            setSavingGiftId(null)
        }
    }






    // 1. NOT FOUND (or another error) and has nothing to show
    if (error && recipient === null) {
        return (
            <Box>
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                <Link component={RouterLink} to="/recipients">Back to recipients</Link>
            </Box>
        )
    }

    // 2. STILL LOADING...
    if (recipient === null) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
                <CircularProgress />
            </Box>
        )
    }

    // 3. LOADED
    const color = recipientColor(recipient.id)

    return (
        <Box sx={{ maxWidth: 800 }}>
            <Button component={RouterLink} to="/recipients" startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
                Recipients
            </Button>

            {/* An error after loading (like a failed delete) shows here, above the details */}
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* ─── DETAILS ─── */}
            <Paper sx={{ overflow: 'hidden', mb: 4 }}>
                <Box sx={{ height: 8, bgcolor: color }} />
                <Box sx={{ p: 3 }}>
                    {/* Name on the left, Edit and Delete on the right (wraps on phones) */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                        <Box>
                            <Typography variant="h3" color="primary">{recipient.name}</Typography>
                            {recipient.relationship && (
                                <Typography color="text.secondary">{recipient.relationship}</Typography>
                            )}
                        </Box>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                            <Button
                                variant="outlined"
                                startIcon={<EditOutlinedIcon />}
                                component={RouterLink}
                                to={`/recipients/${recipient.id}/edit`}
                            >
                                Edit
                            </Button>
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<DeleteOutlinedIcon />}
                                onClick={() => setConfirmOpen(true)}
                            >
                                Delete
                            </Button>
                        </Stack>
                    </Box>

                    {recipient.notes && (
                        // pre-line keeps the line breaks typed into the notes field
                        <Typography sx={{ mt: 2, whiteSpace: 'pre-line' }}>{recipient.notes}</Typography>
                    )}

                    <Box sx={{ mt: 3 }}>
                        <BudgetBar spent={recipient.spent} budget={recipient.budget} color={color} />
                    </Box>
                </Box>
            </Paper>

            {/* ─── GIFT IDEAS ─── */}
            <Typography variant="h5" sx={{ mb: 2 }}>Gift ideas</Typography>
            {recipient.gifts.length === 0 ? (
                <Typography color="text.secondary">No gift ideas yet.</Typography>
            ) : (
                // Flask already sorts them: unpurchased first (newest on top),
                // then purchased
                <Stack spacing={1}>
                    {recipient.gifts.map((gift) => (
                        <GiftItem
                            key={gift.id}
                            gift={gift}
                            color={color}
                            onToggle={handleToggle}
                            disabled={savingGiftId === gift.id}
                        />
                    ))}
                </Stack>
            )}

            {/* ─── DELETE CONFIRMATION ─── */}
            <ConfirmDialog
                open={confirmOpen}
                title={`Delete ${recipient.name}?`}
                message={`This also deletes all ${recipient.gifts.length} of their gift ideas. This can't be undone.`}
                busy={deleting}
                onConfirm={handleDelete}
                onCancel={() => setConfirmOpen(false)}
            />
        </Box>
    )
}

export default RecipientDetailPage