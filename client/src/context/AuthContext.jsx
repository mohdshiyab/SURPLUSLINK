import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [actor, setActor] = useState(null);
  const [demoPeople, setDemoPeople] = useState({ donors: [], volunteers: [] });
  const [loading, setLoading] = useState(true);

  const fetchDemoPeople = useCallback(async () => {
    try {
      const res = await api.get('/api/demo/people');
      if (res && res.success) {
        setDemoPeople({ donors: res.donors, volunteers: res.volunteers });
      }
    } catch (err) {
      console.error('[Fetch Demo People Error]', err);
    }
  }, []);

  const refreshActor = useCallback(async () => {
    try {
      const res = await api.get('/api/session/me');
      if (res && res.actor) {
        setActor(res.actor);
      } else {
        // Fallback default demo persona (D1) if not set yet, so app is immediately interactive!
        const savedDemo = localStorage.getItem('surpluslink_demo_id');
        if (!savedDemo && !localStorage.getItem('surpluslink_token')) {
          localStorage.setItem('surpluslink_demo_id', 'D1');
          const dRes = await api.post('/api/demo/act-as', { personId: 'D1' });
          if (dRes && dRes.actor) setActor(dRes.actor);
        } else if (savedDemo) {
          const dRes = await api.post('/api/demo/act-as', { personId: savedDemo });
          if (dRes && dRes.actor) setActor(dRes.actor);
        } else {
          setActor(null);
        }
      }
    } catch (err) {
      console.error('[Refresh Actor Error]', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDemoPeople();
    refreshActor();
  }, [fetchDemoPeople, refreshActor]);

  const actAs = async (personId) => {
    localStorage.removeItem('surpluslink_token');
    localStorage.setItem('surpluslink_demo_id', personId);
    const res = await api.post('/api/demo/act-as', { personId });
    if (res && res.actor) {
      setActor(res.actor);
    }
    return res;
  };

  const login = async (email, password) => {
    localStorage.removeItem('surpluslink_demo_id');
    const res = await api.post('/api/auth/login', { email, password });
    if (res && res.token) {
      localStorage.setItem('surpluslink_token', res.token);
      await refreshActor();
    }
    return res;
  };

  const register = async (formData) => {
    localStorage.removeItem('surpluslink_demo_id');
    const res = await api.post('/api/auth/register', formData);
    if (res && res.token) {
      localStorage.setItem('surpluslink_token', res.token);
      await refreshActor();
    }
    return res;
  };

  const logout = () => {
    localStorage.removeItem('surpluslink_token');
    localStorage.removeItem('surpluslink_demo_id');
    setActor(null);
  };

  return (
    <AuthContext.Provider
      value={{
        actor,
        demoPeople,
        loading,
        actAs,
        login,
        register,
        logout,
        refreshActor
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
