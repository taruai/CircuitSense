import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    Typography,
    IconButton,
    Tooltip
} from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';

const RateSettings = ({ onRateChange }) => {
    const [open, setOpen] = useState(false);
    const [rates, setRates] = useState(() => {
        const savedRates = localStorage.getItem('electricityRates');
        return savedRates ? JSON.parse(savedRates) : {
            kwhRate: 8.0,  // Default rate in PHP per kWh
            currency: 'PHP'
        };
    });

    useEffect(() => {
        onRateChange(rates);
    }, [rates, onRateChange]);

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const handleRateChange = (event) => {
        const newRates = {
            ...rates,
            kwhRate: parseFloat(event.target.value)
        };
        setRates(newRates);
        localStorage.setItem('electricityRates', JSON.stringify(newRates));
    };

    return (
        <>
            <Tooltip title="Rate Settings">
                <IconButton 
                    onClick={handleOpen}
                    size="small"
                    sx={{ 
                        border: '1px solid rgba(0, 0, 0, 0.23)',
                        '&:hover': {
                            border: '1px solid rgba(0, 0, 0, 0.87)'
                        }
                    }}
                >
                    <SettingsIcon fontSize="small" />
                </IconButton>
            </Tooltip>
            <Dialog 
                open={open} 
                onClose={handleClose}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>Electricity Rate Settings</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Rate per kWh"
                                type="number"
                                value={rates.kwhRate}
                                onChange={handleRateChange}
                                InputProps={{
                                    startAdornment: <Typography sx={{ mr: 1 }}>₱</Typography>,
                                    inputProps: { min: 0, step: 0.01 }
                                }}
                                helperText="Enter your electricity rate per kilowatt-hour"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Close</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default RateSettings; 