// The /recipients/:id page:
// one recipient's details, budget, and gift ideas; also where they're edited or deleted.

import { useCallback, useEffect, useState } from 'react'
import { Link as RouterLink, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { Alert, Box, Button, CircularProgress, Link, Paper, Stack, Typography } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import AddIcon from '@mui/icons-material/Add'

import { apiFetch } from '../api.js'
import BudgetBar from '../components/BudgetBar.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import GiftItem from '../components/GiftItem.jsx'
import GiftForm from '../components/GiftForm.jsx'
import InterestChips from '../components/InterestChips.jsx'
import OccasionDialog from '../components/OccasionDialog.jsx'
import OccasionList from '../components/OccasionList.jsx'
import { recipientColor } from '../theme.js'


function RecipientDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()

    // Goes up after every quick-add; reloading on change shows the new idea
    const { dataVersion } = useOutletContext()

    // The recipient (from Flask), including their gifts list; null = not loaded yet
    const [recipient, setRecipient] = useState(null)
    const [error, setError] = useState('')

    // the delete confirmation pop-up:
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [deleting, setDeleting] = useState(false)

    // The id of the gift being saved (or null), so only that row's checkbox is disabled while it saves
    const [savingGiftId, setSavingGiftId] = useState(null)

    // The id of the gift being edited (row turns into a form), or null
    const [editingGiftId, setEditingGiftId] = useState(null)

    // The gift waiting for delete confirmation (opens the pop-up), or null
    const [giftToDelete, setGiftToDelete] = useState(null)
    const [deletingGift, setDeletingGift] = useState(false)

    // The occasion pop-up: open/closed, which occasion is being edited (null = adding)
    const [occasionDialogOpen, setOccasionDialogOpen] = useState(false)
    const [editingOccasion, setEditingOccasion] = useState(null)

    // The occasion waiting for delete confirmation (or null)
    const [occasionToDelete, setOccasionToDelete] = useState(null)
    const [deletingOccasion, setDeletingOccasion] = useState(false)


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
    }, [loadRecipient, dataVersion])

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
            // runs whether or not the save worked
            setSavingGiftId(null)
        }
    }

    // Save a new gift idea for this recipient, then reload the page's data
    // If Flask rejects it, an error is thrown back to GiftForm which shows it
    async function handleAddGift(values) {
        await apiFetch('/gifts', {
            method: 'POST',
            body: { ...values, recipient_id: recipient.id },
        })
        await loadRecipient()
    }

    // Save changes to the gift being edited
    // If Flask rejects them, an error is thrown back to GiftForm which shows it
    async function handleSaveGift(values) {
        await apiFetch(`/gifts/${editingGiftId}`, { method: 'PATCH', body: values })
        setEditingGiftId(null)   // close the form, back to a normal row
        await loadRecipient()
    }

    // Delete the gift after the user confirms using the pop-up
    async function handleDeleteGift() {
        setDeletingGift(true)
        try {
            await apiFetch(`/gifts/${giftToDelete.id}`, { method: 'DELETE' })
            setGiftToDelete(null)       // close the pop-up
            await loadRecipient()
        } catch (err) {
            setError(err.message)
            setGiftToDelete(null)
        } finally {
            setDeletingGift(false)
        }
    }

    // Open the occasion pop-up empty (add) or filled in (edit)
    function openAddOccasion() {
        document.activeElement?.blur()      // let the dialog take focus cleanly
        setEditingOccasion(null)
        setOccasionDialogOpen(true)
    }

    function openEditOccasion(occasion) {
        document.activeElement?.blur()      // let the dialog take focus cleanly
        setEditingOccasion(occasion)
        setOccasionDialogOpen(true)
    }

    // After the pop-up saves: close it and re-load (so list and countdown update)
    async function handleOccasionSaved() {
        setOccasionDialogOpen(false)
        await loadRecipient()
    }

    // Delete the occasion after the user confirms
    async function handleDeleteOccasion() {
        setDeletingOccasion(true)
        try {
            await apiFetch(`/occasions/${occasionToDelete.id}`, { method: 'DELETE' })
            setOccasionToDelete(null)
            await loadRecipient()
        } catch (err) {
            setError(err.message)
            setOccasionToDelete(null)
        } finally {
            setDeletingOccasion(false)
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
    const color = recipientColor(recipient.color)

    // Occasions a gift for this person can go on: their own (birthday) plus holidays
    const giftOccasions = [...recipient.occasions, ...recipient.holidays]

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
                                onClick={() => {
                                    document.activeElement?.blur()
                                    setConfirmOpen(true)
                                }}
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

                    {/* INTERESTS: chips for gift inspiration */}
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                            Interests
                        </Typography>
                        <InterestChips
                            recipientId={recipient.id}
                            interests={recipient.interests}
                            color={color}
                            onChange={loadRecipient}
                        />
                    </Box>

                </Box>
            </Paper>

            {/* ─── OCCASIONS ─── */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">Occasions</Typography>
                <Button startIcon={<AddIcon />} onClick={openAddOccasion}>
                    Add occasion
                </Button>
            </Box>
            <Paper sx={{ p: 2, mb: 4 }}>
                <OccasionList
                    occasions={recipient.occasions}
                    color={color}
                    onEdit={openEditOccasion}
                    onDelete={setOccasionToDelete}
                />
            </Paper>

            {/* ─── GIFT IDEAS ─── */}
            <Typography variant="h5" sx={{ mb: 2 }}>Gift ideas</Typography>

            {/* ADD AN IDEA */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <GiftForm onSubmit={handleAddGift} occasions={giftOccasions} />
            </Paper>
            {recipient.gifts.length === 0 ? (
                <Typography color="text.secondary">No gift ideas yet.</Typography>
            ) : (
                // Flask already sorts them: unpurchased first (newest on top),
                // then purchased
                <Stack spacing={1}>
                    {recipient.gifts.map((gift) =>
                        gift.id === editingGiftId ? (
                            // EDITING: this row becomes the form, filled in with the gift
                            <Paper key={gift.id} sx={{ p: 2 }}>
                                <GiftForm
                                    initialGift={gift}
                                    submitLabel="Save"
                                    onSubmit={handleSaveGift}
                                    onCancel={() => setEditingGiftId(null)}
                                    occasions={giftOccasions}
                                />
                            </Paper>
                        ) : (
                            <GiftItem
                                key={gift.id}
                                gift={gift}
                                color={color}
                                onToggle={handleToggle}
                                onEdit={(chosen) => setEditingGiftId(chosen.id)}
                                onDelete={(chosen) => setGiftToDelete(chosen)}
                                disabled={savingGiftId === gift.id}
                            />
                        ),
                    )}
                </Stack>
            )}

            {/* ─── DELETE RECIPIENT CONFIRMATION ─── */}
            <ConfirmDialog
                open={confirmOpen}
                title={`Delete ${recipient.name}?`}
                message={`This also deletes all ${recipient.gifts.length} of their gift ideas. This can't be undone.`}
                busy={deleting}
                onConfirm={handleDelete}
                onCancel={() => setConfirmOpen(false)}
            />

            {/* ─── DELETE GIFT CONFIRMATION ─── */}
            <ConfirmDialog
                open={giftToDelete !== null}
                title={`Delete ${giftToDelete?.name}?`}
                message="This gift idea will be removed from the list."
                busy={deletingGift}
                onConfirm={handleDeleteGift}
                onCancel={() => setGiftToDelete(null)}
            />

            {/* ─── ADD / EDIT OCCASION ─── */}
            <OccasionDialog
                open={occasionDialogOpen}
                occasion={editingOccasion}
                recipientId={recipient.id}
                onClose={() => setOccasionDialogOpen(false)}
                onSaved={handleOccasionSaved}
            />

            {/* ─── DELETE OCCASION CONFIRMATION ─── */}
            <ConfirmDialog
                open={occasionToDelete !== null}
                title={`Delete ${occasionToDelete?.name}?`}
                message="Gift ideas planned for it stay on the list; they just won't be assigned to an occasion."
                busy={deletingOccasion}
                onConfirm={handleDeleteOccasion}
                onCancel={() => setOccasionToDelete(null)}
            />

        </Box>
    )
}

export default RecipientDetailPage