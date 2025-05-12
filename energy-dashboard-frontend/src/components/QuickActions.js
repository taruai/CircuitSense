import React from 'react';
import { Paper, Typography, Stack, Box, Button, LinearProgress } from '@mui/material';

const QuickActions = ({ onToggle, circuitBreakers }) => {
    return (
        <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
                Quick Actions
            </Typography>
            <Stack spacing={2}>
                {['Main Panel', 'Kitchen', 'Living Room'].map(breakerName => {
                    const breaker = circuitBreakers.find(b => b.name === breakerName);
                    const isOn = breaker?.status === 'On';
                    
                    return (
                        <Box key={breakerName}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography>{breakerName}</Typography>
                                <Button
                                    variant={isOn ? 'contained' : 'outlined'}
                                    color={isOn ? 'success' : 'error'}
                                    size="small"
                                    onClick={() => onToggle(breakerName)}
                                >
                                    {isOn ? 'Turn Off' : 'Turn On'}
                                </Button>
                            </Stack>
                            <LinearProgress 
                                variant="determinate" 
                                value={isOn ? 100 : 0}
                                color={isOn ? 'success' : 'error'}
                                sx={{ mt: 1 }}
                            />
                        </Box>
                    );
                })}
            </Stack>
        </Paper>
    );
};

export default QuickActions; 