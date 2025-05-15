"use client";

import { useState, useEffect, useCallback } from 'react';

const RUGGED_WALLETS_KEY = 'ruggedWalletsList';

export function useRuggedWallets() {
  const [wallets, setWallets] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedWallets = localStorage.getItem(RUGGED_WALLETS_KEY);
      if (storedWallets) {
        setWallets(JSON.parse(storedWallets));
      }
    } catch (error) {
      console.error("Failed to load wallets from localStorage:", error);
      // Initialize with empty array if parsing fails or localStorage is unavailable
      setWallets([]);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(RUGGED_WALLETS_KEY, JSON.stringify(wallets));
      } catch (error) {
        console.error("Failed to save wallets to localStorage:", error);
      }
    }
  }, [wallets, isLoaded]);

  const addWallet = useCallback((address: string): { success: boolean; message: string } => {
    if (!address || address.trim() === "") {
      return { success: false, message: "Address cannot be empty." };
    }
    const normalizedAddress = address.trim().toLowerCase();
    if (wallets.map(w => w.toLowerCase()).includes(normalizedAddress)) {
      return { success: false, message: "Address already in the list." };
    }
    setWallets(prevWallets => [...prevWallets, normalizedAddress]);
    return { success: true, message: "Address added to rugged list." };
  }, [wallets]);

  const isWalletRugged = useCallback((address: string): boolean => {
    if (!address) return false;
    const normalizedAddress = address.trim().toLowerCase();
    return wallets.map(w => w.toLowerCase()).includes(normalizedAddress);
  }, [wallets]);

  const getWallets = useCallback((): string[] => {
    return wallets;
  }, [wallets]);

  return { wallets, addWallet, isWalletRugged, getWallets, isLoaded };
}
