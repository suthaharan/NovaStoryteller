# React Frontend

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
# or
yarn install
```

### 2. Environment Configuration

The `.env` file is already configured with:
```
REACT_APP_API_URL=http://localhost:8000/api
```

### 3. Start Development Server

```bash
npm start
# or
yarn start
```

The app will open at `http://localhost:3000`

### 4. Build for Production

```bash
npm run build
# or
yarn build
```

The build output will be in the `build/` directory, which should be copied to Django's `static/build/` directory.

## Project Structure

```
frontend/
├── public/
│   └── index.html          # HTML template
├── src/
│   ├── api/
│   │   └── axios.js        # Axios instance for API calls
│   ├── components/         # Reusable components
│   ├── pages/              # Page components
│   ├── App.js              # Main app component with React Router
│   ├── App.css             # App styles
│   ├── index.js            # Entry point
│   └── index.css           # Global styles
├── .env                    # Environment variables
└── package.json            # Dependencies and scripts
```

## Features

- React Router for navigation
- Axios for API calls with interceptors
- Environment-based API URL configuration
- Proxy configuration for development (package.json)

## API Integration

The app uses the Axios instance from `src/api/axios.js` which:
- Automatically adds authentication tokens from localStorage
- Handles 401 errors (unauthorized)
- Uses the API URL from environment variables

Example usage:
```javascript
import api from './api/axios';

// GET request
api.get('/items/')

// POST request
api.post('/items/', { name: 'New Item' })
```


