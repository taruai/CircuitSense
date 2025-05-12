import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider,
    Switch,
    FormControlLabel,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Stack,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert
} from '@mui/material';
import {
    Settings as SettingsIcon,
    Palette as PaletteIcon,
    Notifications as NotificationsIcon,
    Delete as DeleteIcon,
    Warning as WarningIcon,
    Bolt as BoltIcon
} from '@mui/icons-material';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const Settings = () => {
    const { settings, updateSettings } = useSettings();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteError, setDeleteError] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSettingChange = (setting, value) => {
        const newSettings = { ...settings, [setting]: value };
        updateSettings(newSettings);
    };

    const handleDeleteAccount = async () => {
        if (!deletePassword) {
            setDeleteError('Please enter your password to confirm deletion');
            return;
        }

        setIsDeleting(true);
        setDeleteError('');

        try {
            await authService.deleteAccount({
                email: user.email,
                password: deletePassword
            });
            
            logout();
            navigate('/login');
        } catch (err) {
            setDeleteError(err.message || 'Failed to delete account. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Stack spacing={3}>
            {/* Display Settings */}
            <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                    <PaletteIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Display Settings
                </Typography>
                <List>
                    <ListItem>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.darkMode}
                                    onChange={(e) => handleSettingChange('darkMode', e.target.checked)}
                                />
                            }
                            label="Dark Mode"
                        />
                    </ListItem>
                    <ListItem>
                        <FormControl fullWidth>
                            <InputLabel>Theme Style</InputLabel>
                            <Select
                                value={settings.themeStyle}
                                label="Theme Style"
                                onChange={(e) => handleSettingChange('themeStyle', e.target.value)}
                            >
                                <MenuItem value="default">Default</MenuItem>
                                <MenuItem value="modern">Modern</MenuItem>
                                <MenuItem value="minimal">Minimal</MenuItem>
                            </Select>
                        </FormControl>
                    </ListItem>
                </List>
            </Paper>

            {/* Energy Cost Settings */}
            <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                    <BoltIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Energy Cost Settings
                </Typography>
                <List>
                    <ListItem>
                        <TextField
                            label="kWh Rate (₱)"
                            type="number"
                            value={settings.kwhRate || 12.0}
                            onChange={(e) => handleSettingChange('kwhRate', parseFloat(e.target.value))}
                            inputProps={{ 
                                min: 0,
                                step: 0.01,
                                max: 100
                            }}
                            fullWidth
                            helperText="Enter your electricity rate per kWh"
                        />
                    </ListItem>
                </List>
            </Paper>

            {/* Chart Settings */}
            <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                    Chart Settings
                </Typography>
                <List>
                    <ListItem>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.showVoltage}
                                    onChange={(e) => handleSettingChange('showVoltage', e.target.checked)}
                                />
                            }
                            label="Show Voltage"
                        />
                    </ListItem>
                    <ListItem>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.showCurrent}
                                    onChange={(e) => handleSettingChange('showCurrent', e.target.checked)}
                                />
                            }
                            label="Show Current"
                        />
                    </ListItem>
                    <ListItem>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.showPower}
                                    onChange={(e) => handleSettingChange('showPower', e.target.checked)}
                                />
                            }
                            label="Show Power"
                        />
                    </ListItem>
                    <ListItem>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.showCost}
                                    onChange={(e) => handleSettingChange('showCost', e.target.checked)}
                                />
                            }
                            label="Show Cost"
                        />
                    </ListItem>
                    <ListItem>
                        <TextField
                            label="Data Refresh Rate (seconds)"
                            type="number"
                            value={settings.refreshRate}
                            onChange={(e) => handleSettingChange('refreshRate', parseInt(e.target.value))}
                            inputProps={{ min: 1, max: 60 }}
                            fullWidth
                        />
                    </ListItem>
                </List>
            </Paper>

            {/* Notification Settings */}
            <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                    <NotificationsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Notification Settings
                </Typography>
                <List>
                    <ListItem>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.notifications}
                                    onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                                />
                            }
                            label="Enable Notifications"
                        />
                    </ListItem>
                </List>
            </Paper>

            {/* Account Settings */}
            <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom color="error">
                    <DeleteIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Danger Zone
                </Typography>
                <List>
                    <ListItem>
                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => setShowDeleteDialog(true)}
                            fullWidth
                        >
                            Delete Account
                        </Button>
                    </ListItem>
                </List>
            </Paper>

            {/* Delete Account Dialog */}
            <Dialog
                open={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Box display="flex" alignItems="center" gap={1}>
                        <WarningIcon color="error" />
                        Delete Account
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        This action cannot be undone. All your data will be permanently deleted.
                    </Alert>
                    <Typography variant="body1" gutterBottom>
                        To confirm account deletion, please enter your password:
                    </Typography>
                    <TextField
                        fullWidth
                        type="password"
                        label="Password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        error={!!deleteError}
                        helperText={deleteError}
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowDeleteDialog(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDeleteAccount}
                        color="error"
                        variant="contained"
                        disabled={isDeleting}
                    >
                        {isDeleting ? 'Deleting...' : 'Delete Account'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Stack>
    );
};

export default Settings; 