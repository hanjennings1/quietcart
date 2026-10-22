// A reusable "Are you sure?" pop-up for actions that can't be undone,
// like deleting a recipient (and all their gift ideas).
//
// The parent page controls it:
//   open       – whether it's showing
//   title      – the question
//   message    – what will happen
//   onConfirm  – runs when the user clicks the red confirm button
//   onCancel   – runs on Cancel (or clicking outside the pop-up)

import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'

function ConfirmDialog({
    open, title, message, confirmLabel = 'Delete', onConfirm, onCancel, busy = false,
}) {
    return (
        <Dialog open={open} onClose={onCancel}>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <DialogContentText>{message}</DialogContentText>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                {/* autoFocus on Cancel: pressing Enter by accident cancels instead of deleting */}
                <Button onClick={onCancel} autoFocus>Cancel</Button>
                <Button onClick={onConfirm} variant="contained" color="error" disabled={busy}>
                    {busy ? 'Deleting...' : confirmLabel}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default ConfirmDialog