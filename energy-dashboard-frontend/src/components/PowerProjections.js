import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    CircularProgress,
    Alert,
    Card,
    CardContent,
    Divider
} from '@mui/material';
import {
    TrendingUp as TrendingUpIcon,
    CalendarMonth as CalendarIcon,
    ElectricBolt as ElectricBoltIcon,
    AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { powerService } from '../services/powerService';
import { useAuth } from '../context/AuthContext';

const PowerProjections = () => {
    const { user } = useAuth();
    const [projections, setProjections] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProjections = async () => {
            try {
                setLoading(true);
                setError('');
                const data = await powerService.getPowerProjections(user.id);
                setProjections(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchProjections();
        }
    }, [user]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ mb: 2 }}>
                {error}
            </Alert>
        );
    }

    if (!projections) {
        return null;
    }

    const {
        current_month,
        yearly,
        averages,
        kwh_rate
    } = projections;

    return (
        <Box>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon /> Power Consumption Projections
            </Typography>

            <Grid container spacing={3}>
                {/* Current Month Projections */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CalendarIcon /> Current Month
                            </Typography>
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle1" color="text.secondary">
                                    Projected Total
                                </Typography>
                                <Typography variant="h4" sx={{ my: 1 }}>
                                    {powerService.formatKWH(current_month.projected_kwh)} kWh
                                </Typography>
                                <Typography variant="h5" color="primary">
                                    {powerService.formatCurrency(current_month.projected_cost)}
                                </Typography>
                            </Box>
                            <Divider sx={{ my: 2 }} />
                            <Box>
                                <Typography variant="subtitle1" color="text.secondary">
                                    Remaining This Month
                                </Typography>
                                <Typography variant="h4" sx={{ my: 1 }}>
                                    {powerService.formatKWH(current_month.remaining_kwh)} kWh
                                </Typography>
                                <Typography variant="h5" color="primary">
                                    {powerService.formatCurrency(current_month.remaining_cost)}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Yearly Projections */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CalendarIcon /> Yearly Projection
                            </Typography>
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle1" color="text.secondary">
                                    Projected Total
                                </Typography>
                                <Typography variant="h4" sx={{ my: 1 }}>
                                    {powerService.formatKWH(yearly.projected_kwh)} kWh
                                </Typography>
                                <Typography variant="h5" color="primary">
                                    {powerService.formatCurrency(yearly.projected_cost)}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Daily Averages */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <ElectricBoltIcon /> Daily Averages
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Box>
                                        <Typography variant="subtitle1" color="text.secondary">
                                            Average Daily Consumption
                                        </Typography>
                                        <Typography variant="h4" sx={{ my: 1 }}>
                                            {powerService.formatKWH(averages.daily_kwh)} kWh
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Box>
                                        <Typography variant="subtitle1" color="text.secondary">
                                            Average Daily Cost
                                        </Typography>
                                        <Typography variant="h4" sx={{ my: 1 }}>
                                            {powerService.formatCurrency(averages.daily_cost)}
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Current kWh Rate: {powerService.formatCurrency(kwh_rate)}/kWh
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default PowerProjections; 