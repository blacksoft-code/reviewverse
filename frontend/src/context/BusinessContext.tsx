'use client';

import {
  createContext,
  ReactNode,
  useContext,
  useState,
} from 'react';

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

export function BusinessProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [activeBusiness, setActiveBusiness] =
    useState<ActiveBusiness | null>(null);

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