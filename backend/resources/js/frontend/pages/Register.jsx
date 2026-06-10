import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import './Auth.css';

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('buyer');
  const [brandName, setBrandName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(name, email, phone, password, role, role === 'seller' ? brandName : '');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container flex-center">
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
            label="Phone Number"
            type="tel"
            placeholder="Enter phone number (e.g. +1234567890)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
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
  );
};
export default Register;
