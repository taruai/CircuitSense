import React, { useState, useEffect } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { Typography, Paper, ToggleButton, ToggleButtonGroup, Box, useTheme } from '@mui/material';
import RateSettings from './RateSettings';
import { useSettings } from '../context/SettingsContext';

// Time-based usage patterns (0-23 hours)
export const TIME_PATTERNS = {
    'Main Panel': [0.1, 0.1, 0.1, 0.1, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
    'Main Bedroom': [0.2, 0.1, 0.1, 0.1, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
    'Kitchen': [0.1, 0.1, 0.1, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 0.9, 0.8, 0.7, 0.6, 0.7, 0.8, 0.9, 0.8, 0.7, 0.6, 0.5],
    'Bathroom': [0.2, 0.1, 0.1, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 0.9, 0.8, 0.7, 0.6, 0.7, 0.8, 0.9, 0.8, 0.7, 0.6, 0.5],
    'Guest Bedroom': [0.2, 0.1, 0.1, 0.1, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
    'Living Room': [0.3, 0.2, 0.1, 0.1, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 0.9, 0.8, 0.7, 0.8, 0.9, 1.0, 0.9, 0.8, 0.7, 0.6],
    'Garage': [0.1, 0.1, 0.1, 0.1, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0.1]
};

// Typical power consumption ranges for different rooms (in watts)
export const ROOM_CONSUMPTION = {
    'Main Panel': { min: 5, max: 15, peak: 10 },
    'Main Bedroom': { min: 4, max: 12, peak: 8 },
    'Kitchen': { min: 6, max: 18, peak: 12 },
    'Bathroom': { min: 3, max: 9, peak: 6 },
    'Guest Bedroom': { min: 3, max: 9, peak: 6 },
    'Living Room': { min: 5, max: 15, peak: 10 },
    'Garage': { min: 2, max: 6, peak: 4 }
};

// Sample data for testing
const generateSampleData = (breakerName) => {
    const data = [];
            const now = new Date();
    const baseConsumption = {
        'Main Panel': { min: 2000, max: 5000 },
        'Kitchen': { min: 1500, max: 3000 },
        'Living Room': { min: 800, max: 2000 },
        'Main Bedroom': { min: 500, max: 1500 },
        'Guest Bedroom': { min: 400, max: 1200 },
        'Bathroom': { min: 300, max: 1000 },
        'Garage': { min: 200, max: 800 }
    }[breakerName] || { min: 500, max: 1500 };

    // Generate 24 hours of data
            for (let i = 23; i >= 0; i--) {
                const time = new Date(now - i * 3600000);
                const hour = time.getHours();
        
        // Time-based consumption patterns
        let timeFactor;
        if (hour >= 6 && hour <= 9) {
            // Morning peak
            timeFactor = 0.8 + Math.random() * 0.2;
        } else if (hour >= 17 && hour <= 22) {
            // Evening peak
            timeFactor = 0.9 + Math.random() * 0.1;
        } else if (hour >= 23 || hour <= 5) {
            // Night low
            timeFactor = 0.2 + Math.random() * 0.2;
        } else {
            // Day normal
            timeFactor = 0.5 + Math.random() * 0.3;
        }

        const power = baseConsumption.min + (baseConsumption.max - baseConsumption.min) * timeFactor;
        const voltage = 230 + (Math.random() * 10 - 5); // Voltage variation ±5V
        const current = power / voltage;
        const cost = (power / 1000) * 12.0; // Assuming 12 PHP per kWh

        data.push({
                    time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    current: parseFloat(current.toFixed(2)),
            voltage: parseFloat(voltage.toFixed(2)),
            power: parseFloat(power.toFixed(2)),
            cost: parseFloat(cost.toFixed(2))
                });
            }
    return data;
};

const EnergyChart = ({ breaker, isOn }) => {
    const { settings } = useSettings();
    const theme = useTheme();
    const [data, setData] = useState(generateSampleData(breaker.name));
    const [viewMode, setViewMode] = useState('power');
    const [rates, setRates] = useState(() => {
        const savedRates = localStorage.getItem('electricityRates');
        return savedRates ? JSON.parse(savedRates) : {
            kwhRate: 12.0,
            currency: 'PHP'
        };
    });

    const handleRateChange = (newRates) => {
        setRates(newRates);
    };

    const handleViewModeChange = (event, newMode) => {
        if (newMode !== null) {
            setViewMode(newMode);
        }
    };

    const calculateCost = (power) => {
        const kwh = power / 1000; // Convert watts to kWh
        return kwh * rates.kwhRate;
    };

    // Update data periodically
    useEffect(() => {
        if (!isOn) {
            setData([]);
            return;
        }

        const updateData = () => {
            setData(generateSampleData(breaker.name));
        };

        updateData();
        const interval = setInterval(updateData, settings.refreshRate * 1000);
        return () => clearInterval(interval);
    }, [breaker.name, isOn, settings.refreshRate]);

    const formatYAxis = (value) => {
        if (viewMode === 'cost') {
            return `₱${value.toFixed(2)}`;
        }
        return value.toFixed(1);
    };

    const formatTooltip = (value, name) => {
        if (name === 'cost') {
            return [`₱${value.toFixed(2)}`, 'Cost'];
        }
        return [value, name];
    };

    // Debug log for settings
    console.log('Current settings:', settings);
    console.log('View mode:', viewMode);

    return (
        <Paper 
            sx={{ 
                p: 2, 
                height: 600,
                width: '100%', 
                mb: 3,
                mx: 0,
                overflow: 'hidden',
                boxSizing: 'border-box',
                bgcolor: 'background.paper',
                maxWidth: '100%'
            }}
        >
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 2,
                flexWrap: 'wrap',
                gap: 1,
                width: '100%'
            }}>
                <Typography variant="h6" sx={{ flex: '1 1 auto' }}>
                {breaker.name} - Energy Usage
            </Typography>
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    flexWrap: 'wrap'
                }}>
                    <ToggleButtonGroup
                        value={viewMode}
                        exclusive
                        onChange={handleViewModeChange}
                        size="small"
                    >
                        <ToggleButton value="power">Power</ToggleButton>
                        <ToggleButton value="cost">Cost</ToggleButton>
                    </ToggleButtonGroup>
                    <RateSettings onRateChange={handleRateChange} />
                </Box>
            </Box>
            <Box sx={{ width: '100%', height: 'calc(100% - 60px)', overflow: 'hidden' }}>
                <ResponsiveContainer width="100%" height={550}>
                <LineChart
                    data={data}
                    margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                            bottom: 40,
                    }}
                >
                        <CartesianGrid 
                            strokeDasharray="3 3" 
                            stroke={theme.palette.mode === 'dark' ? '#424242' : '#e0e0e0'}
                        />
                    <XAxis 
                        dataKey="time" 
                            tick={{ fontSize: 12, fill: theme.palette.text.primary }}
                            height={60}
                            tickMargin={10}
                            stroke={theme.palette.text.primary}
                    />
                    <YAxis 
                        yAxisId="left"
                            tick={{ fontSize: 12, fill: theme.palette.text.primary }}
                            label={{ 
                                value: viewMode === 'power' ? 'Current/Power' : 'Cost', 
                                angle: -90, 
                                position: 'left',
                                offset: -5,
                                fill: theme.palette.text.primary
                            }}
                            tickFormatter={formatYAxis}
                            domain={[0, 'auto']}
                            width={80}
                            stroke={theme.palette.text.primary}
                    />
                    <YAxis 
                        yAxisId="right" 
                        orientation="right"
                            tick={{ fontSize: 12, fill: theme.palette.text.primary }}
                            label={{ 
                                value: 'Voltage', 
                                angle: 90, 
                                position: 'right',
                                offset: -5,
                                fill: theme.palette.text.primary
                            }}
                            domain={[0, 'auto']}
                            width={80}
                            stroke={theme.palette.text.primary}
                    />
                        <Tooltip 
                            formatter={formatTooltip}
                            contentStyle={{
                                backgroundColor: theme.palette.background.paper,
                                border: `1px solid ${theme.palette.divider}`,
                                color: theme.palette.text.primary
                            }}
                        />
                        <Legend 
                            verticalAlign="bottom" 
                            height={36}
                            wrapperStyle={{
                                paddingTop: '10px',
                                color: theme.palette.text.primary
                            }}
                        />
                        {viewMode === 'power' && settings.showCurrent && (
                    <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="current"
                        name="Current (A)"
                        stroke="#8884d8"
                                strokeWidth={3}
                        activeDot={{ r: 8 }}
                        animationDuration={800}
                        animationEasing="ease-in-out"
                                dot={{ r: 4 }}
                    />
                        )}
                        {viewMode === 'power' && settings.showVoltage && (
                    <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="voltage"
                        name="Voltage (V)"
                        stroke="#82ca9d"
                        strokeWidth={2}
                        animationDuration={800}
                        animationEasing="ease-in-out"
                    />
                        )}
                        {viewMode === 'power' && settings.showPower && (
                    <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="power"
                        name="Power (W)"
                        stroke="#ff7300"
                        strokeWidth={2}
                        animationDuration={800}
                        animationEasing="ease-in-out"
                    />
                        )}
                        {viewMode === 'cost' && settings.showCost && (
                            <Line 
                                yAxisId="left"
                                type="monotone" 
                                dataKey="cost" 
                                name="Cost"
                                stroke="#ff7300"
                                strokeWidth={2}
                                animationDuration={800}
                                animationEasing="ease-in-out"
                            />
                        )}
                </LineChart>
            </ResponsiveContainer>
            </Box>
        </Paper>
    );
};

export default EnergyChart;