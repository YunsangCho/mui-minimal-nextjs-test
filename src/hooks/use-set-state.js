'use client';

import { useCallback, useState } from 'react';

// ----------------------------------------------------------------------

export function useSetState(initialState) {
  const [state, setState] = useState(initialState);

  const updateState = useCallback((newState) => {
    setState((prevState) => ({
      ...prevState,
      ...(typeof newState === 'function' ? newState(prevState) : newState),
    }));
  }, []);

  return {
    state,
    setState: updateState,
  };
} 