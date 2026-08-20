'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext(null);

export function UserProvider({ children, initialUser, initialWallet, initialPeople }) {
  const [user, setUser] = useState(initialUser);
  const [wallet, setWallet] = useState(initialWallet);
  const [people, setPeople] = useState(initialPeople || []);

  useEffect(() => {
    // If we wanted to periodically refresh the wallet or user data in the background,
    // we could do it here. For now, we rely on initial server props and local state updates.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (initialUser !== undefined) setUser(initialUser);
    if (initialWallet !== undefined) setWallet(initialWallet);
    if (initialPeople !== undefined) setPeople(initialPeople);
  }, [initialUser, initialWallet, initialPeople]);

  return (
    <UserContext.Provider value={{ user, setUser, wallet, setWallet, people, setPeople }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
}
