import { UserAccount, VehicleProfile } from '../types';
import { getSetting, setSetting } from '../db/indexedDb';
import { cleanVehicleDisplayName } from './vehicleRegistryService';

const STORAGE_ACCOUNTS_KEY = 'sjoo_user_accounts';
const STORAGE_LAST_VEHICLE_KEY = 'sjoo_last_selected_vehicle_id';

// Rensa eventuella gamla auto-inloggningar så att pinkod alltid måste anges
try {
  localStorage.removeItem('sjoo_active_user_id');
  sessionStorage.removeItem('sjoo_active_user_id');
} catch {
  // Ignore
}

export const DEFAULT_ACCOUNTS: UserAccount[] = [
  {
    id: 'FFM56R',
    regnr: 'FFM56R',
    ownerName: 'Markus Sjöö',
    name: 'Cupra Born 58',
    pinCode: '7289',
    createdAt: '2025-01-01T00:00:00.000Z',
    cloudDocId: 'ff808181a09d98f701a0dce86db71af9', // Egen dedikerad molnsynk för Markus Sjöö
    vehicleProfile: {
      id: 'FFM56R',
      name: 'Cupra Born 58',
      consumptionKwhPer100Km: 15.7,
      batteryCapacityKwh: 58,
    },
    color: 'emerald',
  },
  {
    id: 'MIN-BIL',
    regnr: 'MIN-BIL',
    ownerName: 'Demoförare',
    name: 'Standard Elbil',
    pinCode: '0000',
    createdAt: '2025-01-01T00:00:00.000Z',
    cloudDocId: 'doc_demo_min_bil',
    vehicleProfile: {
      id: 'MIN-BIL',
      name: 'Standard Elbil',
      consumptionKwhPer100Km: 18.04,
      batteryCapacityKwh: 77,
    },
    color: 'cyan',
  },
];

/**
 * Hämta samtliga registrerade användarkonton
 */
export async function getUserAccounts(): Promise<UserAccount[]> {
  try {
    let accounts: UserAccount[] = [];

    // 1. Prova IndexedDB först
    const dbAccounts = await getSetting<UserAccount[]>(STORAGE_ACCOUNTS_KEY, []);
    if (dbAccounts && dbAccounts.length > 0) {
      accounts = dbAccounts;
    } else {
      // 2. Prova localStorage som fallback
      const local = localStorage.getItem(STORAGE_ACCOUNTS_KEY);
      if (local) {
        const parsed = JSON.parse(local) as UserAccount[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          accounts = parsed;
        }
      }
    }

    if (accounts.length === 0) {
      accounts = [...DEFAULT_ACCOUNTS];
      await saveAllUserAccounts(accounts);
      return accounts;
    }

    // Säkerställ att Markus Sjöö med pinkod 7289 alltid är uppdaterad och städa bort överflödigt regnr i parentes
    let needsSave = false;
    for (const acc of accounts) {
      const cleanedName = cleanVehicleDisplayName(acc.name, acc.regnr);
      if (cleanedName !== acc.name) {
        acc.name = cleanedName;
        needsSave = true;
      }
      if (acc.vehicleProfile) {
        const cleanedProfileName = cleanVehicleDisplayName(acc.vehicleProfile.name, acc.regnr);
        if (cleanedProfileName !== acc.vehicleProfile.name) {
          acc.vehicleProfile.name = cleanedProfileName;
          needsSave = true;
        }
      }
    }

    const ffm = accounts.find((a) => a.id.toUpperCase() === 'FFM56R' || a.regnr.toUpperCase() === 'FFM56R');
    if (ffm) {
      if (ffm.ownerName !== 'Markus Sjöö' || ffm.pinCode === '1234' || !ffm.cloudDocId) {
        ffm.ownerName = 'Markus Sjöö';
        ffm.pinCode = '7289';
        ffm.cloudDocId = 'ff808181a09d98f701a0dce86db71af9';
        needsSave = true;
      }
    } else {
      accounts.unshift(DEFAULT_ACCOUNTS[0]);
      needsSave = true;
    }

    if (needsSave) {
      await saveAllUserAccounts(accounts);
    }

    return accounts;
  } catch (err) {
    console.warn('Kunde inte läsa användarkonton, använder standardkonton:', err);
    return [...DEFAULT_ACCOUNTS];
  }
}

/**
 * Spara alla konton i både IndexedDB och localStorage
 */
export async function saveAllUserAccounts(accounts: UserAccount[]): Promise<void> {
  try {
    localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
    await setSetting(STORAGE_ACCOUNTS_KEY, accounts);
  } catch (err) {
    console.warn('Kunde inte spara användarkonton:', err);
  }
}

/**
 * Spara eller uppdatera ett enskilt användarkonto
 */
export async function saveUserAccount(account: UserAccount): Promise<UserAccount[]> {
  const current = await getUserAccounts();
  const normalizedId = account.id.trim().toUpperCase();
  const cleanName = cleanVehicleDisplayName(account.name, account.regnr);
  const cleanProfile: VehicleProfile = account.vehicleProfile
    ? {
        ...account.vehicleProfile,
        name: cleanVehicleDisplayName(account.vehicleProfile.name, account.regnr),
      }
    : {
        id: normalizedId,
        name: cleanName,
        batteryCapacityKwh: 60,
        consumptionKwhPer100Km: 17.5,
      };
  const sanitizedAccount: UserAccount = {
    ...account,
    id: normalizedId,
    name: cleanName,
    cloudDocId:
      account.cloudDocId ||
      (normalizedId === 'FFM56R'
        ? 'ff808181a09d98f701a0dce86db71af9'
        : `doc_${normalizedId.toLowerCase()}`),
    vehicleProfile: cleanProfile,
  };

  const index = current.findIndex(
    (a) => a.id.toUpperCase() === normalizedId || a.regnr.toUpperCase() === account.regnr.toUpperCase()
  );

  let updated: UserAccount[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = sanitizedAccount;
  } else {
    updated = [sanitizedAccount, ...current];
  }

  await saveAllUserAccounts(updated);
  return updated;
}

