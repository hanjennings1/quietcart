// The dashboard's "Recently Saved" list
// the newest unpurchased ideas, each tagged with recipient

import { Link as RouterLink } from 'react-router-dom'
import { Box, Chip, Paper, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'

import { recipientColor } from '../theme.js'

//ideas: each includes recipient_id and recipient_name
function RecentIdeas({ ideas }) {
    // NOTHING SAVED YET: show nothing at all
    if (ideas.length === 0) return null

    return (
        <Box>
            <Typography variant="h5" sx={{ mb: 2 }}>Recently saved</Typography>
            <Paper>
                {ideas.map((idea, index) => (
                    <Box
                        key={idea.id}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 2,
                            px: 2,
                            py: 1.5,
                            // A thin divider between rows (but not above the first one)
                            borderTop: index === 0 ? 'none' : '1px solid',
                            borderColor: 'divider',
                        }}
                    >
                        <Typography>{idea.name}</Typography>

                        {/* Who it's for, in their color; clicking goes to their page */}
                        <Chip
                            label={idea.recipient_name}
                            component={RouterLink}
                            to={`/recipients/${idea.recipient_id}`}
                            clickable
                            size="small"
                            sx={{
                                bgcolor: alpha(recipientColor(idea.recipient_id), 0.3),
                                color: 'primary.main',
                                fontWeight: 600,
                            }}
                        />
                    </Box>
                ))}
            </Paper>
        </Box>
    )
}

export default RecentIdeas