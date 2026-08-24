import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, userAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const { data } = await authAPI.getMe();
      setUser(data.user);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const { data } = await authAPI.login({ username, password });
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    await userAPI.updateStatus(true);
    return data.user;
  };

  const register = async (name, username, password) => {
    const { data } = await authAPI.register({ name, username, password });
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await userAPI.updateStatus(false);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const completeOnboarding = async (formData) => {
    const { data } = await authAPI.completeOnboarding(formData);
    setUser(data.user);
    return data.user;
  };

  const updateUser = (updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      completeOnboarding,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};