// One recipient's card on the Recipients page
// (color, name, relationship, idea count, & budget)
// the whole card links to their detail page

import { Link as RouterLink } from 'react-router-dom'
import { Box, CardActionArea, Paper, Typography } from '@mui/material'

import BudgetBar from './BudgetBar.jsx'
import { recipientColor } from '../theme.js'

// recipient: one item from GET /api/recipients:
function RecipientCard({ recipient }) {
    const color = recipientColor(recipient.id)

    // "1 Idea" versus "2 Ideas"
    const ideaLabel = recipient.idea_count === 1 ? 'idea' : 'ideas'

    return (
        <Paper sx={{ overflow: 'hidden', height: '100%' }}>
            {/* CardActionArea makes the whole card one big clickable link, with a hover effect */}
            <CardActionArea
                component={RouterLink}
                to={`/recipients/${recipient.id}`}
                sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
            >
                {/* COLOR STRIPE */}
                <Box sx={{ height: 6, bgcolor: color }} />

                <Box sx={{ p: 2, flexGrow: 1 }}>
                    <Typography variant="h5" color="primary">{recipient.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                        {/* e.g. "sister · 2 ideas", or just "2 ideas" with no relationship */}
                        {recipient.relationship && `${recipient.relationship} · `}
                        {recipient.idea_count} {ideaLabel}
                    </Typography>

                    <Box sx={{ mt: 2 }}>
                        <BudgetBar spent={recipient.spent} budget={recipient.budget} color={color} />
                    </Box>
                </Box>
            </CardActionArea>
        </Paper>
    )
}

export default RecipientCard