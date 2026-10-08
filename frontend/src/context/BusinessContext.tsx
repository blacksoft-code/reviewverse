'use client';

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { useAuth } from '@/context/AuthContext';

export type ActiveBusiness = {
  id: string;
  name: string;
  logo: string | null;
};

type BusinessContextValue = {
  activeBusiness: ActiveBusiness | null;
  setActiveBusiness: (
    business: ActiveBusiness | null,
  ) => void;
};

const BusinessContext = createContext<
  BusinessContextValue | undefined
>(undefined);

// Entity mode "sticky" — একবার business হিসেবে ঢুকলে page
// বদলালে বা hard reload (notification click) করলেও বদলাবে না।
// শুধু "Switch back" চাপলে বা logout করলে বের হবে।
// কোন user-এর জন্য সেভ হয়েছে সেটাও রাখা হয়, যাতে অন্য user
// একই browser-এ লগইন করলে আগের user-এর business না দেখায়।
const STORAGE_KEY = 'active_business';

type StoredBusiness = {
  userId: string;
  business: ActiveBusiness;
};

export function BusinessProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { user, loading } = useAuth();

  const [activeBusiness, setActiveBusinessState] =
    useState<ActiveBusiness | null>(null);

  // Auth ready হলে saved business ফিরিয়ে আনা / logout হলে মুছে ফেলা
  useEffect(() => {
    if (loading) return;

    if (!user) {
      localStorage.removeItem(STORAGE_KEY);
      setActiveBusinessState(null);
      return;
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const saved = JSON.parse(raw) as StoredBusiness;

      if (saved.userId === user.id && saved.business?.id) {
        setActiveBusinessState(saved.business);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [loading, user]);

  const setActiveBusiness = useCallback(
    (business: ActiveBusiness | null) => {
      setActiveBusinessState(business);

      try {
        if (business && user) {
          const stored: StoredBusiness = {
            userId: user.id,
            business,
          };
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(stored),
          );
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        // storage না পেলেও in-memory state কাজ করবে
      }
    },
    [user],
  );

  return (
    <BusinessContext.Provider
      value={{ activeBusiness, setActiveBusiness }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusinessContext() {
  const ctx = useContext(BusinessContext);

  if (!ctx) {
    throw new Error(
      'useBusinessContext must be used within BusinessProvider',
    );
  }

  return ctx;
}
