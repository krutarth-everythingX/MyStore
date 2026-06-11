import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import './Auth.css';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loggedUser = await login(email, password);
      showToast(`Welcome back, ${loggedUser?.name || 'User'}!`, 'success');
    } catch (err) {
      setError(err.message || 'Failed to login');
      showToast(err.message || 'Failed to login', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-shell">
        <div className="auth-brand-block">
          <Link href="/" className="auth-brand-mark">MyStore</Link>
          <span className="auth-brand-kicker label-md">Buyer access</span>
          <h1 className="auth-page-title headline-md">Welcome back</h1>
          <p className="auth-page-copy body-md">
            Sign in to continue shopping, manage your account, and track your latest orders.
          </p>
        </div>

        <Card className="auth-card" title="Login to MyStore">
          {error && <div className="auth-alert auth-alert-error body-md">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <Input
              label="Email Address"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <div className="auth-footer body-md">
            Don't have an account? <Link href="/register" className="auth-link">Register here</Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
export default Login;
