import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';

import apiService, { setToken, getToken, initializeAuth } from '../services/api';

// Initial state
const initialState = {
  user: null,
  loading: true,
  error: null,
  isAuthenticated: false,
};

// Action types
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  SET_ERROR: 'SET_ERROR',
  LOGOUT: 'LOGOUT',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };
      
    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        loading: false,
        error: null,
      };
      
    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
      
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        loading: false,
      };
      
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
      
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const queryClient = useQueryClient();
  
  // Verify token query
  const { refetch: verifyToken } = useQuery(
    'verifyToken',
    apiService.auth.verifyToken,
    {
      enabled: false,
      retry: false,
      onSuccess: (response) => {
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: response.data.user });
      },
      onError: (error) => {
        logout();
      },
    }
  );
  
  // Initialize authentication on app start
  useEffect(() => {
    initializeAuth();
    
    // Check if user is already logged in
    const token = getToken();
    if (token) {
      // Verify token with server
      verifyToken();
    } else {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  }, [verifyToken]);
  
  // Login mutation
  const loginMutation = useMutation(apiService.auth.login, {
    onSuccess: (response) => {
      const { user, token } = response.data;
      setToken(token);
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
      queryClient.invalidateQueries();
      toast.success(`Selamat datang, ${user.full_name || user.username}!`);
    },
    onError: (error) => {
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: error.message });
      toast.error(error.message || 'Login gagal');
    },
  });
  
  // Register mutation
  const registerMutation = useMutation(apiService.auth.register, {
    onSuccess: (response) => {
      const { user, token } = response.data;
      setToken(token);
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
      queryClient.invalidateQueries();
      toast.success('Registrasi berhasil! Selamat datang!');
    },
    onError: (error) => {
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: error.message });
      toast.error(error.message || 'Registrasi gagal');
    },
  });
  
  // Logout mutation
  const logoutMutation = useMutation(apiService.auth.logout, {
    onSettled: () => {
      // Always clear local state regardless of server response
      setToken(null);
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      queryClient.clear();
      toast.success('Anda telah logout');
    },
  });
  
  // Update profile mutation
  const updateProfileMutation = useMutation(apiService.auth.updateProfile, {
    onSuccess: (response) => {
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: response.data.user });
      queryClient.invalidateQueries('profile');
      toast.success('Profil berhasil diperbarui');
    },
    onError: (error) => {
      toast.error(error.message || 'Gagal memperbarui profil');
    },
  });
  
  // Change password mutation
  const changePasswordMutation = useMutation(apiService.auth.changePassword, {
    onSuccess: () => {
      toast.success('Password berhasil diubah');
    },
    onError: (error) => {
      toast.error(error.message || 'Gagal mengubah password');
    },
  });
  
  // Auth methods
  const login = async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
    return loginMutation.mutateAsync(credentials);
  };
  
  const register = async (userData) => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
    return registerMutation.mutateAsync(userData);
  };
  
  const logout = () => {
    logoutMutation.mutate();
  };
  
  const updateProfile = async (profileData) => {
    return updateProfileMutation.mutateAsync(profileData);
  };
  
  const changePassword = async (passwordData) => {
    return changePasswordMutation.mutateAsync(passwordData);
  };
  
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };
  
  // Check if user has specific role
  const hasRole = (role) => {
    return state.user?.role === role;
  };
  
  // Check if user has any of the specified roles
  const hasAnyRole = (roles) => {
    return roles.includes(state.user?.role);
  };
  
  // Check if user is admin
  const isAdmin = () => {
    return hasRole('admin');
  };
  
  // Get user initials for avatar
  const getUserInitials = () => {
    if (!state.user) return '';
    
    const name = state.user.full_name || state.user.username || '';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  // Get user display name
  const getUserDisplayName = () => {
    if (!state.user) return '';
    return state.user.full_name || state.user.username || '';
  };
  
  // Context value
  const value = {
    // State
    ...state,
    
    // Actions
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    clearError,
    
    // Utilities
    hasRole,
    hasAnyRole,
    isAdmin,
    getUserInitials,
    getUserDisplayName,
    
    // Loading states
    isLoggingIn: loginMutation.isLoading,
    isRegistering: registerMutation.isLoading,
    isLoggingOut: logoutMutation.isLoading,
    isUpdatingProfile: updateProfileMutation.isLoading,
    isChangingPassword: changePasswordMutation.isLoading,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// HOC for components that require authentication
export const withAuth = (Component, options = {}) => {
  const { requireAdmin = false } = options;
  
  return function AuthenticatedComponent(props) {
    const { user, loading, isAdmin } = useAuth();
    
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      );
    }
    
    if (!user) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Authentication Required
            </h2>
            <p className="text-gray-600 mb-6">
              You need to be logged in to access this page.
            </p>
            <button
              onClick={() => window.location.href = '/login'}
              className="btn-primary"
            >
              Go to Login
            </button>
          </div>
        </div>
      );
    }
    
    if (requireAdmin && !isAdmin()) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Access Denied
            </h2>
            <p className="text-gray-600 mb-6">
              You don't have permission to access this page.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="btn-primary"
            >
              Go to Home
            </button>
          </div>
        </div>
      );
    }
    
    return <Component {...props} />;
  };
};

export default AuthContext;
