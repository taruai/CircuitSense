import React from 'react';
import {
  Box,
  Typography,
  Paper,
  useTheme,
  LinearProgress,
  Grid,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Bolt as BoltIcon,
  Power as PowerIcon,
  Timer as TimerIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';

const PowerOverview = ({ 
  circuitBreakers,
  onTabChange
}) => {
  const theme = useTheme();

  const getOverloadColor = (percentage) => {
    if (percentage <= 100) return 'success.main';
    if (percentage <= 110) return 'warning.main';
    if (percentage <= 120) return 'error.main';
    return 'error.dark';
  };

  const calculateStats = () => {
    // Debug: Log all breakers
    console.log('All breakers:', circuitBreakers);

    const totalPower = circuitBreakers.reduce((sum, breaker) => {
      const currentData = breaker.currentData || { current: 0, voltage: 0 };
      return sum + (breaker.status === 'On' ? currentData.current * currentData.voltage : 0);
    }, 0);

    const activeBreakers = circuitBreakers.filter(b => b.status === 'On').length;
    const totalBreakers = circuitBreakers.length;
    const avgPowerPerBreaker = totalPower / (activeBreakers || 1);

    // Debug: Check Kitchen breaker specifically
    const kitchenBreaker = circuitBreakers.find(b => b.name === 'Kitchen');
    if (kitchenBreaker) {
      const currentData = kitchenBreaker.currentData || { current: 0, voltage: 0 };
      const currentPower = currentData.current * currentData.voltage;
      const wattLimit = parseFloat(localStorage.getItem(`wattLimit_${kitchenBreaker.name}`)) || 1500;
      console.log('Kitchen breaker:', {
        name: kitchenBreaker.name,
        status: kitchenBreaker.status,
        currentData,
        currentPower,
        wattLimit,
        isOverloaded: currentPower > wattLimit
      });
    }

    const overloadedBreakers = circuitBreakers.filter(breaker => {
      const currentData = breaker.currentData || { current: 0, voltage: 0 };
      const currentPower = currentData.current * currentData.voltage;
      const wattLimit = parseFloat(localStorage.getItem(`wattLimit_${breaker.name}`)) || 1500;
      const isOverloaded = breaker.status === 'On' && currentPower > wattLimit;
      
      // Debug: Log each breaker's overload check
      console.log(`${breaker.name} overload check:`, {
        status: breaker.status,
        currentData,
        currentPower,
        wattLimit,
        isOverloaded
      });
      
      return isOverloaded;
    });

    const overloadedBreakerNames = overloadedBreakers.map(breaker => {
      const currentData = breaker.currentData || { current: 0, voltage: 0 };
      const currentPower = currentData.current * currentData.voltage;
      const wattLimit = parseFloat(localStorage.getItem(`wattLimit_${breaker.name}`)) || 1500;
      const percentage = ((currentPower / wattLimit) * 100).toFixed(1);
      return {
        name: breaker.name,
        percentage: parseFloat(percentage),
        currentPower: (currentPower / 1000).toFixed(1), // Convert to kW
        limit: (wattLimit / 1000).toFixed(1) // Convert to kW
      };
    });

    // Debug: Log final results
    console.log('Overloaded breakers:', overloadedBreakers);
    console.log('Overloaded breaker names:', overloadedBreakerNames);

    return {
      totalPower: totalPower / 1000, // Convert to kW
      activeBreakers,
      totalBreakers,
      avgPowerPerBreaker: avgPowerPerBreaker / 1000, // Convert to kW
      overloadedBreakers: overloadedBreakers.length,
      overloadedBreakerNames,
      utilization: (activeBreakers / totalBreakers) * 100
    };
  };

  const stats = calculateStats();

  const StatCard = ({ title, value, icon, color, tooltip, trend }) => (
    <Paper
      sx={{
        p: 2,
        height: '100%',
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: (theme) => alpha(theme.palette[color].main, 0.1)
          }}
        >
          {icon}
        </Box>
        <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
        {tooltip && (
          <Tooltip 
            title={
              typeof tooltip === 'string' ? tooltip : (
                <Box sx={{ p: 1 }}>
                  {tooltip}
                </Box>
              )
            }
            componentsProps={{
              tooltip: {
                sx: {
                  bgcolor: 'background.paper',
                  color: 'text.primary',
                  border: 1,
                  borderColor: 'divider',
                  boxShadow: 3,
                  '& .MuiTooltip-arrow': {
                    color: 'background.paper'
                  }
                }
              }
            }}
          >
            <IconButton size="small">
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
        <Typography variant="h5" component="div">
          {value}
        </Typography>
        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', color: trend > 0 ? 'success.main' : 'error.main' }}>
            {trend > 0 ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />}
            <Typography variant="caption" sx={{ ml: 0.5 }}>
              {Math.abs(trend)}%
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );

  const renderOverloadedBreakersTooltip = () => {
    if (stats.overloadedBreakerNames.length === 0) {
      return "No breakers are currently overloaded";
    }

    return (
      <Box sx={{ minWidth: 200 }}>
        <Typography variant="subtitle2" gutterBottom>
          Overloaded Breakers:
        </Typography>
        {stats.overloadedBreakerNames.map((breaker, index) => (
          <Box
            key={breaker.name}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: index < stats.overloadedBreakerNames.length - 1 ? 1 : 0,
              color: getOverloadColor(breaker.percentage)
            }}
          >
            <BoltIcon fontSize="small" />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {breaker.name}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block' }}>
                {breaker.currentPower} kW / {breaker.limit} kW ({breaker.percentage}%)
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Paper 
      elevation={0}
      sx={{ 
        mt: 2,
        bgcolor: 'background.paper',
        borderRadius: 2,
        overflow: 'hidden',
        border: 1,
        borderColor: 'divider'
      }}
    >
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: 1,
        borderColor: 'divider'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BoltIcon color="primary" />
          <Typography variant="h6">Power Overview</Typography>
        </Box>
      </Box>
      <Box sx={{ p: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Power"
              value={`${stats.totalPower.toFixed(1)} kW`}
              icon={<BoltIcon color="primary" />}
              color="primary"
              tooltip="Current total power consumption across all active breakers"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Active Breakers"
              value={`${stats.activeBreakers}/${stats.totalBreakers}`}
              icon={<PowerIcon color="success" />}
              color="success"
              tooltip="Number of currently active circuit breakers"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Avg. Power/Breaker"
              value={`${stats.avgPowerPerBreaker.toFixed(1)} kW`}
              icon={<TimerIcon color="info" />}
              color="info"
              tooltip="Average power consumption per active breaker"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Overloaded"
              value={stats.overloadedBreakers}
              icon={<BoltIcon color="error" />}
              color="error"
              tooltip={renderOverloadedBreakersTooltip()}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2">System Utilization</Typography>
            <Typography variant="caption" color="text.secondary">
              {stats.utilization.toFixed(1)}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={stats.utilization}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
              '& .MuiLinearProgress-bar': {
                bgcolor: stats.utilization > 80 ? 'error.main' : 'primary.main'
              }
            }}
          />
        </Box>
      </Box>
    </Paper>
  );
};

export default React.memo(PowerOverview); 