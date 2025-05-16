
"use client";

import { useState, useEffect, useCallback } from 'react';
import { getGoodWalletsServerAction } from '@/actions/wallet-actions';

export function useGoodWallets() {
  const [goodWallets, setGoodWallets] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadGoodWallets = async () => {
      setIsLoaded(false);
      try {
        const serverGoodWallets = await getGoodWalletsServerAction();
        setGoodWallets(serverGoodWallets);
      } catch (error) {
        console.error("Failed to load good wallets from server:", error);
        setGoodWallets([]); // Fallback to empty list on error
      }
      setIsLoaded(true);
    };
    loadGoodWallets();
  }, []);

  const isGoodWallet = useCallback((address: string): boolean => {
    if (!address) return false;
    const normalizedAddress = address.trim().toLowerCase();
    return goodWallets.map(w => w.toLowerCase()).includes(normalizedAddress);
  }, [goodWallets]);

  return { goodWallets, isGoodWallet, isLoaded };
}
