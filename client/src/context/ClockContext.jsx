import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

const ClockContext = createContext();

export function ClockProvider({ children }) {
  const [simulatedNow, setSimulatedNow] = useState('2026-03-10T12:00');
  const [loading, setLoading] = useState(true);
  const [lastAdvanceResult, setLastAdvanceResult] = useState(null);

  const fetchClock = useCallback(async () => {
    try {
      const res = await api.get('/api/clock');
      if (res && res.simulatedNow) {
        setSimulatedNow(res.simulatedNow);
      }
    } catch (err) {
      console.error('[Clock Error]', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClock();
  }, [fetchClock]);

  const advanceClock = async (newTimeStr) => {
    try {
      const res = await api.patch('/api/clock', { time: newTimeStr });
      if (res && res.simulatedNow) {
        setSimulatedNow(res.simulatedNow);
        setLastAdvanceResult(res);
        return res;
      }
    } catch (err) {
      throw err;
    }
  };

  return (
    <ClockContext.Provider
      value={{
        simulatedNow,
        loading,
        fetchClock,
        advanceClock,
        lastAdvanceResult
      }}
    >
      {children}
    </ClockContext.Provider>
  );
}

export function useClock() {
  const context = useContext(ClockContext);
  if (!context) {
    throw new Error('useClock must be used within a ClockProvider');
  }
  return context;
}
