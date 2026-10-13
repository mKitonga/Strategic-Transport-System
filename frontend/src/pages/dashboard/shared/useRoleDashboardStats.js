import { useEffect, useState } from 'react';
import { fetchRoleDashboardStats, getStoredSession } from '../../../services/transportApi';

export default function useRoleDashboardStats() {
  const { user } = getStoredSession();
  const [state, setState] = useState({ stats: null, loading: true, error: '' });

  useEffect(() => {
    let active = true;
    setState({ stats: null, loading: true, error: '' });

    fetchRoleDashboardStats(user?.role, user)
      .then((stats) => {
        if (active) setState({ stats, loading: false, error: '' });
      })
      .catch((error) => {
        if (active) setState({ stats: null, loading: false, error: error.message || 'Could not load account statistics.' });
      });

    return () => { active = false; };
  }, [user?.id, user?.role]);

  return state;
}
