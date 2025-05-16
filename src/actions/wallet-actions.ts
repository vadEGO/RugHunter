
'use server';

import fs from 'fs/promises';
import path from 'path';

// Define paths relative to the project root.
const projectRoot = process.cwd();
const dataDir = path.join(projectRoot, 'data');
const ruggedWalletsFilePath = path.join(dataDir, 'rugged-wallets.json');
// const goodWalletsFilePath = path.join(dataDir, 'good-wallets.json'); // Removed for rollback

async function performDiagnosticLogging() {
  if (process.env.VERCEL) { // Only run diagnostics on Vercel for clarity
    console.log(`[RugHunter Diagnostic] Current working directory (projectRoot): ${projectRoot}`);
    console.log(`[RugHunter Diagnostic] Constructed dataDir: ${dataDir}`);
    console.log(`[RugHunter Diagnostic] Constructed ruggedWalletsFilePath: ${ruggedWalletsFilePath}`);
    // console.log(`[RugHunter Diagnostic] Constructed goodWalletsFilePath: ${goodWalletsFilePath}`); // Removed for rollback
    try {
      console.log(`[RugHunter Diagnostic] Listing contents of /var/task (projectRoot):`);
      const rootContents = await fs.readdir(projectRoot);
      console.log(`[RugHunter Diagnostic] /var/task contents: ${rootContents.join(', ')}`);

      try {
        console.log(`[RugHunter Diagnostic] Listing contents of ${dataDir}:`);
        const dataDirContents = await fs.readdir(dataDir);
        console.log(`[RugHunter Diagnostic] ${dataDir} contents: ${dataDirContents.join(', ')}`);
      } catch (e: any) {
        if (e.code === 'ENOENT') {
          console.warn(`[RugHunter Diagnostic] Directory ${dataDir} NOT FOUND.`);
        } else {
          console.warn(`[RugHunter Diagnostic] Could not list contents of ${dataDir}: ${e.message}`);
        }
      }
    } catch (e: any) {
      console.warn(`[RugHunter Diagnostic] Could not list contents of ${projectRoot}: ${e.message}`);
    }
  }
}

// --- Rugged Wallets Actions ---

export async function getWalletsServerAction(): Promise<string[]> {
  await performDiagnosticLogging(); 

  console.log(`[RugHunter] getWalletsServerAction (Rugged): Attempting to read from ${ruggedWalletsFilePath}.`);
  try {
    const data = await fs.readFile(ruggedWalletsFilePath, 'utf-8');
    console.log(`[RugHunter] getWalletsServerAction (Rugged): Successfully read file. Parsing JSON.`);
    const wallets = JSON.parse(data);
    console.log(`[RugHunter] getWalletsServerAction (Rugged): Successfully parsed ${wallets.length} wallets.`);
    return wallets;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.warn(
        `[RugHunter] getWalletsServerAction (Rugged): Wallets data file ('${ruggedWalletsFilePath}') NOT FOUND. ` +
        `ACTION REQUIRED: Ensure 'data/rugged-wallets.json' is committed to your repository with initial content (e.g., '[]') AND ` +
        `that 'next.config.ts' correctly includes it. Returning an empty list.`
      );
      return [];
    }
    console.error(`[RugHunter] getWalletsServerAction (Rugged): Error reading or parsing wallets file. Path: ${ruggedWalletsFilePath}. Error:`, error);
    return [];
  }
}

export async function addWalletServerAction(address: string): Promise<{ success: boolean; message: string; updatedWallets?: string[] }> {
  console.log(`[RugHunter] addWalletServerAction (Rugged): Adding address '${address}'. Reading existing wallets from ${ruggedWalletsFilePath}.`);
  let currentWallets: string[] = [];
  try {
    const data = await fs.readFile(ruggedWalletsFilePath, 'utf-8');
    currentWallets = JSON.parse(data);
    console.log(`[RugHunter] addWalletServerAction (Rugged): Successfully read and parsed ${currentWallets.length} existing rugged wallets.`);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log(
        `[RugHunter] addWalletServerAction (Rugged): File ('${ruggedWalletsFilePath}') NOT FOUND. Will proceed assuming an empty list.`
      );
    } else {
      console.error(`[RugHunter] addWalletServerAction (Rugged): Error reading file. Path: ${ruggedWalletsFilePath}. Error:`, error);
      return { success: false, message: "Server error: Could not read existing rugged wallet data." };
    }
  }

  const normalizedAddress = address.toLowerCase();
  if (currentWallets.map(w => w.toLowerCase()).includes(normalizedAddress)) {
    console.log(`[RugHunter] addWalletServerAction (Rugged): Address '${normalizedAddress}' already in the rugged list.`);
    return { success: false, message: "Address already in the rugged list.", updatedWallets: currentWallets };
  }

  currentWallets.push(normalizedAddress);
  console.log(`[RugHunter] addWalletServerAction (Rugged): Address '${normalizedAddress}' added to in-memory rugged list. Total: ${currentWallets.length}.`);

  // Removed logic for interacting with good wallets list during rollback
  // console.log(`[RugHunter] addWalletServerAction (Rugged): Attempting to remove '${normalizedAddress}' from good wallets list as a precaution.`);
  // const removeFromGoodResult = await removeGoodWalletServerAction(normalizedAddress);
  // if (removeFromGoodResult.success) {
  //   console.log(`[RugHunter] addWalletServerAction (Rugged): Successfully ensured '${normalizedAddress}' is not in good wallets list (or it wasn't there).`);
  // } else {
  //   console.warn(`[RugHunter] addWalletServerAction (Rugged): Could not ensure removal from good wallets list for '${normalizedAddress}'. Message: ${removeFromGoodResult.message}`);
  // }


  const isOnVercel = !!process.env.VERCEL;
  if (isOnVercel) {
    console.warn(
      `[RugHunter] addWalletServerAction (Rugged): Running on Vercel. File system writes to ${ruggedWalletsFilePath} are ephemeral. ` +
      `Operation will update client-side state for this session only.`
    );
    return {
      success: true,
      message: "Address added to rugged list (session only on Vercel). Changes may not persist. A database is recommended.",
      updatedWallets: currentWallets
    };
  }

  try {
    console.log(`[RugHunter] addWalletServerAction (Rugged): (Non-Vercel) Attempting to write updated rugged wallets to: ${ruggedWalletsFilePath}.`);
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(ruggedWalletsFilePath, JSON.stringify(currentWallets, null, 2), 'utf-8');
    
    const successMessage = "Address added to rugged list successfully and saved to file.";
    console.log(`[RugHunter] addWalletServerAction (Rugged): ${successMessage}`);
    return { success: true, message: successMessage, updatedWallets: currentWallets };

  } catch (writeError: any) {
    console.error(`[RugHunter] addWalletServerAction (Rugged): (Non-Vercel) Error writing file. Path: ${ruggedWalletsFilePath}. Error:`, writeError);
    return { success: false, message: "Server error: Could not save rugged wallet data." };
  }
}

// --- Good Wallets Actions (Removed during rollback) ---
// export async function getGoodWalletsServerAction(): Promise<string[]> { ... }
// export async function addGoodWalletServerAction(address: string): Promise<{ success: boolean; message: string; updatedWallets?: string[] }> { ... }
// export async function removeGoodWalletServerAction(address: string): Promise<{ success: boolean; message: string; updatedWallets?: string[] }> { ... }
