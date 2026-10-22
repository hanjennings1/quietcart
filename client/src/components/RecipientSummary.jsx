// One recipient's card on the dashboard:
// their color, name, and (unpurchased) gift ideas
// Built for quick-checks while shopping

import { Link as RouterLink } from 'react-router-dom'
import { Box, Link, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'

import BudgetBar from './BudgetBar.jsx'
import { recipientColor } from '../theme.js'
import { formatMoney } from '../utils/format.js'

// recipient: one item from the dashboard's "recipients" list:
// { id, name, relationship, budget spent, ideas: [...] }
function RecipientSummary({ recipient }) {
    // The same color everywhere for this recipient, based on their id
    const color = recipientColor(recipient.id)

    return (
        // overflow: hidden, keeps the color stripe inside rounded corners
        <Paper sx={{ overflow: 'hidden', height: '100%' }}>
            {/* COLOR STIPE */}
            <Box sx={{ height: 6, bgcolor: color }} />

            <Box sx={{ p: 2 }}>
                {/* NAME (links to their page) AND RELATIONSHIP */}
                <Link
                    component={RouterLink}
                    to={`/recipients/${recipient.id}`}
                    variant="h5"
                    underline="hover"
                    color="primary"
                >
                    {recipient.name}
                </Link>
                {recipient.relationship && (
                    <Typography variant="body2" color="text.secondary">
                        {recipient.relationship}
                    </Typography>
                )}

                {/* BUDGET */}
                <Box sx={{ my: 2 }}>
                    <BudgetBar spent={recipient.spent} budget={recipient.budget} color={color} />
                </Box>

                {/* IDEAS STILL TO BUY */}
                {recipient.ideas.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">No ideas yet</Typography>
                ) : (
                    <Stack spacing={1}>
                        {recipient.ideas.map((idea) => (
                            // A soft tint of the recipient's color behind each idea
                            <Box
                                key={idea.id}
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    gap: 1,
                                    px: 1.5,
                                    py: 0.75,
                                    borderRadius: 2,
                                    bgcolor: alpha(color, 0.18),
                                }}
                            >
                                {/* Ideas with a store link open it in a new tab */}
                                {idea.url ? (
                                    <Link href={idea.url} target="_blank" rel="noopener noreferrer" color="primary">
                                        {idea.name}
                                    </Link>
                                ) : (
                                    <Typography variant="body2" color="primary">{idea.name}</Typography>
                                )}
                                <Typography variant="body2" color="text.secondary">
                                    {formatMoney(idea.price)}
                                </Typography>
                            </Box>
                        ))}
                    </Stack>
                )}
            </Box>
        </Paper>
    )
}

export default RecipientSummary