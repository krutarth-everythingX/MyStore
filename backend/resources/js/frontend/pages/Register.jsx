import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import './Auth.css';

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('buyer');
  const [brandName, setBrandName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(name, email, '', password, role, role === 'seller' ? brandName : '');
      showToast('Registration successful! A verification code has been sent to your email.', 'success');
    } catch (err) {
      setError(err.message || 'Registration failed');
      showToast(err.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-shell">
        <div className="auth-brand-block">
          <Link href="/" className="auth-brand-mark">MyStore</Link>
          <span className="auth-brand-kicker label-md">Create account</span>
          <h1 className="auth-page-title headline-md">Join the storefront</h1>
          <p className="auth-page-copy body-md">
            Create a buyer or seller account and step into a cleaner, more premium MyStore experience.
          </p>
        </div>

        <Card className="auth-card" title="Create your Account">
          {error && <div className="auth-alert auth-alert-error body-md">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <Input
              label="Full Name"
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

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
              placeholder="Enter password (min 6 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="auth-role-select-container">
              <span className="auth-role-label label-md">I want to register as a:</span>
              <div className="auth-role-options">
                <label className="auth-role-option body-md">
                  <input
                    type="radio"
                    name="role"
                    value="buyer"
                    checked={role === 'buyer'}
                    onChange={() => setRole('buyer')}
                  />
                  Buyer (to shop items)
                </label>
                <label className="auth-role-option body-md">
                  <input
                    type="radio"
                    name="role"
                    value="seller"
                    checked={role === 'seller'}
                    onChange={() => setRole('seller')}
                  />
                  Seller (to sell items)
                </label>
              </div>
            </div>

            {role === 'seller' && (
              <Input
                label="Store / Brand Name"
                type="text"
                placeholder="Enter your store name (e.g. ApexTech)"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                required={role === 'seller'}
              />
            )}

            <Button
              type="submit"
              variant="primary"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Register'}
            </Button>
          </form>

          <div className="auth-footer body-md">
            Already have an account? <Link href="/login" className="auth-link">Login here</Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
export default Register;
