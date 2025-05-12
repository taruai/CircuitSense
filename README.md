# CircuitSense - Energy Dashboard

CircuitSense is a modern web application for monitoring and managing energy consumption. It provides real-time insights into energy usage patterns and helps users make informed decisions about their energy consumption.

## Features

- 🔐 Secure Authentication System
- 📊 Real-time Energy Monitoring
- 📱 Responsive Dashboard Interface
- 🔄 Real-time Data Updates
- 📈 Energy Usage Analytics
- 🔍 Detailed Energy Consumption Reports

## Tech Stack

### Frontend
- React.js (v19.1.0)
- Material-UI (MUI v7.1.0)
- React Router (v7.5.3)
- Chart.js & Recharts for Data Visualization
- Axios for API calls

### Backend
- PHP
- MySQL (XAMPP)
- RESTful API Architecture
- JWT Authentication

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)
- XAMPP (for PHP and MySQL)
- Git

### Installation

1. Clone the repository
```bash
git clone https://github.com/taruai/CircuitSense.git
cd CircuitSense
```

2. Install Frontend Dependencies
```bash
cd energy-dashboard-frontend
npm install
```

3. Set up Backend
   - Place the backend files in your XAMPP's htdocs directory
   - Start XAMPP Control Panel
   - Start Apache and MySQL services
   - Import the database schema from `setup.sql`

4. Set up Environment Variables
   - Configure database connection in `config.php`:
     ```php
     define('DB_HOST', 'localhost');
     define('DB_USER', 'root');
     define('DB_PASSWORD', '');
     define('DB_NAME', 'circuit_sense');
     ```

5. Start the Development Servers

Frontend:
```bash
cd energy-dashboard-frontend
npm start
```
The frontend will be available at http://localhost:3000

Backend:
- Access through XAMPP: http://localhost/energy-dashboard-backend

## Project Structure

```
CircuitSense/
├── energy-dashboard-frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── services/
│   │   └── ...
│   ├── public/
│   ├── package.json
│   └── .gitignore
│
└── energy-dashboard-backend/
    ├── alerts.php
    ├── circuit_breakers.php
    ├── config.php
    ├── config_secure.php
    ├── get_power_data.php
    ├── get_power_projections.php
    ├── login.php
    ├── register.php
    ├── reset_password.php
    ├── setup.sql
    ├── setup_extended.sql
    └── store_power_data.php
```


Project Link: [https://github.com/taruai/CircuitSense](https://github.com/taruai/CircuitSense)
