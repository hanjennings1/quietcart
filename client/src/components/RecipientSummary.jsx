// One recipient's card on the dashboard:
// their color, name, and (unpurchased) gift ideas
// Built for quick-checks while shopping

import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { Box, Chip, Link, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'

import BudgetBar from './BudgetBar.jsx'
import { recipientColor } from '../theme.js'
import { formatMoney } from '../utils/format.js'


// How many chips fit on a dashboard card before the rest collapse into "+N"
const MAX_CHIPS = 3

// How many ideas a dashboard card shows before the rest collapse into "+N more"
const MAX_IDEAS = 3

// recipient: one item from the dashboard's "recipients" list:
// { id, name, relationship, budget, spent, interests: [...], ideas: [...] }
function RecipientSummary({ recipient }) {
    // The same color everywhere for this recipient, based on their id
    const color = recipientColor(recipient.color)
    const navigate = useNavigate()

    // First few chips for a quick "what do they like?" glance while shopping
    const shownChips = recipient.interests.slice(0, MAX_CHIPS)
    const hiddenCount = recipient.interests.length - shownChips.length

    // First few ideas; the full list is one click away on the recipient's page
    const shownIdeas = recipient.ideas.slice(0, MAX_IDEAS)
    const hiddenIdeas = recipient.ideas.length - shownIdeas.length

    return (
        // overflow: hidden, keeps the color stripe inside rounded corners
        <Paper sx={{ overflow: 'hidden', height: '100%' }}>
            {/* COLOR STRIPE */}
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

                {/* INTERESTS: a quick reminder of what they like */}
                {shownChips.length > 0 && (
                    <Stack direction="row" spacing={0.5} useFlexGap sx={{ mt: 1, flexWrap: 'wrap' }}>
                        {shownChips.map((interest) => (
                            <Chip
                                key={interest.id}
                                label={interest.label}
                                size="small"
                                onClick={() => navigate(`/interests/${interest.id}`)}
                                sx={{ bgcolor: alpha(color, 0.25) }}
                            />
                        ))}
                        {/* the rest are on the recipient's page */}
                        {hiddenCount > 0 && (
                            <Chip
                                label={`+${hiddenCount}`}
                                size="small"
                                variant="outlined"
                                onClick={() => navigate(`/recipients/${recipient.id}`)}
                            />
                        )}
                    </Stack>
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
                        {shownIdeas.map((idea) => (
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

                {/* the rest live on the recipient's page */}
                {hiddenIdeas > 0 && (
                    <Link
                        component={RouterLink}
                        to={`/recipients/${recipient.id}`}
                        variant="body2"
                        underline="hover"
                        sx={{ display: 'inline-block', mt: 1 }}
                    >
                        +{hiddenIdeas} more {hiddenIdeas === 1 ? 'idea' : 'ideas'}
                    </Link>
                )}
            </Box>
        </Paper>
    )
}

export default RecipientSummary