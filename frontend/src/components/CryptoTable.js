import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import './CryptoTable.css';

const socket = io('http://localhost:5000'); // Backend URL
const SUPPORTED_CURRENCIES = ['usd', 'eur', 'gbp', 'inr']; // Supported currencies

const CryptoTable = () => {
  const [cryptos, setCryptos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState('usd'); // Default currency
  const [targetCoin, setTargetCoin] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [userTargets, setUserTargets] = useState([]); // User's target list
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    // Fetch initial data and listen to price updates
    const fetchPrices = () => {
      socket.emit('get_prices', { currency });
    };

    const fetchTargets = () => {
      socket.emit('get_targets'); // Request the user's targets
    };

    fetchPrices();
    fetchTargets();

    socket.on('price_update', (data) => {
      setCryptos(data);
      setLoading(false);
      console.log(data);
    });

    socket.on('user_targets', (targets) => {
      setUserTargets(targets); // Update the targets list
    });

    socket.on('target_reached', (data) => {
      // Show the alert when target price is reached
      setAlertMessage(`Alert: The price of ${data.coinId} has reached your target of $${data.targetPrice}. Current price: $${data.currentPrice}`);
      alert(`Target reached for ${data.coinId}!`);
    });

    return () => {
      socket.off('price_update');
      socket.off('user_targets');
      socket.off('target_reached'); // Unsubscribe from the event when the component unmounts
    };
  }, [currency]);

  const handleCurrencyChange = (event) => {
    setCurrency(event.target.value);
    socket.emit('change_currency', event.target.value); // Notify the backend to change currency
  };

  const handleSetTarget = () => {
    if (targetCoin && targetPrice) {
      // Emit the add_target event to the server with target details
      const newTarget = { coinId: targetCoin, targetPrice: parseFloat(targetPrice) };

      // Emit the add_target event to the server
      socket.emit('add_target', newTarget);
  
      // Optimistically update the local state for immediate UI feedback
      setUserTargets((prevTargets) => [...prevTargets, newTarget]);
  
      alert(`Target set for ${targetCoin} at $${targetPrice}`);
      setTargetCoin('');
      setTargetPrice('');
  
      // Fetch the updated targets
      socket.emit('get_targets');
    } else {
      alert('Please select a coin and enter a valid target price.');
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Real-Time Cryptocurrency Prices</h1>
      
      {alertMessage && <div style={styles.alert}>{alertMessage}</div>}

      {/* Currency Selector */}
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="currency" style={{ marginRight: '10px', fontSize: '18px' }}>
          Select Currency:
        </label>
        <select
          id="currency"
          value={currency}
          onChange={handleCurrencyChange}
          style={styles.select}
        >
          {SUPPORTED_CURRENCIES.map((curr) => (
            <option key={curr} value={curr}>
              {curr.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {/* Set Target Price */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Enter Coin ID (e.g., bitcoin)"
          value={targetCoin}
          onChange={(e) => setTargetCoin(e.target.value)}
          style={styles.input}
        />
        <input
          type="number"
          placeholder="Enter Target Price"
          value={targetPrice}
          onChange={(e) => setTargetPrice(e.target.value)}
          style={styles.input}
        />
        <button onClick={handleSetTarget} style={styles.button}>
          Set Target
        </button>
      </div>

      {/* User Targets */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={styles.subHeader}>Your Targets</h2>
        {userTargets.length > 0 ? (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.cell}>Cryptocurrency</th>
                <th style={styles.cell}>Target Price</th>
              </tr>
            </thead>
            <tbody>
              {userTargets.map((target, index) => (
                <tr key={index}>
                  <td style={styles.cell}>{target.coinId}</td>
                  <td style={styles.cell}>${target.targetPrice}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>You have not set any targets yet.</p>
        )}
      </div>

      {/* Crypto Prices Table */}
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.cell}>Image</th>
            <th style={styles.cell}>Cryptocurrency</th>
            <th style={styles.cell}>Price ({currency.toUpperCase()})</th>
            <th style={styles.cell}>24h Change</th>
            <th style={styles.cell}>Market Cap</th>
            <th style={styles.cell}>24h Volume</th>
          </tr>
        </thead>
        <tbody>
          {cryptos.map((crypto) => (
            <tr key={crypto.id}>
              <td style={styles.cell}>
                <img src={crypto.image} alt={crypto.name} style={styles.coinImage} />
              </td>
              <td style={styles.cell}>{crypto.name}</td>
              <td style={styles.cell}>${crypto.current_price}</td>
              <td style={styles.cell}>
                {crypto.price_change_percentage_24h ? (
                  <span style={{ color: crypto.price_change_percentage_24h < 0 ? 'red' : 'green' }}>
                    {crypto.price_change_percentage_24h.toFixed(2)}%
                  </span>
                ) : (
                  '-'
                )}
              </td>
              <td style={styles.cell}>${crypto.market_cap}</td>
              <td style={styles.cell}>${crypto.total_volume}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const styles = {
  container: {
    textAlign: 'center',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
  },
  alert: {
    backgroundColor: '#ffcc00',
    color: '#333',
    padding: '10px',
    marginBottom: '20px',
    fontWeight: 'bold',
  },
  header: {
    fontSize: '24px',
    marginBottom: '20px',
  },
  subHeader: {
    fontSize: '20px',
    marginBottom: '10px',
  },
  select: {
    fontSize: '16px',
    padding: '5px',
  },
  input: {
    margin: '5px',
    padding: '5px',
    fontSize: '14px',
  },
  button: {
    padding: '8px 12px',
    fontSize: '16px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  table: {
    margin: '0 auto',
    borderCollapse: 'collapse',
    width: '80%',
  },
  cell: {
    border: '1px solid #ddd',
    padding: '8px',
  },
  coinImage: {
    width: '30px',
    height: '30px',
  },
};

export default CryptoTable;
