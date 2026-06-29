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

  const register = async (name, email, phone, password, role) => {
    setLoading(true);

    return new Promise((resolve, reject) => {
      router.post('/register', {
        name,
        email,
        phone,
        password,
        role,
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
        onSuccess: (page) => {
          setLoading(false);
          resolve({
            message: page.props.flash?.success || 'Verification code sent successfully.',
            user: page.props.auth?.user ?? null,
          });
        },
        onError: (errors) => {
          setLoading(false);
          reject(new Error(Object.values(errors)[0] || 'Resending failed'));
        },
      });
    });
  };

  const sendPhoneVerification = async (countryCode, phone) => {
    setLoading(true);

    return new Promise((resolve, reject) => {
      router.post('/send-phone-verification', {
        country_code: countryCode,
        phone,
      }, {
        preserveScroll: true,
        onSuccess: (page) => {
          setLoading(false);
          resolve({
            message: page.props.flash?.success || 'Phone verification code sent successfully.',
            user: page.props.auth?.user ?? null,
          });
        },
        onError: (errors) => {
          setLoading(false);
          reject(new Error(Object.values(errors)[0] || 'Failed to send phone verification code'));
        },
      });
    });
  };

  const verifyPhoneCode = async (code) => {
    setLoading(true);

    return new Promise((resolve, reject) => {
      router.post('/verify-phone', { code }, {
        preserveScroll: true,
        onSuccess: (page) => {
          setLoading(false);
          resolve(page.props.auth?.user ?? null);
        },
        onError: (errors) => {
          setLoading(false);
          reject(new Error(errors.code || 'Phone verification failed'));
        },
      });
    });
  };

  const sendPasswordResetLink = async (email = null, source = 'forgot') => {
    setLoading(true);

    return new Promise((resolve, reject) => {
      router.post('/send-password-reset-link', {
        email,
        source,
      }, {
        preserveScroll: true,
        onSuccess: (page) => {
          setLoading(false);
          if (page.props.flash?.error) {
            reject(new Error(page.props.flash.error));
            return;
          }

          resolve({
            message: page.props.flash?.success || 'Password reset link sent successfully.',
          });
        },
        onError: (errors) => {
          setLoading(false);
          reject(new Error(Object.values(errors)[0] || 'Failed to send password reset link'));
        },
      });
    });
  };

  const resetPassword = async (payload) => {
    setLoading(true);

    return new Promise((resolve, reject) => {
      router.post('/reset-password', payload, {
        preserveScroll: true,
        onSuccess: (page) => {
          setLoading(false);
          resolve({
            user: page.props.auth?.user ?? null,
            message: page.props.flash?.success || 'Password changed successfully.',
          });
        },
        onError: (errors) => {
          setLoading(false);
          reject(new Error(Object.values(errors)[0] || 'Failed to reset password'));
        },
      });
    });
  };

  const requestAccountDeletion = async () => {
    setLoading(true);

    return new Promise((resolve, reject) => {
      router.post('/account/delete-request', {}, {
        preserveScroll: true,
        onSuccess: (page) => {
          setLoading(false);

          if (page.props.flash?.error) {
            reject(new Error(page.props.flash.error));
            return;
          }

          resolve({
            message: page.props.flash?.success || 'Account deletion has been scheduled.',
          });
        },
        onError: (errors) => {
          setLoading(false);
          reject(new Error(Object.values(errors)[0] || 'Failed to schedule account deletion'));
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
    sendPhoneVerification,
    verifyPhoneCode,
    sendPasswordResetLink,
    resetPassword,
    requestAccountDeletion,
  }), [loading, user]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
