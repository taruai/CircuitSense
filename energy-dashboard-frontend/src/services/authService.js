const API_URL = 'http://localhost/energy-dashboard-backend';

export const authService = {
    async register(userData) {
        try {
            const response = await fetch(`${API_URL}/register.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }
            return data;
        } catch (error) {
            throw error;
        }
    },

    async login(credentials) {
        try {
            const response = await fetch(`${API_URL}/login.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }
            return data;
        } catch (error) {
            throw error;
        }
    },

    async resetPassword(passwordData) {
        try {
            const response = await fetch(`${API_URL}/reset_password.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(passwordData),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Password reset failed');
            }
            return data;
        } catch (error) {
            throw error;
        }
    },

    async deleteAccount(userData) {
        try {
            const response = await fetch(`${API_URL}/delete_account.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Account deletion failed');
            }
            return data;
        } catch (error) {
            throw error;
        }
    }
}; 