const API_URL = 'http://localhost/energy-dashboard-backend';

export const powerService = {
    async testConnection() {
        try {
            console.log('Testing connection to:', `${API_URL}/test_connection.php`);
            const response = await fetch(`${API_URL}/test_connection.php`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                }
            });
            
            console.log('Connection test response status:', response.status);
            const data = await response.json();
            console.log('Connection test response:', data);
            
            if (!response.ok) {
                throw new Error(data.message || 'Connection test failed');
            }
            return data;
        } catch (error) {
            console.error('Connection test error:', error);
            throw new Error(`Backend connection failed: ${error.message}`);
        }
    },

    async getPowerProjections(userId) {
        console.log('Fetching power projections for user:', userId);
        try {
            const response = await fetch(`${API_URL}/get_power_projections.php?user_id=${userId}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.status === 'error') {
                throw new Error(data.message || 'Failed to fetch power projections');
            }

            return data.data;
        } catch (error) {
            console.error('Power projections error:', error);
            throw error;
        }
    },

    async storePowerData(powerData) {
        try {
            console.log('Storing power data:', powerData);
            const response = await fetch(`${API_URL}/store_power_data.php`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(powerData),
            });

            console.log('Store power data response status:', response.status);
            const data = await response.json();
            console.log('Store power data response:', data);

            if (!response.ok) {
                throw new Error(data.message || 'Failed to store power data');
            }
            return data;
        } catch (error) {
            console.error('Store power data error:', error);
            throw new Error(`Failed to store power data: ${error.message}`);
        }
    },

    async getPowerData(userId, options = {}) {
        try {
            const { breakerId, startDate, endDate } = options;
            const params = new URLSearchParams({
                user_id: userId,
                ...(breakerId && { breaker_id: breakerId }),
                ...(startDate && { start_date: startDate }),
                ...(endDate && { end_date: endDate }),
            });

            console.log('Fetching power data with params:', params.toString());
            const url = `${API_URL}/get_power_data.php?${params}`;
            console.log('Request URL:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                }
            });
            
            console.log('Get power data response status:', response.status);
            const data = await response.json();
            console.log('Get power data response:', data);

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch power data');
            }
            return data;
        } catch (error) {
            console.error('Get power data error:', error);
            throw new Error(`Failed to fetch power data: ${error.message}`);
        }
    },

    calculateCost(kwh, rate) {
        return kwh * rate;
    },

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    },

    formatKWH(kwh) {
        return new Intl.NumberFormat('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(kwh);
    }
}; 