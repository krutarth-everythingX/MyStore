import React, { createContext, useContext, useMemo, useState } from 'react';
import { router, usePage } from '@inertiajs/react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { props } = usePage();
  const user = props.auth?.user ?? null;
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);

    return new Promise((resolve, reject) => {
      router.post('/login', { email, password }, {
        preserveScroll: true,
        onSuccess: (page) => {
          setLoading(false);
          resolve(page.props.auth?.user ?? null);
        },
        onError: (errors) => {
          setLoading(false);
          reject(new Error(errors.email || errors.password || 'Login failed'));
        },
      });
    });
  };

  const register = async (name, email, phone, password, role, brandName) => {
    setLoading(true);

    return new Promise((resolve, reject) => {
      router.post('/register', {
        name,
        email,
        phone,
        password,
        role,
        brand_name: brandName,
      }, {
        preserveScroll: true,
        onSuccess: (page) => {
          setLoading(false);
          resolve(page.props.auth?.user ?? null);
        },
        onError: (errors) => {
          setLoading(false);
          reject(new Error(errors.email || errors.password || errors.name || 'Registration failed'));
        },
      });
    });
  };

  const logout = async () => {
    setLoading(true);

    return new Promise((resolve) => {
      router.post('/logout', {}, {
        preserveScroll: true,
        onFinish: () => {
          setLoading(false);
          resolve();
        },
      });
    });
  };

  const updateProfile = async (profileData) => {
    setLoading(true);

    return new Promise((resolve, reject) => {
      router.put('/profile', profileData, {
        preserveScroll: true,
        onSuccess: (page) => {
          setLoading(false);
          resolve(page.props.auth?.user ?? null);
        },
        onError: (errors) => {
          setLoading(false);
          reject(new Error(Object.values(errors)[0] || 'Profile update failed'));
        },
      });
    });
  };

  const verifyEmailCode = async (code) => {
    setLoading(true);

    return new Promise((resolve, reject) => {
      router.post('/verify-email', { code }, {
        preserveScroll: true,
        onSuccess: (page) => {
          setLoading(false);
          resolve(page.props.auth?.user ?? null);
        },
        onError: (errors) => {
          setLoading(false);
          reject(new Error(errors.code || 'Verification failed'));
        },
      });
    });
  };

  const resendVerificationCode = async () => {
    setLoading(true);

    return new Promise((resolve, reject) => {
      router.post('/resend-verification', {}, {
        preserveScroll: true,
        onSuccess: () => {
          setLoading(false);
          resolve({ message: 'Verification code resent successfully.' });
        },
        onError: (errors) => {
          setLoading(false);
          reject(new Error(Object.values(errors)[0] || 'Resending failed'));
        },
      });
    });
  };

  const value = useMemo(() => ({
    user,
    token: user ? 'session' : null,
    loading,
    login,
    register,
    logout,
    updateProfile,
    verifyEmailCode,
    resendVerificationCode,
  }), [loading, user]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
