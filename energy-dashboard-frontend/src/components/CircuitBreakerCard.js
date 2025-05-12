import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, TextField, IconButton, Alert, Button, Chip, Fade } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import SettingsIcon from '@mui/icons-material/Settings';
import PowerIcon from '@mui/icons-material/Power';
import PowerOffIcon from '@mui/icons-material/PowerOff';
import RefreshIcon from '@mui/icons-material/Refresh';

const CircuitBreakerCard = ({ name, location, currentData, onAlert, onToggle, status }) => {
    const currentHour = new Date().getHours();
    const data = currentData || { current: 0, voltage: 0, power_factor: 0 };
    
    // Calculate power in watts
    const powerWatts = data.current * data.voltage * (data.power_factor / 100);
    
    // State for watt limit and settings
    const [wattLimit, setWattLimit] = useState(() => {
        const savedLimit = localStorage.getItem(`wattLimit_${name}`);
        return savedLimit ? parseFloat(savedLimit) : 1500; // Default 1500W
    });
    const [isEditing, setIsEditing] = useState(false);
    const [tempLimit, setTempLimit] = useState(wattLimit);
    const [showAlert, setShowAlert] = useState(false);
    const [showStatusChange, setShowStatusChange] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const [lastAlertTime, setLastAlertTime] = useState(null);

    // Effect for status change animation
    useEffect(() => {
        setShowStatusChange(true);
        const timer = setTimeout(() => {
            setShowStatusChange(false);
        }, 2000);
        return () => clearTimeout(timer);
    }, [status]);

    // Effect for refresh animation
    useEffect(() => {
        setIsRefreshing(true);
        setLastUpdate(new Date());
        const timer = setTimeout(() => {
            setIsRefreshing(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, [data]);

    // Save limit to localStorage when changed
    useEffect(() => {
        localStorage.setItem(`wattLimit_${name}`, wattLimit.toString());
    }, [wattLimit, name]);

    // Check for limit exceedance
    useEffect(() => {
        if (powerWatts > wattLimit && status === 'On') {
            setShowAlert(true);
            // Only trigger alert if it's been at least 30 seconds since the last alert
            const now = new Date();
            if (!lastAlertTime || (now - lastAlertTime) > 30000) {
                if (onAlert) {
                    onAlert({
                        id: Date.now(),
                        type: 'warning',
                        message: `Power limit exceeded in ${name}`,
                        breaker: name,
                        time: now.toLocaleString(),
                        details: {
                            current: `${data.current.toFixed(2)}A`,
                            voltage: `${data.voltage.toFixed(2)}V`,
                            power: `${powerWatts.toFixed(0)}W`,
                            location: location,
                            breaker: name,
                            timestamp: now.toISOString(),
                            status: 'Active',
                            recommendations: [
                                'Check for high-power appliances',
                                'Consider load balancing',
                                'Review power usage patterns'
                            ]
                        }
                    });
                    setLastAlertTime(now);
                }
            }
        } else {
            setShowAlert(false);
        }
    }, [powerWatts, wattLimit, name, location, onAlert, status, data, lastAlertTime]);

    const handleSaveLimit = () => {
        if (tempLimit > 0) {
            setWattLimit(tempLimit);
            setIsEditing(false);
        }
    };

    const handleToggle = () => {
        if (onToggle) {
            onToggle(name);
        }
    };

    return (
        <Card 
            sx={{ 
                minWidth: 275, 
                mb: 2,
                transition: 'all 0.3s ease',
                transform: showStatusChange ? 'scale(1.02)' : 'scale(1)',
                boxShadow: showStatusChange ? 6 : 1,
                border: showStatusChange ? `2px solid ${status === 'On' ? '#4caf50' : '#f44336'}` : 'none',
                position: 'relative',
                overflow: 'visible'
            }}
        >
            {showAlert && (
                <Alert 
                    severity="warning" 
                    icon={<WarningIcon />}
                    sx={{ 
                        mb: 2,
                        position: 'absolute',
                        top: -40,
                        left: 0,
                        right: 0,
                        zIndex: 1,
                        animation: 'slideDown 0.3s ease-out',
                        '@keyframes slideDown': {
                            '0%': { transform: 'translateY(-20px)', opacity: 0 },
                            '100%': { transform: 'translateY(0)', opacity: 1 }
                        }
                    }}
                >
                    Power limit exceeded! Current usage: {powerWatts.toFixed(0)}W
                </Alert>
            )}
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h5" component="div">
                    {name}
                </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                            icon={status === 'On' ? <PowerIcon /> : <PowerOffIcon />}
                            label={status}
                            color={status === 'On' ? 'success' : 'error'}
                            size="small"
                            sx={{
                                transition: 'all 0.3s ease',
                                transform: showStatusChange ? 'scale(1.1)' : 'scale(1)',
                            }}
                        />
                        <IconButton 
                            size="small" 
                            onClick={() => setIsEditing(!isEditing)}
                            color={isEditing ? "primary" : "default"}
                        >
                            <SettingsIcon />
                        </IconButton>
                    </Box>
                </Box>
                
                <Typography color="text.secondary" gutterBottom>
                    Location: {location}
                </Typography>

                <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="body2" sx={{ flex: 1 }}>
                        Current Hour ({currentHour}:00): {data.current.toFixed(2)}A
                    </Typography>
                        <Fade in={isRefreshing}>
                            <RefreshIcon 
                                sx={{ 
                                    fontSize: 16,
                                    color: 'primary.main',
                                    animation: isRefreshing ? 'spin 1s linear' : 'none',
                                    '@keyframes spin': {
                                        '0%': { transform: 'rotate(0deg)' },
                                        '100%': { transform: 'rotate(360deg)' }
                                    }
                                }} 
                            />
                        </Fade>
                    </Box>
                    <Typography variant="body2">
                        Voltage: {data.voltage.toFixed(2)}V
                    </Typography>
                    <Typography variant="body2">
                        Power Factor: {(data.power_factor * 100).toFixed(1)}%
                    </Typography>
                    <Typography 
                        variant="body2" 
                        sx={{ 
                            mt: 1, 
                            fontWeight: 'bold',
                            color: showAlert ? 'warning.main' : 'inherit'
                        }}
                    >
                        Power Usage: {powerWatts.toFixed(0)}W
                    </Typography>
                    
                    {isEditing ? (
                        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TextField
                                size="small"
                                label="Watt Limit"
                                type="number"
                                value={tempLimit}
                                onChange={(e) => setTempLimit(parseFloat(e.target.value))}
                                InputProps={{ inputProps: { min: 0 } }}
                            />
                            <Button 
                                size="small" 
                                variant="contained"
                                onClick={handleSaveLimit}
                            >
                                Save
                            </Button>
                        </Box>
                    ) : (
                        <Typography 
                            variant="body2" 
                            color={showAlert ? "warning.main" : "text.secondary"}
                            sx={{ fontWeight: showAlert ? 'bold' : 'normal' }}
                        >
                            Power Limit: {wattLimit}W
                        </Typography>
                    )}

                    <Button
                        variant={status === 'On' ? 'contained' : 'outlined'}
                        color={status === 'On' ? 'success' : 'error'}
                        onClick={handleToggle}
                        startIcon={status === 'On' ? <PowerIcon /> : <PowerOffIcon />}
                        sx={{ 
                            mt: 2, 
                            width: '100%',
                            transition: 'all 0.3s ease',
                            transform: showStatusChange ? 'scale(1.05)' : 'scale(1)',
                        }}
                    >
                        {status === 'On' ? 'Turn Off' : 'Turn On'}
                    </Button>

                    <Typography 
                        variant="caption" 
                        color="text.secondary" 
                        sx={{ 
                            display: 'block', 
                            mt: 1, 
                            textAlign: 'right',
                            opacity: 0.7
                        }}
                    >
                        Last updated: {lastUpdate.toLocaleTimeString()}
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
};

export default CircuitBreakerCard;
