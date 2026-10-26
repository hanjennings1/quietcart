// The /calendar page: a month calendar with a dot on every day that has an occasion,
// and a list of that month's occasions (holidays included) beside it.

import { useCallback, useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import dayjs from 'dayjs'
import { Alert, Badge, Box, Button, CircularProgress, Paper, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { PickerDay } from '@mui/x-date-pickers/PickerDay'

import { apiFetch } from '../api.js'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import OccasionDialog from '../components/OccasionDialog.jsx'
import OccasionList from '../components/OccasionList.jsx'


// Does this occasion happen in the given month (a dayjs date)?
// Yearly occasions happen every year in their month; one-timers only in their exact month
function occursInMonth(occasion, month) {
    const date = dayjs(occasion.date)
    if (occasion.repeats_yearly) return date.month() === month.month()
    return date.isSame(month, 'month')      // same month AND same year
}

// One day square on the calendar, DateCalendar renders this for every day
// A gold dot appears when that day number is in occasionDays
function OccasionDay({ occasionDays = [], day, outsideCurrentMonth, ...other }) {
    const hasOccasion = !outsideCurrentMonth && occasionDays.includes(day.date())
    return (
        <Badge overlap="circular" variant="dot" color="secondary" invisible={!hasOccasion}>
            <PickerDay {...other} day={day} outsideCurrentMonth={outsideCurrentMonth} />
        </Badge>
    )
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

    function openAdd() {
        setEditingOccasion(null)
        setDialogOpen(true)
    }

    function openEdit(occasion) {
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
    if (error && occasions ==+ null) {
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
    const occasionDays = monthOccasions.map((occasion) => dayjs(occasion.date).date())

    return (
        <Box>
            {/* HEADER: title on the left, Add button on the right */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                <Box>
                    <Typography variant="h3" color="primary">Calendar</Typography>
                    <Typography color="text.secondary">Birthdays, holidays, and everything in between.</Typography>
                </Box>
                <Button variant="contained" color="secondary" startIcon={<AddIcon />} onClick={openAdd}>
                    Add occasion
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Calendar and list side by side on wide screens, stacked on phones */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'auto 1fr' }, gap: 3, alignItems: 'start' }}>
                <Paper>
                    {/* LocalizationProvider tells MUI X to use dayjs for dates */}
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DateCalendar
                            referenceDate={month}
                            onMonthChange={(newMonth) => setMonth(newMonth.startOf('month'))}
                            onYearChange={(newYear) => setMonth(newYear.startOf('month'))}
                            slots={{ day: OccasionDay }}
                            slotProps={{ day: { occasionDays } }}
                        />
                    </LocalizationProvider>
                </Paper>

                <Paper sx={{ p: 2 }}>
                    <Typography variant="h5" sx={{ mb: 2 }}>{month.format('MMMM YYYY')}</Typography>
                    <OccasionList
                        occasions={monthOccasions}
                        onEdit={openEdit}
                        onDelete={setOccasionToDelete}
                        showRecipient
                    />
                </Paper>
            </Box>

            {/* ADD / EDIT: the "For" dropdown appears because recipients are passed */}
            <OccasionDialog
                open={dialogOpen}
                occasion={editingOccasion}
                recipients={recipients}
                onClose={() => setDialogOpen(false)}
                onSaved={handleSaved}
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
