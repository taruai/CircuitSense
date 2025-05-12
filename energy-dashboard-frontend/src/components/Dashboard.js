import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { 
    Box, 
    Typography, 
    Tabs, 
    Tab, 
    Grid, 
    Card, 
    CardContent, 
    Button,
    Paper,
    Stack,
    Divider,
    LinearProgress,
    IconButton,
    AppBar,
    Toolbar,
    Dialog,
    DialogTitle,
    DialogContent,
    CircularProgress,
    Alert,
    Tooltip,
    useTheme,
    Badge,
    Menu,
    MenuItem,
    List,
    ListItem,
    ListItemText,
    ListItemIcon
} from '@mui/material';
import {
    Power as PowerIcon,
    Warning as WarningIcon,
    TrendingUp as TrendingUpIcon,
    Bolt as BoltIcon,
    Timer as TimerIcon,
    Settings as SettingsIcon,
    Logout as LogoutIcon,
    Close as CloseIcon,
    Refresh as RefreshIcon,
    AttachMoney as MoneyIcon,
    Timeline as TimelineIcon,
    Notifications as NotificationsIcon,
    NotificationsActive as NotificationsActiveIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import EnergyChart, { ROOM_CONSUMPTION, TIME_PATTERNS } from './EnergyChart';
import QuickActions from './QuickActions';
import Settings from './Settings';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { powerService } from '../services/powerService';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip as ChartTooltip,
    Legend
} from 'chart.js';
import {
    LineChart,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer
} from 'recharts';
import PowerProjections from './PowerProjections';
import logo from '../logo.svg';
import CircuitBreakerCard from './CircuitBreakerCard';
import { alpha } from '@mui/material/styles';
import PowerOverview from './PowerOverview';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    ChartTooltip,
    Legend
);

// Initial circuit breakers
const INITIAL_BREAKERS = [
  {
    id: 1,
    name: 'Main Panel',
    location: 'Utility Room',
    voltage_reading: 230,
    status: 'On'
  },
  {
    id: 2,
    name: 'Main Bedroom',
    location: 'Main Bedroom',
    voltage_reading: 230,
    status: 'On'
  },
  {
    id: 3,
    name: 'Kitchen',
    location: 'Kitchen',
    voltage_reading: 230,
    status: 'On'
  },
  {
    id: 4,
    name: 'Bathroom',
    location: 'Bathroom',
    voltage_reading: 230,
    status: 'On'
  },
  {
    id: 5,
    name: 'Guest Bedroom',
    location: 'Guest Bedroom',
    voltage_reading: 230,
    status: 'On'
  },
  {
    id: 6,
    name: 'Living Room',
    location: 'Living Room',
    voltage_reading: 230,
    status: 'On'
  },
  {
    id: 7,
    name: 'Garage',
    location: 'Garage',
    voltage_reading: 230,
    status: 'On'
  }
];

const INITIAL_ALERTS = [
  { id: 1, message: 'High current detected in Kitchen', breaker: 'Kitchen', time: '2024-06-01 14:23' },
  { id: 2, message: 'Voltage fluctuation in Living Room', breaker: 'Living Room', time: '2024-06-01 09:10' }
];

// Memoize the QuickActions component
const MemoizedQuickActions = memo(QuickActions);

// Memoize the EnergyChart component
const MemoizedEnergyChart = memo(EnergyChart);

// Memoize the CircuitBreakerCard component
const MemoizedCircuitBreakerCard = memo(CircuitBreakerCard);

// Memoize the PowerProjections component
const MemoizedPowerProjections = memo(PowerProjections);

