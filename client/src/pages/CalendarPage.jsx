// The /calendar page: a month grid with occasions written inside their days,
// plus a list of this month's occasions (with countdowns) underneath.

import { useCallback, useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import dayjs from 'dayjs'
import { Alert, Box, Button, CircularProgress, IconButton, Paper, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'

import { apiFetch } from '../api.js'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import OccasionDialog from '../components/OccasionDialog.jsx'
import OccasionList from '../components/OccasionList.jsx'
import MonthGrid from '../components/MonthGrid.jsx'


// Does this occasion happen in the given month (a dayjs date)?
// Yearly occasions happen every year in their month; one-timers only in their exact month
function occursInMonth(occasion, month) {
    const date = dayjs(occasion.date)
    if (occasion.repeats_yearly) return date.month() === month.month()
    return date.isSame(month, 'month')      // same month AND same year
}

function CalendarPage() {
    const { dataVersion } = useOutletContext()

    // From Flask: all occasions (null = not loaded yet), and recipients for the "For" dropdown
    const [occasions, setOccasions] = useState(null)
    const [recipients, setRecipients] = useState([])
    const [error, setError] = useState('')

    // The month being viewed (starts on the current month)
    const [month, setMonth] = useState(() => dayjs().startOf('month'))

    // The add/edit pop-up and the delete confirmation:
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingOccasion, setEditingOccasion] = useState(null)
    const [defaultDate, setDefaultDate] = useState(null)        // The date to prefill when adding from a clicked day ("YYYY-MM-DD"), or null
    const [occasionToDelete, setOccasionToDelete] = useState(null)
    const [deleting, setDeleting] = useState(false)

    const loadOccasions = useCallback(() => {
        return apiFetch('/occasions')
            .then((data) => setOccasions(data))
            .catch((err) => setError(err.message))
    }, [])

    useEffect(() => {
        loadOccasions()
        // recipients are only for the dropdown; if they fail, holidays can still be added
        apiFetch('/recipients')
            .then((data) => setRecipients(data))
            .catch(() => setRecipients([]))
    }, [loadOccasions, dataVersion])

    // Add from the header button (no date) or by clicking a day (that date prefilled)
    function openAdd(day = null) {
        document.activeElement?.blur()      // let the dialog take focus cleanly
        setEditingOccasion(null)
        setDefaultDate(day ? day.format('YYYY-MM-DD') : null)
        setDialogOpen(true)
    }

    function openEdit(occasion) {
        document.activeElement?.blur()      // let the dialog take focus cleanly
        setEditingOccasion(occasion)
        setDialogOpen(true)
    }

    async function handleSaved() {
        setDialogOpen(false)
        await loadOccasions()
    }

    async function handleDelete() {
        setDeleting(true)
        try {
            await apiFetch(`/occasions/${occasionToDelete.id}`, { method: 'DELETE' })
            setOccasionToDelete(null)
            await loadOccasions()
        } catch (err) {
            setError(err.message)
            setOccasionToDelete(null)
        } finally {
            setDeleting(false)
        }
    }

    // 1. ERROR with nothing to show
    if (error && occasions === null) {
        return <Alert severity="error">{error}</Alert>
    }

    // 2. STILL LOADING...
    if (occasions === null) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
                <CircularProgress />
            </Box>
        )
    }

    // 3. LOADED: this month's occasions, in day order
    const monthOccasions = occasions
        .filter((occasion) => occursInMonth(occasion, month))
        .sort((a, b) => dayjs(a.date).date() - dayjs(b.date).date())

    return (
        <Box>
            {/* HEADER: title on the left, Add button on the right */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                <Box>
                    <Typography variant="h3" color="primary">Calendar</Typography>
                    <Typography color="text.secondary">Birthdays, holidays, and everything in between.</Typography>
                </Box>
                <Button variant="contained" color="secondary" startIcon={<AddIcon />} onClick={() => openAdd()}>
                    Add occasion
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* ─── MONTH GRID ─── */}
            <Paper sx={{ p: 2, mb: 3 }}>
                {/* Month name on the left; Today and ‹ › on the right */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Typography variant="h5" sx={{ flexGrow: 1 }}>{month.format('MMMM YYYY')}</Typography>
                    <Button variant="outlined" size="small" onClick={() => setMonth(dayjs().startOf('month'))}>
                        Today
                    </Button>
                    <IconButton aria-label="Previous month" onClick={() => setMonth(month.subtract(1, 'month'))}>
                        <ChevronLeftIcon />
                    </IconButton>
                    <IconButton aria-label="Next month" onClick={() => setMonth(month.add(1, 'month'))}>
                        <ChevronRightIcon />
                    </IconButton>
                </Box>

                <MonthGrid
                    month={month}
                    occasions={occasions}
                    onOccasionClick={openEdit}
                    onDayClick={openAdd}
                />
            </Paper>

            {/* ─── THIS MONTH: countdowns, idea counts, edit and delete ─── */}
            <Paper sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>This month</Typography>
                <OccasionList
                    occasions={monthOccasions}
                    onEdit={openEdit}
                    onDelete={setOccasionToDelete}
                    showRecipient
                />
            </Paper>

            {/* ADD / EDIT: the "For" dropdown appears because recipients are passed */}
            <OccasionDialog
                open={dialogOpen}
                occasion={editingOccasion}
                recipients={recipients}
                onClose={() => setDialogOpen(false)}
                onSaved={handleSaved}
                defaultDate={defaultDate}
            />

            <ConfirmDialog
                open={occasionToDelete !== null}
                title={`Delete ${occasionToDelete?.name}?`}
                message="Gift ideas planned for it stay on their lists; they just won't be assigned to an occasion."
                busy={deleting}
                onConfirm={handleDelete}
                onCancel={() => setOccasionToDelete(null)}
            />
        </Box>
    )
}

export default CalendarPage
