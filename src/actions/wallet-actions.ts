
'use server';

import fs from 'fs/promises';
import path from 'path';

// Define paths relative to the project root.
// On Vercel, process.cwd() should be the root of the serverless function,
// where project files are copied.
const dataDir = path.join(process.cwd(), 'data');
const walletsFilePath = path.join(dataDir, 'rugged-wallets.json');

export async function getWalletsServerAction(): Promise<string[]> {
  try {
    const data = await fs.readFile(walletsFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.warn(
        `Wallets data file ('${walletsFilePath}') not found. ` +
        `This might happen if the file was not included in the deployment bundle. ` +
        `Returning an empty list. ` +
        `Ensure 'data/rugged-wallets.json' is committed to your repository (e.g., with '[]' as initial content). ` +
        `For persistent storage on Vercel, consider a database solution.`
      );
      return []; // File not found, critical to return empty for app to function.
    }
    console.error("Error reading wallets file:", error, `Path used: ${walletsFilePath}`);
    // For other errors (e.g., corrupted JSON, permissions if file exists but unreadable), return empty.
    return [];
  }
}

export async function addWalletServerAction(address: string): Promise<{ success: boolean; message: string; updatedWallets?: string[] }> {
  let currentWallets: string[] = [];
  try {
    // Try to read existing wallets. If file doesn't exist, currentWallets remains [].
    const data = await fs.readFile(walletsFilePath, 'utf-8');
    currentWallets = JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, we'll be attempting to create it.
      console.log(`Wallets file ('${walletsFilePath}') not found. Will attempt to create a new one.`);
    } else {
      // Other read errors (e.g., corrupted JSON)
      console.error("Error reading existing wallets file before adding:", error, `Path used: ${walletsFilePath}`);
      return { success: false, message: "Server error: Could not read existing wallet data." };
    }
  }

  const normalizedAddress = address.toLowerCase();
  if (currentWallets.map(w => w.toLowerCase()).includes(normalizedAddress)) {
    return { success: false, message: "Address already in the list.", updatedWallets: currentWallets };
  }

  currentWallets.push(normalizedAddress);

  try {
    // Ensure directory exists before writing. This is mainly for local dev; on Vercel,
    // if 'data' dir wasn't in bundle, this might fail or be irrelevant if writeFile fails.
    // If 'data/rugged-wallets.json' was committed, 'data' dir would exist.
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(walletsFilePath, JSON.stringify(currentWallets, null, 2), 'utf-8');
    
    const isOnVercel = !!process.env.VERCEL;
    const successMessage = isOnVercel
      ? "Address added. Note: File-based storage on Vercel is ephemeral. Changes may not persist reliably across requests or deployments. A database (e.g., Vercel KV, Postgres) is recommended for production data."
      : "Address added successfully.";
    
    console.log(successMessage); // Log for server-side confirmation
    return { success: true, message: successMessage, updatedWallets: currentWallets };

  } catch (writeError: any) {
    console.error("Error in addWalletServerAction (writing file):", writeError, `Path used: ${walletsFilePath}`);
    const isOnVercel = !!process.env.VERCEL;
    const failureMessage = isOnVercel
      ? "Server error: Could not save address. Vercel's filesystem is likely read-only or ephemeral for serverless functions. Use a database solution for persistent storage."
      : "Server error: Could not add address due to a file writing issue.";
    return { success: false, message: failureMessage };
  }
}