const Dashboard = () => {
  const [tab, setTab] = useState(0);
  const [circuitBreakers, setCircuitBreakers] = useState(INITIAL_BREAKERS);
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [highlightedBreaker, setHighlightedBreaker] = useState(null);
  const { settings } = useSettings();
  const { user, logout } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [powerData, setPowerData] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [selectedAlert, setSelectedAlert] = useState(null);

  // Handle notification menu close - moved to top
  const handleNotificationClose = useCallback(() => {
    setNotificationAnchorEl(null);
  }, []);

  // Memoize handlers
  const handleTabChange = useCallback((event, newValue) => {
    setTab(newValue);
  }, []);

  const handleToggleBreaker = useCallback((breakerName) => {
    setCircuitBreakers(prev => {
      // If Main Panel is being toggled, affect all breakers
      if (breakerName === 'Main Panel') {
        const mainPanel = prev.find(b => b.name === 'Main Panel');
        const newStatus = mainPanel.status === 'On' ? 'Off' : 'On';
        
        return prev.map(b => ({
          ...b,
          status: newStatus // Set all breakers to the same status as Main Panel
        }));
      }
      
      // For other breakers, just toggle their individual status
      return prev.map(b =>
        b.name === breakerName
          ? { ...b, status: b.status === 'On' ? 'Off' : 'On' }
          : b
      );
    });
  }, []);

  const handleAddAlert = useCallback((newAlert) => {
    setAlerts(prev => [{
      id: Date.now(),
      message: newAlert.message,
      breaker: newAlert.breaker,
      time: new Date().toLocaleString(),
      details: newAlert.details,
      type: newAlert.type || 'warning'
    }, ...prev]);
  }, []);

  const handleCloseAlert = useCallback((alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  const handleClearAllAlerts = useCallback(() => {
    setAlerts([]);
    handleNotificationClose();
  }, [handleNotificationClose]);

  const handleHighlightBreaker = useCallback((breakerName) => {
    setHighlightedBreaker(breakerName);
    setTimeout(() => {
      setHighlightedBreaker(null);
    }, 3000);
  }, []);

  const handleCircuitBreakerAlert = useCallback((alert) => {
    handleAddAlert({
      message: alert.message,
      breaker: alert.breaker,
      details: alert.details,
      type: alert.type || 'warning'
    });
  }, [handleAddAlert]);

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  // Memoize the testConnection function
  const testConnection = useCallback(async () => {
    try {
      await powerService.testConnection();
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      setError('Backend connection failed. Please check if the server is running.');
      return false;
    }
  }, []);

  // Memoize the fetchPowerData function
  const fetchPowerData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);

      const isConnected = await testConnection();
      if (!isConnected) {
        return;
      }

      const data = await powerService.getPowerData(user.id);
      setPowerData(data);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Fetch power data error:', err);
      setError(err.message || 'Failed to fetch power data');
    } finally {
      setIsRefreshing(false);
    }
  }, [user.id, testConnection]);

  // Memoize the generateCurrentData function
  const generateCurrentData = useCallback((breaker) => {
    const now = new Date();
    const hour = now.getHours();
    const roomPattern = TIME_PATTERNS[breaker.name] || TIME_PATTERNS['Main Panel'];
    const consumption = ROOM_CONSUMPTION[breaker.name] || ROOM_CONSUMPTION['Main Panel'];
    
    if (breaker.name === 'Kitchen') {
      return {
        current: 12.5,
        voltage: 230,
        power_factor: 0.95
      };
    }
    
    const timeFactor = roomPattern[hour];
    const power = consumption.min + (consumption.max - consumption.min) * timeFactor;
    const variation = 0.9 + Math.random() * 0.2;
    const finalPower = power * variation;
    const current = finalPower / breaker.voltage_reading;
    
    return {
      current: parseFloat(current.toFixed(2)),
      voltage: parseFloat(breaker.voltage_reading.toFixed(2)),
      power_factor: 0.95
    };
  }, []);

  // Memoize dashboard metrics
  const dashboardMetrics = useMemo(() => ({
    totalBreakers: circuitBreakers.length,
    activeBreakers: circuitBreakers.filter(b => b.status === 'On').length,
    activeAlerts: alerts.length,
    totalPower: circuitBreakers.reduce((sum, breaker) => {
      const consumption = ROOM_CONSUMPTION[breaker.name] || ROOM_CONSUMPTION['Main Panel'];
      return sum + (breaker.status === 'On' ? consumption.peak : 0);
    }, 0)
  }), [circuitBreakers, alerts]);

  // Memoize chart data
  const chartData = useMemo(() => ({
    labels: powerData?.data.map(item => item.date) || [],
    datasets: [
      {
        label: 'Power (W)',
        data: powerData?.data.map(item => item.avg_power) || [],
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      },
      {
        label: 'Voltage (V)',
        data: powerData?.data.map(item => item.avg_voltage) || [],
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1
      },
      {
        label: 'Current (A)',
        data: powerData?.data.map(item => item.avg_current) || [],
        borderColor: 'rgb(54, 162, 235)',
        tension: 0.1
      }
    ]
  }), [powerData]);

  // Memoize chart options
  const chartOptions = useMemo(() => ({
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Power Consumption Over Time'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }), []);

  // Memoize render functions
  const renderDashboard = useCallback(() => (
    <Box sx={{ 
      width: '100%',
      minHeight: '100vh',
      p: 2,
      boxSizing: 'border-box',
      overflowX: 'hidden'
    }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={10}>
          <MemoizedEnergyChart 
            breaker={circuitBreakers.find(b => b.name === 'Main Panel')} 
            isOn={true} 
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <Box sx={{ 
            position: 'sticky', 
            top: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}>
            <MemoizedQuickActions 
              onToggle={handleToggleBreaker} 
              circuitBreakers={circuitBreakers}
            />
            <PowerOverview 
              circuitBreakers={circuitBreakers}
              onTabChange={handleTabChange}
            />
          </Box>
        </Grid>
      </Grid>
    </Box>
  ), [circuitBreakers, handleToggleBreaker, handleTabChange]);

  const renderCircuitBreakers = useCallback(() => (
    <Box>
      <Typography variant="h5" gutterBottom>
        Circuit Breakers
      </Typography>
      <Grid container spacing={2}>
        {circuitBreakers.map(breaker => (
          <Grid item xs={12} sm={6} md={4} key={breaker.id}>
            <MemoizedCircuitBreakerCard
              name={breaker.name}
              location={breaker.location}
              currentData={generateCurrentData(breaker)}
              onAlert={handleCircuitBreakerAlert}
              onToggle={handleToggleBreaker}
              status={breaker.status}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  ), [circuitBreakers, generateCurrentData, handleCircuitBreakerAlert, handleToggleBreaker]);

  const renderAnalytics = useCallback(() => (
    <Box>
      <Typography variant="h5" gutterBottom>
        Energy Usage Analytics
      </Typography>
      <Grid container spacing={3}>
        {circuitBreakers.map(breaker => {
          const currentData = generateCurrentData(breaker);
          return (
            <Grid item xs={12} key={breaker.id}>
              <MemoizedEnergyChart
                breaker={{
                  ...breaker,
                  voltage_reading: 230,
                  currentData
                }}
          isOn={breaker.status === 'On'}
        />
            </Grid>
          );
        })}
      </Grid>
    </Box>
  ), [circuitBreakers, generateCurrentData]);

  // Handle notification bell click
  const handleBellClick = useCallback((event) => {
    setNotificationAnchorEl(event.currentTarget);
    setUnreadNotifications(0); // Reset unread count when opening
  }, []);

  // Handle notification item click
  const handleNotificationClick = useCallback((alert) => {
    setSelectedAlert(alert);
  }, []);

  // Handle redirect to circuit breaker
  const handleRedirectToBreaker = useCallback((breakerName) => {
    setTab(1); // Switch to Circuit Breakers tab
    handleHighlightBreaker(breakerName);
    handleDialogClose();
  }, [handleHighlightBreaker]);

  // Handle dialog close
  const handleDialogClose = useCallback(() => {
    setSelectedAlert(null);
  }, []);

  // Update unread notifications count when new alerts are added
  useEffect(() => {
    if (!notificationAnchorEl) {
      setUnreadNotifications(alerts.length);
    }
  }, [alerts, notificationAnchorEl]);

  // Add power limit monitoring effect
  useEffect(() => {
    const checkPowerLimits = () => {
      circuitBreakers.forEach(breaker => {
        if (breaker.status === 'On') {
          const currentData = breaker.currentData || { current: 0, voltage: 0 };
          const powerWatts = currentData.current * currentData.voltage;
          const wattLimit = parseFloat(localStorage.getItem(`wattLimit_${breaker.name}`)) || 1500;
          
          if (powerWatts > wattLimit) {
            handleAddAlert({
              message: `Power limit exceeded in ${breaker.name}`,
              breaker: breaker.name,
              type: 'warning',
              details: {
                current: `${currentData.current.toFixed(2)}A`,
                voltage: `${currentData.voltage.toFixed(2)}V`,
                power: `${powerWatts.toFixed(0)}W`,
                location: breaker.location,
                breaker: breaker.name,
                timestamp: new Date().toISOString(),
                status: 'Active',
                recommendations: [
                  'Consider load balancing',
                  'Review power usage patterns'
                ]
              }
            });
          }
        }
      });
    };

    // Check immediately and then set up interval
    checkPowerLimits();
    const interval = setInterval(checkPowerLimits, settings.refreshRate * 1000);
    return () => clearInterval(interval);
  }, [circuitBreakers, settings.refreshRate, handleAddAlert]);

  useEffect(() => {
    if (autoRefreshEnabled) {
      fetchPowerData();
      const interval = setInterval(fetchPowerData, settings.refreshRate * 1000);
      return () => clearInterval(interval);
    }
  }, [user.id, settings.refreshRate, autoRefreshEnabled]);

  if (loading && !powerData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
    </Box>
  );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
    </Box>
  );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
            <Box
              component="img"
              src={logo}
              alt="Energy Dashboard Logo"
              sx={{
                height: 40,
                width: 'auto',
                objectFit: 'contain'
              }}
            />
            <Typography variant="h6" component="div">
              CircuitSense Dashboard
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {user?.email}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip title={autoRefreshEnabled ? "Disable Auto-Refresh" : "Enable Auto-Refresh"}>
                <IconButton 
                  onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                  color={autoRefreshEnabled ? "primary" : "default"}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Manual Refresh">
                <IconButton 
                  onClick={fetchPowerData}
                  disabled={isRefreshing}
                  sx={{
                    animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' }
                    }
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Typography variant="caption" color="text.secondary">
                Last refresh: {lastRefresh.toLocaleTimeString()}
              </Typography>
            </Box>
            <Tooltip title="Notifications">
              <IconButton 
                onClick={handleBellClick}
                color={unreadNotifications > 0 ? "primary" : "default"}
              >
                <Badge badgeContent={unreadNotifications} color="error">
                  {unreadNotifications > 0 ? <NotificationsActiveIcon /> : <NotificationsIcon />}
                </Badge>
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={notificationAnchorEl}
              open={Boolean(notificationAnchorEl)}
              onClose={handleNotificationClose}
              PaperProps={{
                sx: {
                  maxHeight: 400,
                  width: 360,
                  maxWidth: '100%',
                  bgcolor: 'background.paper',
                  boxShadow: (theme) => `0 8px 24px ${alpha(theme.palette.common.black, 0.15)}`,
                  borderRadius: 2,
                  overflow: 'hidden',
                  '& .MuiList-root': {
                    maxHeight: 300,
                    overflowY: 'auto',
                    '&::-webkit-scrollbar': {
                      width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                      background: (theme) => alpha(theme.palette.primary.main, 0.1),
                      borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: (theme) => alpha(theme.palette.primary.main, 0.3),
                      borderRadius: '4px',
                      '&:hover': {
                        background: (theme) => alpha(theme.palette.primary.main, 0.5),
                      },
                    },
                  }
                }
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <Box sx={{ 
                p: 2, 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                borderBottom: 1,
                borderColor: 'divider',
                bgcolor: 'background.paper',
                position: 'sticky',
                top: 0,
                zIndex: 1
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <NotificationsIcon color="primary" />
                  <Typography variant="h6">Notifications</Typography>
                </Box>
                {alerts.length > 0 && (
                  <Button
                    size="small"
                    variant="text"
                    color="primary"
                    onClick={handleClearAllAlerts}
                    sx={{
                      textTransform: 'none',
                      '&:hover': {
                        bgcolor: 'action.hover'
                      }
                    }}
                  >
                    Clear All
                  </Button>
                )}
              </Box>
              {alerts.length === 0 ? (
                <Box sx={{ 
                  p: 4, 
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <NotificationsIcon sx={{ color: 'text.secondary', fontSize: 40 }} />
                  <Typography color="text.secondary">No notifications</Typography>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {alerts.map((alert) => (
                    <React.Fragment key={alert.id}>
                      <ListItem
                        button
                        onClick={() => handleNotificationClick(alert)}
                        sx={{
                          py: 1.5,
                          px: 2,
                          '&:hover': {
                            bgcolor: 'action.hover'
                          },
                          transition: 'background-color 0.2s'
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: (theme) => alpha(theme.palette.warning.main, 0.1)
                            }}
                          >
                            <WarningIcon color="warning" sx={{ fontSize: 20 }} />
                          </Box>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                              {alert.message}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  color: 'text.secondary',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5
                                }}
                              >
                                <PowerIcon sx={{ fontSize: 14 }} />
                                {alert.breaker}
                              </Typography>
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  color: 'text.secondary',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5
                                }}
                              >
                                <TimerIcon sx={{ fontSize: 14 }} />
                                {alert.time}
                              </Typography>
                            </Box>
                          }
                        />
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCloseAlert(alert.id);
                          }}
                          sx={{
                            color: 'text.secondary',
                            '&:hover': {
                              color: 'error.main',
                              bgcolor: (theme) => alpha(theme.palette.error.main, 0.1)
                            },
                            transition: 'all 0.2s'
                          }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </ListItem>
                      <Divider sx={{ my: 0 }} />
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Menu>
            <Tooltip title="Settings">
              <IconButton onClick={() => setShowSettings(true)}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>
    <Box sx={{ width: '100%', p: 3 }}>
      <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Dashboard" />
        <Tab label="Circuit Breakers" />
        <Tab label="Analytics" />
      </Tabs>

      <Box>
          {tab === 0 && renderDashboard()}
        {tab === 1 && renderCircuitBreakers()}
        {tab === 2 && renderAnalytics()}
        </Box>

        <Dialog
          open={showSettings}
          onClose={() => setShowSettings(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: 'background.paper',
              color: 'text.primary'
            }
          }}
        >
          <DialogTitle sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            bgcolor: 'background.paper',
            color: 'text.primary'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6">Settings</Typography>
              <IconButton
                onClick={() => setShowSettings(false)}
                sx={{ 
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'text.primary'
                  }
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ 
            bgcolor: 'background.paper',
            color: 'text.primary'
          }}>
            <Settings />
            <Box sx={{ 
              mt: 3, 
              pt: 2, 
              borderTop: 1, 
              borderColor: 'divider',
              bgcolor: 'background.paper'
            }}>
              <Button
                fullWidth
                variant="outlined"
                color="error"
                onClick={handleLogout}
                startIcon={<LogoutIcon />}
                sx={{
                  '&:hover': {
                    bgcolor: 'error.main',
                    color: 'error.contrastText'
                  }
                }}
              >
                Logout
              </Button>
            </Box>
          </DialogContent>
        </Dialog>

        <Box sx={{ mt: 4 }}>
          <MemoizedPowerProjections />
        </Box>
      </Box>

      {/* Notification Details Dialog */}
      <Dialog
        open={Boolean(selectedAlert)}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
      >
        {selectedAlert && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningIcon color="warning" />
                <Typography variant="h6">{selectedAlert.message}</Typography>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Breaker: {selectedAlert.breaker}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Time: {selectedAlert.time}
                </Typography>
                
                {selectedAlert.details && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Details:
                    </Typography>
                    {selectedAlert.details.current && (
                      <Typography variant="body2" gutterBottom>
                        Current: {selectedAlert.details.current}
                      </Typography>
                    )}
                    {selectedAlert.details.voltage && (
                      <Typography variant="body2" gutterBottom>
                        Voltage: {selectedAlert.details.voltage}
                      </Typography>
                    )}
                    {selectedAlert.details.power && (
                      <Typography variant="body2" gutterBottom>
                        Power: {selectedAlert.details.power}
                      </Typography>
                    )}
                    
                    {selectedAlert.details.recommendations && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Recommendations:
                        </Typography>
                        <List dense>
                          {selectedAlert.details.recommendations.map((rec, index) => (
                            <ListItem key={index}>
                              <ListItemText
                                primary={rec}
                                primaryTypographyProps={{ variant: 'body2' }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            </DialogContent>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button onClick={handleDialogClose}>
                Close
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleRedirectToBreaker(selectedAlert.breaker)}
                startIcon={<PowerIcon />}
              >
                View Circuit Breaker
              </Button>
            </Box>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default memo(Dashboard);