import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AuthForm.css'; // Separate CSS file for styling

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    // e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/login', { email, password });
      alert('Login successful!');
      console.log(response.data); // Check what response is coming from the backend
      console.log('Navigating to /home'); // Add a log to check if this gets called
      navigate('/home'); // Navigate to the home page
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    }
  };
  

  const handleSignupNavigation = () => {
    navigate('/signup'); // Navigate to the signup page
  };

  return (
    <div className="auth-form-container">
      <h2>Login</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleLogin} className="auth-form">
        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="form-input"
          />
        </div>
        <button type="submit" className="form-button">Login</button>
      </form>
      <div className="signup-option">
        <p>Don't have an account?</p>
        <button onClick={handleSignupNavigation} className="form-button secondary">Signup</button>
      </div>
    </div>
  );
};

export default Login;