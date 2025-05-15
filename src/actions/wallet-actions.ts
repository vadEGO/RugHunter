
'use server';

import fs from 'fs/promises';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
const walletsFilePath = path.join(dataDir, 'rugged-wallets.json');

async function ensureDataFileExists(): Promise<void> {
  try {
    await fs.mkdir(dataDir, { recursive: true });
    await fs.access(walletsFilePath);
  } catch (error: any) {
    if (error.code === 'ENOENT') { // File does not exist
      await fs.writeFile(walletsFilePath, JSON.stringify([]), 'utf-8');
    } else {
      throw error; // Other errors (e.g., permissions)
    }
  }
}

export async function getWalletsServerAction(): Promise<string[]> {
  try {
    await ensureDataFileExists();
    const data = await fs.readFile(walletsFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading wallets file:", error);
    // If there's a persistent error reading (e.g. corrupted JSON), return empty and log.
    // This prevents the app from crashing but data might be temporarily unavailable.
    return []; 
  }
}

export async function addWalletServerAction(address: string): Promise<{ success: boolean; message: string; updatedWallets?: string[] }> {
  try {
    await ensureDataFileExists();
    const currentWalletsData = await fs.readFile(walletsFilePath, 'utf-8');
    let currentWallets: string[] = JSON.parse(currentWalletsData);

    const normalizedAddress = address.toLowerCase();
    if (currentWallets.map(w => w.toLowerCase()).includes(normalizedAddress)) {
      return { success: false, message: "Address already in the list.", updatedWallets: currentWallets };
    }

    currentWallets.push(normalizedAddress);
    await fs.writeFile(walletsFilePath, JSON.stringify(currentWallets, null, 2), 'utf-8');
    return { success: true, message: "Address added successfully.", updatedWallets: currentWallets };
  } catch (error) {
    console.error("Error in addWalletServerAction:", error);
    return { success: false, message: "Server error: Could not add address." };
  }
}
