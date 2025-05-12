import axios from 'axios';

const API_BASE_URL = 'http://localhost/energy-dashboard/api/endpoints';

export const fetchHourlyAverages = async () => {
    try {
        console.log('Fetching data from:', `${API_BASE_URL}/readings.php?action=get_hourly_averages`);
        const response = await axios.get(`${API_BASE_URL}/readings.php?action=get_hourly_averages`);
        console.log('Response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        throw error;
    }
};

export const fetchCircuitBreakerStatus = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/readings.php?action=get_status`);
        return response.data;
    } catch (error) {
        console.error('Error fetching circuit breaker status:', error);
        throw error;
    }
};