// Shows a recipient;s spent vs budgeted (colored bar + text)
// turns red when over-budget
// used on dashboard cards and on recipient pages

import { Box, LinearProgress, Typography } from '@mui/material'

import { formatMoney } from '../utils/format.js'

// Spent = total of purchased gifts
// Budget = recipient's budget (null if no budget set)
// Color = the recipient's assigned color for the status bar
function BudgetBar({ spent, budget, color = 'primary.main' }) {
    // NO BUDGET ENTERED (null): unlimited. Show a full bar in the
    // recipient's color; never red, since there's no limit to go over.
    // (A typed $0 is NOT this case: it's a real limit, handled below.)
    if (budget === null) {
        return (
            <Box>
                <LinearProgress
                    variant="determinate"
                    value={100}
                    aria-label="No budget limit"
                    sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: 'grey.200',
                        '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: color },
                    }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {formatMoney(spent)} spent · No budget limit
                </Typography>
            </Box>
        )
    }

    // A REAL BUDGET (including $0)
    const overBudget = spent > budget

    // How full the bar is (0 to 100%, capped at 100)
    // over budget = full bar (not overflowing)
    // $0 budget: anything spent fills the bar and turns red (nothing spent = empty)
    let percent
    if (budget > 0) {
        percent = Math.min((spent / budget) * 100, 100)
    } else {
        percent = spent > 0 ? 100 : 0
    }

    return (
        <Box>
            <LinearProgress
                variant="determinate"       // a fixed amount, not a loading animation
                value={percent}
                aria-label="Budget spent"   // read aloud by screen readers
                sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: 'grey.200',   // the empty part of the bar
                    // The filled part: red when over budget, otherwise the recipient's color
                    '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                        bgcolor: overBudget ? 'error.main' : color,
                    },
                }}
            />
            <Typography
                variant="body2"
                color={overBudget ? 'error' : 'text.secondary'}
                sx={{ mt: 0.5 }}
            >
                {formatMoney(spent)} of {formatMoney(budget)}
                {/* Only added when over budget */}
                {overBudget && ` · ${formatMoney(spent - budget)} over budget`}
            </Typography>
        </Box>
    )
}