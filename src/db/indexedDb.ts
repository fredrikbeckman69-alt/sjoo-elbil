import { VehicleProfile, ChargingScenario, SavedTrip, DatabaseBackup } from '../types';
import { DEFAULT_VEHICLE, DEFAULT_SCENARIOS } from '../utils/calculations';

const DB_NAME = 'SjooElbilDB';
const DB_VERSION = 1;

const STORES = {
  SETTINGS: 'settings',
  VEHICLES: 'vehicles',
  SCENARIOS: 'scenarios',
  TRIPS: 'trips',
} as const;

let dbPromise: Promise<IDBDatabase> | null = null;

export function getDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB stöds inte av denna webbläsare'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Settings store: key/value
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
      }

      // 2. Vehicles store
      if (!db.objectStoreNames.contains(STORES.VEHICLES)) {
        db.createObjectStore(STORES.VEHICLES, { keyPath: 'id' });
      }

      // 3. Scenarios store
      if (!db.objectStoreNames.contains(STORES.SCENARIOS)) {
        db.createObjectStore(STORES.SCENARIOS, { keyPath: 'id' });
      }

      // 4. Trips history store
      if (!db.objectStoreNames.contains(STORES.TRIPS)) {
        const tripStore = db.createObjectStore(STORES.TRIPS, { keyPath: 'id' });
        tripStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

  return dbPromise;
}

// ----------------------------------------------------
// SETTINGS
// ----------------------------------------------------
export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const db = await getDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORES.SETTINGS, 'readonly');
      const store = tx.objectStore(STORES.SETTINGS);
      const req = store.get(key);

      req.onsuccess = () => {
        if (req.result && req.result.value !== undefined) {
          resolve(req.result.value as T);
        } else {
          resolve(defaultValue);
        }
      };

      req.onerror = () => {
        resolve(defaultValue);
      };
    });
  } catch (error) {
    console.warn(`IndexedDB getSetting fel för ${key}:`, error);
    return defaultValue;
  }
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  try {
    const db = await getDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SETTINGS, 'readwrite');
      const store = tx.objectStore(STORES.SETTINGS);
      const req = store.put({ key, value });

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.warn(`IndexedDB setSetting fel för ${key}:`, error);
  }
}

// ----------------------------------------------------
// VEHICLES
// ----------------------------------------------------
export async function getActiveVehicle(): Promise<VehicleProfile> {
  try {
    const db = await getDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORES.VEHICLES, 'readonly');
      const store = tx.objectStore(STORES.VEHICLES);
      const req = store.get('primary_vehicle');

      req.onsuccess = () => {
        if (req.result) {
          resolve(req.result as VehicleProfile);
        } else {
          resolve({ ...DEFAULT_VEHICLE, id: 'primary_vehicle' });
        }
      };

      req.onerror = () => {
        resolve({ ...DEFAULT_VEHICLE, id: 'primary_vehicle' });
      };
    });
  } catch (error) {
    console.warn('IndexedDB getActiveVehicle fel:', error);
    return { ...DEFAULT_VEHICLE, id: 'primary_vehicle' };
  }
}

export async function saveActiveVehicle(vehicle: VehicleProfile): Promise<void> {
  try {
    const db = await getDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.VEHICLES, 'readwrite');
      const store = tx.objectStore(STORES.VEHICLES);
      const req = store.put({ ...vehicle, id: 'primary_vehicle' });

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.warn('IndexedDB saveActiveVehicle fel:', error);
  }
}

// ----------------------------------------------------
// SCENARIOS
// ----------------------------------------------------
export async function getScenarios(): Promise<ChargingScenario[]> {
  try {
    const db = await getDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORES.SCENARIOS, 'readonly');
      const store = tx.objectStore(STORES.SCENARIOS);
      const req = store.getAll();

      req.onsuccess = () => {
        if (req.result && req.result.length > 0) {
          resolve(req.result as ChargingScenario[]);
        } else {
          // Ladda in standard och spara om tomt
          saveAllScenarios(DEFAULT_SCENARIOS);
          resolve([...DEFAULT_SCENARIOS]);
        }
      };

      req.onerror = () => {
        resolve([...DEFAULT_SCENARIOS]);
      };
    });
  } catch (error) {
    console.warn('IndexedDB getScenarios fel:', error);
    return [...DEFAULT_SCENARIOS];
  }
}

export async function saveAllScenarios(scenarios: ChargingScenario[]): Promise<void> {
  try {
    const db = await getDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SCENARIOS, 'readwrite');
      const store = tx.objectStore(STORES.SCENARIOS);
      store.clear(); // Rensa gamla så ordning och ändringar speglas exakt

      scenarios.forEach((s) => store.put(s));

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.warn('IndexedDB saveAllScenarios fel:', error);
  }
}