/**
 * Ta bort ett användarkonto
 */
export async function deleteUserAccount(id: string): Promise<UserAccount[]> {
  const current = await getUserAccounts();
  const updated = current.filter((a) => a.id.toUpperCase() !== id.toUpperCase());
  await saveAllUserAccounts(updated);
  return updated;
}

/**
 * Validera inmatad fyrsiffrig pinkod mot angivet registreringsnummer / fordonskonto
 */
export async function validatePin(
  regnrOrId: string,
  pin: string
): Promise<{ success: boolean; account?: UserAccount; error?: string }> {
  const accounts = await getUserAccounts();
  const cleanKey = regnrOrId.trim().toUpperCase().replace(/\s/g, '');
  const cleanPin = pin.trim();

  const account = accounts.find(
    (a) =>
      a.id.toUpperCase().replace(/\s/g, '') === cleanKey ||
      a.regnr.toUpperCase().replace(/\s/g, '') === cleanKey
  );

  if (!account) {
    return {
      success: false,
      error: `Fordon med regnr "${regnrOrId}" hittades inte bland registrerade konton.`,
    };
  }

  if (account.pinCode !== cleanPin) {
    return {
      success: false,
      error: 'Felaktig PIN-kod för valt fordon. Försök igen.',
    };
  }

  return {
    success: true,
    account,
  };
}

/**
 * Hämta senast valda fordons-ID (endast för att förvälja i dropdownen).
 * Ger ALDRIG direkt åtkomst till appen utan pinkod.
 */
export function getLastSelectedVehicleId(): string | null {
  try {
    return localStorage.getItem(STORAGE_LAST_VEHICLE_KEY);
  } catch {
    return null;
  }
}

/**
 * Kom ihåg senast valda fordon till nästa inloggning
 */
export function setLastSelectedVehicleId(vehicleId: string): void {
  try {
    localStorage.setItem(STORAGE_LAST_VEHICLE_KEY, vehicleId);
  } catch {
    // Ignore storage quota or permission errors
  }
}

/**
 * Uppdatera profiluppgifter för ett konto (namn, bilbild, modellnamn)
 */
export async function updateAccountProfile(
  id: string,
  updates: Partial<Pick<UserAccount, 'ownerName' | 'photoUrl' | 'name' | 'pinCode' | 'activeMemberships' | 'electricityArea' | 'vehicleProfile'>>
): Promise<UserAccount> {
  const accounts = await getUserAccounts();
  const index = accounts.findIndex((a) => a.id.toUpperCase() === id.toUpperCase());
  if (index < 0) throw new Error('Kontot hittades inte');

  const current = accounts[index];
  const cleanedName = updates.name !== undefined ? cleanVehicleDisplayName(updates.name, current.regnr) : current.name;
  const updatedVehicleProfile = {
    ...current.vehicleProfile,
    ...(updates.vehicleProfile || {}),
    ...(updates.name !== undefined ? { name: cleanedName } : {}),
    ...(updates.photoUrl !== undefined ? { photoUrl: updates.photoUrl } : {}),
  };

  const updatedAccount: UserAccount = {
    ...current,
    ...updates,
    name: cleanedName,
    vehicleProfile: updatedVehicleProfile,
  };

  accounts[index] = updatedAccount;
  await saveAllUserAccounts(accounts);
  return updatedAccount;
}

/**
 * Byt 4-siffrig pinkod för ett konto med kontroll av gammal pinkod
 */
export async function changeAccountPin(
  id: string,
  oldPin: string,
  newPin: string
): Promise<{ success: boolean; account?: UserAccount; error?: string }> {
  const accounts = await getUserAccounts();
  const cleanOldPin = oldPin.trim();
  const cleanNewPin = newPin.trim();

  if (!/^\d{4}$/.test(cleanNewPin)) {
    return { success: false, error: 'Den nya pinkoden måste bestå av exakt 4 siffror (0000–9999).' };
  }

  const index = accounts.findIndex((a) => a.id.toUpperCase() === id.toUpperCase());
  if (index < 0) {
    return { success: false, error: 'Kontot hittades inte.' };
  }

  if (accounts[index].pinCode !== cleanOldPin) {
    return { success: false, error: 'Nuvarande pinkod stämmer inte. Kontrollera och försök igen.' };
  }

  accounts[index].pinCode = cleanNewPin;
  await saveAllUserAccounts(accounts);
  return { success: true, account: accounts[index] };
}

/**
 * Konvertera och skala ner en uppladdad bildfil till en kompakt Base64 Data URL
 */
export function fileToResizedBase64(file: File, maxWidth = 1200, maxHeight = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Vänligen välj en giltig bildfil (JPG, PNG eller WebP).'));
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / maxWidth > height / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => reject(new Error('Kunde inte läsa in bilden.'));
      img.src = dataUrl;
    };
    reader.onerror = () => reject(new Error('Kunde inte läsa filen.'));
    reader.readAsDataURL(file);
  });
}


