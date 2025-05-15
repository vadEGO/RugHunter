
'use server';

import fs from 'fs/promises';
import path from 'path';

// Define paths relative to the project root.
// On Vercel, process.cwd() should be the root of the serverless function,
// where project files are copied.
const projectRoot = process.cwd();
const dataDir = path.join(projectRoot, 'data');
const walletsFilePath = path.join(dataDir, 'rugged-wallets.json');

export async function getWalletsServerAction(): Promise<string[]> {
  console.log(`[RugHunter] getWalletsServerAction: Attempting to read from ${walletsFilePath}. Current working directory: ${projectRoot}`);
  try {
    const data = await fs.readFile(walletsFilePath, 'utf-8');
    console.log(`[RugHunter] getWalletsServerAction: Successfully read file. Parsing JSON.`);
    const wallets = JSON.parse(data);
    console.log(`[RugHunter] getWalletsServerAction: Successfully parsed ${wallets.length} wallets.`);
    return wallets;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.warn(
        `[RugHunter] getWalletsServerAction: Wallets data file ('${walletsFilePath}') NOT FOUND. ` +
        `This is expected if the file has not been created yet or, crucially on Vercel, is NOT INCLUDED IN THE DEPLOYMENT BUNDLE. ` +
        `ACTION REQUIRED: Ensure 'data/rugged-wallets.json' is committed to your repository with initial content (e.g., '[]'). ` +
        `Returning an empty list.`
      );
      return [];
    }
    console.error(`[RugHunter] getWalletsServerAction: Error reading or parsing wallets file. Path: ${walletsFilePath}. Error:`, error);
    // For other errors (e.g., corrupted JSON, permissions if file exists but unreadable), return empty.
    return [];
  }
}

export async function addWalletServerAction(address: string): Promise<{ success: boolean; message: string; updatedWallets?: string[] }> {
  console.log(`[RugHunter] addWalletServerAction: Adding address '${address}'. Reading existing wallets from ${walletsFilePath}. Current working directory: ${projectRoot}`);
  let currentWallets: string[] = [];
  try {
    const data = await fs.readFile(walletsFilePath, 'utf-8');
    currentWallets = JSON.parse(data);
    console.log(`[RugHunter] addWalletServerAction: Successfully read and parsed ${currentWallets.length} existing wallets.`);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log(
        `[RugHunter] addWalletServerAction: Wallets data file ('${walletsFilePath}') NOT FOUND during read for add operation. ` +
        `Will proceed assuming an empty list for this session. ` +
        `Remember, on Vercel, the file system is ephemeral; writes won't persist a new file if it wasn't in the bundle.`
      );
      // currentWallets remains []
    } else {
      console.error(`[RugHunter] addWalletServerAction: Error reading or parsing existing wallets file before adding. Path: ${walletsFilePath}. Error:`, error);
      return { success: false, message: "Server error: Could not read existing wallet data to add new wallet." };
    }
  }

  const normalizedAddress = address.toLowerCase();
  if (currentWallets.map(w => w.toLowerCase()).includes(normalizedAddress)) {
    console.log(`[RugHunter] addWalletServerAction: Address '${normalizedAddress}' already in the list.`);
    return { success: false, message: "Address already in the list.", updatedWallets: currentWallets };
  }

  currentWallets.push(normalizedAddress);
  console.log(`[RugHunter] addWalletServerAction: Address '${normalizedAddress}' added to in-memory list. Total wallets now: ${currentWallets.length}.`);

  const isOnVercel = !!process.env.VERCEL;
  if (isOnVercel) {
    console.warn(
      `[RugHunter] addWalletServerAction: Running on Vercel. File system writes to ${walletsFilePath} are ephemeral and will NOT persist across deployments or different serverless function invocations. ` +
      `The operation will update client-side state for this session only.`
    );
    // On Vercel, we return success optimistically for the in-memory update.
    // The change won't persist in the file for subsequent fresh reads from a new function instance.
    return {
      success: true,
      message: "Address added (session only on Vercel). Note: File-based storage on Vercel is ephemeral. Changes may not persist reliably. A database (e.g., Vercel KV, Postgres) is recommended for production data.",
      updatedWallets: currentWallets
    };
  }

  // Logic for non-Vercel environments (e.g., local development where file writes persist)
  try {
    console.log(`[RugHunter] addWalletServerAction: (Non-Vercel Environment) Attempting to write updated wallets to: ${walletsFilePath}.`);
    // Ensure 'data' directory exists. This is mainly for local dev convenience.
    // On Vercel, if 'data' dir wasn't in bundle, this might fail or be irrelevant if writeFile fails.
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(walletsFilePath, JSON.stringify(currentWallets, null, 2), 'utf-8');
    
    const successMessage = "Address added successfully and saved to file.";
    console.log(`[RugHunter] addWalletServerAction: ${successMessage}`);
    return { success: true, message: successMessage, updatedWallets: currentWallets };

  } catch (writeError: any) {
    console.error(`[RugHunter] addWalletServerAction: (Non-Vercel Environment) Error writing wallets file. Path: ${walletsFilePath}. Error:`, writeError);
    const failureMessage = "Server error: Could not add address due to a file writing issue.";
    return { success: false, message: failureMessage };
  }
}
