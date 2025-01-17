const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const axios = require('axios');
const cors = require('cors');
const mongoose = require('mongoose');
const { login, signup } = require('./controllers/login');
const { addTarget, getTargets } = require('./controllers/target');
const { sendEmail } = require('./controllers/mailer'); // Import the sendEmail function

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = 5000;
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/coins/markets';
const CACHE_EXPIRATION = 60000; // Cache duration in milliseconds (60 seconds)

let cachedData = [];
let lastFetchTime = 0;
let alerts = {}; // In-memory alerts storage

// MongoDB setup
const mongoURI = 'mongodb://127.0.0.1:27017/'; // Replace with your MongoDB URI
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/login', login);
app.post('/register', signup);
app.post('/addTarget', addTarget);
app.get('/getTargets', getTargets);

// Utility function to check cache validity
function isCacheValid() {
  const now = Date.now();
  return now - lastFetchTime < CACHE_EXPIRATION;
}

/** Fetch prices from CoinGecko API */
async function fetchPrices(currency) {
  try {
    if (isCacheValid()) {
      return cachedData;
    }

    const response = await axios.get(COINGECKO_API_URL, {
      params: {
        vs_currency: currency,
        order: 'market_cap_desc',
        per_page: 100,
        page: 1,
        sparkline: false,
      },
    });

    cachedData = response.data;
    lastFetchTime = Date.now();
    return cachedData;
  } catch (error) {
    console.error('Error fetching prices:', error);
    return cachedData;
  }
}

/** Broadcast prices to connected clients */
async function broadcastPrices(currency) {
  const prices = await fetchPrices(currency);
  io.emit('price_update', prices);
}

// Check if any alert target has been reached
function checkAlerts(prices) {
  for (let userId in alerts) {
    const userAlerts = alerts[userId]?.alerts || [];
    userAlerts.forEach(alert => {
      const coin = prices.find(c => c.id === alert.coinId);
      if (coin && coin.current_price >= alert.targetPrice && !alert.notified) {
        // Target is met and email not sent
        sendEmail("ramshekade08@gmail.com", 'Target Price Reached', `The price of ${alert.coinId} has reached your target of $${alert.targetPrice}. Current price: $${coin.current_price}`);
        alert.notified = true; // Mark as notified
        
        console.log(`Alert for user ${userId} sent!`);

        // Emit the alert to the frontend
        io.emit('target_reached', {
          userId: userId,
          coinId: alert.coinId,
          targetPrice: alert.targetPrice,
          currentPrice: coin.current_price
        });
      }
    });
  }
}


// Set an interval to fetch prices every 60 seconds and check alerts
setInterval(async () => {
  const prices = await fetchPrices('usd');
  checkAlerts(prices); // Check for alerts
  broadcastPrices('usd');
}, CACHE_EXPIRATION);

// Handle Socket.IO connections
io.on('connection', (socket) => {
  console.log('A user connected');

  fetchPrices('usd').then((prices) => {
    socket.emit('price_update', prices);
  });

  socket.on('change_currency', async (currency) => {
    const userId = socket.id;

    let userCurrency = alerts[userId]?.currency;
    if (!userCurrency) {
      alerts[userId] = { currency };
    } else {
      alerts[userId].currency = currency;
    }

    console.log(`User's currency changed to ${currency}`);
    const prices = await fetchPrices(currency);
    socket.emit('price_update', prices);
  });

  // Add alert for a user
  socket.on('add_target', (data) => {
    const { coinId, targetPrice } = data;
    const userId = socket.id;

    if (!alerts[userId]) {
      alerts[userId] = { alerts: [] };
    }

    // Add the alert for the user
    alerts[userId].alerts.push({
      coinId,
      targetPrice,
      
      notified: false, // To track if the user has been notified
    });

    console.log(`Alert added for user ${userId}: ${coinId} at $${targetPrice}`);
    socket.emit('alert_added', { message: `Alert added for ${coinId} at $${targetPrice}` });
  });


  // Remove alert for a user
  socket.on('remove_alert', (alertId) => {
    const userId = socket.id;
    if (alerts[userId] && alerts[userId].alerts) {
      alerts[userId].alerts = alerts[userId].alerts.filter(alert => alert.id !== alertId);
      console.log(`Alert removed for user ${userId}: `, alertId);
    }
  });

  // Retrieve alerts for the user
  socket.on('get_target', () => {
    const userId = socket.id;
    if (alerts[userId] && alerts[userId].alerts) {
      socket.emit('alerts', alerts[userId].alerts);
    } else {
      socket.emit('alerts', []);
    }
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
