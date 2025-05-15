
"use client";

import { useState, useEffect, useCallback } from 'react';
import { getWalletsServerAction, addWalletServerAction } from '@/actions/wallet-actions';

export function useRuggedWallets() {
  const [wallets, setWallets] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadWallets = async () => {
      setIsLoaded(false);
      try {
        const serverWallets = await getWalletsServerAction();
        setWallets(serverWallets);
      } catch (error) {
        console.error("Failed to load wallets from server:", error);
        setWallets([]); // Fallback to empty list on error
      }
      setIsLoaded(true);
    };
    loadWallets();
  }, []);

  const addWallet = useCallback(async (address: string): Promise<{ success: boolean; message: string }> => {
    if (!address || address.trim() === "") {
      return { success: false, message: "Address cannot be empty." };
    }
    const normalizedAddress = address.trim().toLowerCase();
    
    // Client-side check (optional, but good for UX before server call)
    if (wallets.map(w => w.toLowerCase()).includes(normalizedAddress)) {
      return { success: false, message: "Address already in the list." };
    }

    try {
      const result = await addWalletServerAction(normalizedAddress);
      if (result.success && result.updatedWallets) {
        setWallets(result.updatedWallets);
        return { success: true, message: result.message || "Address added to rugged list." };
      } else {
        return { success: false, message: result.message || "Failed to add address." };
      }
    } catch (error) {
      console.error("Error calling addWalletServerAction:", error);
      return { success: false, message: "An error occurred while adding the address." };
    }
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
