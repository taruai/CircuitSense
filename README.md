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
- React.js
- Material-UI (MUI)
- React Router
- Context API for State Management
- Axios for API calls

### Backend
- Node.js
- Express.js
- MySQL (XAMPP)
- JWT Authentication

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- XAMPP (for MySQL database)
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

3. Install Backend Dependencies
```bash
cd ../energy-dashboard-backend
npm install
```

4. Set up Database
   - Start XAMPP Control Panel
   - Start Apache and MySQL services
   - Import the database schema from `database/schema.sql`

5. Set up Environment Variables
   - Create `.env` file in the backend directory
   - Add necessary environment variables:
     ```
     DB_HOST=localhost
     DB_USER=root
     DB_PASSWORD=
     DB_NAME=circuit_sense
     PORT=5000
     JWT_SECRET=your_jwt_secret
     ```

6. Start the Development Servers

Frontend:
```bash
cd energy-dashboard-frontend
npm start
```

Backend:
```bash
cd energy-dashboard-backend
npm run dev
```

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
│   └── package.json
│
└── energy-dashboard-backend/
    ├── src/
    │   ├── controllers/
    │   ├── models/
    │   ├── routes/
    │   └── ...
    ├── database/
    │   └── schema.sql
    └── package.json
```


## Contact

Kent Alexis T Alia - [@your_twitter](https://twitter.com/your_twitter)

Project Link: [https://github.com/taruai/CircuitSense](https://github.com/taruai/CircuitSense)