// ----------------------------------------------------
// TRIPS HISTORY
// ----------------------------------------------------
export async function getAllTrips(): Promise<SavedTrip[]> {
  try {
    const db = await getDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORES.TRIPS, 'readonly');
      const store = tx.objectStore(STORES.TRIPS);
      const req = store.getAll();

      req.onsuccess = () => {
        const trips = (req.result as SavedTrip[]) || [];
        // Sortera med nyast överst
        trips.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(trips);
      };

      req.onerror = () => {
        resolve([]);
      };
    });
  } catch (error) {
    console.warn('IndexedDB getAllTrips fel:', error);
    return [];
  }
}

export async function saveTrip(trip: SavedTrip): Promise<void> {
  try {
    const db = await getDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.TRIPS, 'readwrite');
      const store = tx.objectStore(STORES.TRIPS);
      const req = store.put(trip);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.warn('IndexedDB saveTrip fel:', error);
  }
}

export async function deleteTrip(id: string): Promise<void> {
  try {
    const db = await getDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.TRIPS, 'readwrite');
      const store = tx.objectStore(STORES.TRIPS);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.warn('IndexedDB deleteTrip fel:', error);
  }
}

export async function clearAllTrips(): Promise<void> {
  try {
    const db = await getDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.TRIPS, 'readwrite');
      const store = tx.objectStore(STORES.TRIPS);
      const req = store.clear();

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.warn('IndexedDB clearAllTrips fel:', error);
  }
}

// ----------------------------------------------------
export async function getAllSettings(): Promise<Record<string, any>> {
  try {
    const db = await getDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORES.SETTINGS, 'readonly');
      const store = tx.objectStore(STORES.SETTINGS);
      const req = store.getAll();

      req.onsuccess = () => {
        const records = (req.result as Array<{ key: string; value: any }>) || [];
        const map: Record<string, any> = {};
        for (const item of records) {
          map[item.key] = item.value;
        }
        resolve(map);
      };

      req.onerror = () => resolve({});
    });
  } catch (error) {
    console.warn('IndexedDB getAllSettings fel:', error);
    return {};
  }
}

// ----------------------------------------------------
// EXPORT / IMPORT / RESET
// ----------------------------------------------------
export async function exportDatabaseBackup(
  currentVehicle: VehicleProfile,
  currentScenarios: ChargingScenario[],
  currentSettings?: Record<string, any>
): Promise<DatabaseBackup> {
  const [trips, allDbSettings] = await Promise.all([
    getAllTrips(),
    getAllSettings(),
  ]);

  const mergedSettings = { ...allDbSettings, ...(currentSettings || {}) };

  return {
    version: 1,
    databaseName: DB_NAME,
    exportedAt: new Date().toISOString(),
    vehicle: currentVehicle,
    scenarios: currentScenarios,
    settings: mergedSettings,
    trips,
    checklist: mergedSettings['tripChecklist'],
    conditions: mergedSettings['tripConditions'],
    isRoundTrip: mergedSettings['isRoundTrip'],
  };
}

export async function importDatabaseBackup(backup: DatabaseBackup): Promise<void> {
  if (!backup || backup.databaseName !== DB_NAME) {
    throw new Error('Ogiltig säkerhetskopia eller fel databasnamn');
  }

  // Spara fordon
  if (backup.vehicle) {
    await saveActiveVehicle(backup.vehicle);
  }

  // Spara scenarier
  if (Array.isArray(backup.scenarios) && backup.scenarios.length > 0) {
    await saveAllScenarios(backup.scenarios);
  }

  // Spara resor
  if (Array.isArray(backup.trips)) {
    const db = await getDatabase();
    const tx = db.transaction(STORES.TRIPS, 'readwrite');
    const store = tx.objectStore(STORES.TRIPS);
    store.clear();
    backup.trips.forEach((t) => store.put(t));
  }

  // Spara inställningar
  if (backup.settings) {
    for (const [key, value] of Object.entries(backup.settings)) {
      await setSetting(key, value);
    }
  }

  // Säkerställ att eventuella separata fält i äldre backups också sparas
  if (backup.checklist) {
    await setSetting('tripChecklist', backup.checklist);
  }
  if (backup.conditions) {
    await setSetting('tripConditions', backup.conditions);
  }
  if (backup.isRoundTrip !== undefined) {
    await setSetting('isRoundTrip', backup.isRoundTrip);
  }
}

export async function resetDatabaseToDefaults(): Promise<void> {
  const db = await getDatabase();
  const tx = db.transaction([STORES.SETTINGS, STORES.VEHICLES, STORES.SCENARIOS, STORES.TRIPS], 'readwrite');
  
  tx.objectStore(STORES.SETTINGS).clear();
  tx.objectStore(STORES.VEHICLES).clear();
  tx.objectStore(STORES.SCENARIOS).clear();
  tx.objectStore(STORES.TRIPS).clear();

  // Lägg in standard
  tx.objectStore(STORES.VEHICLES).put({ ...DEFAULT_VEHICLE, id: 'primary_vehicle' });
  DEFAULT_SCENARIOS.forEach((s) => tx.objectStore(STORES.SCENARIOS).put(s));

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
