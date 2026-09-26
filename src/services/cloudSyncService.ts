import {
  VehicleProfile,
  ChargingScenario,
  SavedTrip,
  TripConditions,
  ChecklistItem,
} from '../types';
import {
  DEFAULT_VEHICLE,
  DEFAULT_SCENARIOS,
  DEFAULT_TRIP_CONDITIONS,
  DEFAULT_CHECKLIST,
} from '../utils/calculations';

export interface CloudAppState {
  version: number;
  updatedAt: string;
  updatedBy: string;
  vehicle: VehicleProfile;
  scenarios: ChargingScenario[];
  tripDistanceMil: number;
  monthlyDistanceMil: number;
  startAddress: string;
  destAddress: string;
  isRoundTrip: boolean;
  tripConditions?: TripConditions;
  checklist?: ChecklistItem[];
  trips?: SavedTrip[];
}

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  error: string | null;
  cloudDocId: string;
}

const CLOUD_STORAGE_KEY = 'sjoo_cloud_doc_id';
export const DEFAULT_CLOUD_DOC_ID = 'ff808181a09d98f701a0dce86db71af9';
const API_BASE_URL = 'https://api.restful-api.dev/objects';

export function getCloudDocId(): string {
  try {
    return localStorage.getItem(CLOUD_STORAGE_KEY) || DEFAULT_CLOUD_DOC_ID;
  } catch {
    return DEFAULT_CLOUD_DOC_ID;
  }
}

export function setCloudDocId(docId: string): void {
  try {
    localStorage.setItem(CLOUD_STORAGE_KEY, docId.trim() || DEFAULT_CLOUD_DOC_ID);
  } catch (err) {
    console.warn('Kunde inte spara cloudDocId i localStorage:', err);
  }
}

// Skapa unikt slumpat enhets-ID för denna session
const SESSION_DEVICE_ID = 'user-' + Math.random().toString(36).substring(2, 8);

let currentLocalState: CloudAppState = {
  version: 1,
  updatedAt: new Date(0).toISOString(),
  updatedBy: SESSION_DEVICE_ID,
  vehicle: {
    ...DEFAULT_VEHICLE,
    consumptionKwhPer100Km: 18.04, // Matchar exakt användarens inmatade värden
  },
  scenarios: DEFAULT_SCENARIOS,
  tripDistanceMil: 42,
  monthlyDistanceMil: 125,
  startAddress: 'Stockholm',
  destAddress: 'Sälen',
  isRoundTrip: false,
  tripConditions: DEFAULT_TRIP_CONDITIONS,
  checklist: DEFAULT_CHECKLIST,
  trips: [],
};

let syncListeners: ((status: SyncStatus) => void)[] = [];
let updateListeners: ((state: CloudAppState) => void)[] = [];

let syncStatus: SyncStatus = {
  isSyncing: false,
  lastSyncedAt: null,
  error: null,
  cloudDocId: getCloudDocId(),
};

function notifyStatusChange() {
  syncListeners.forEach((fn) => {
    try {
      fn({ ...syncStatus });
    } catch (err) {
      console.error('Fel i sync status lyssnare:', err);
    }
  });
}

function updateSyncStatus(patch: Partial<SyncStatus>) {
  syncStatus = { ...syncStatus, ...patch };
  notifyStatusChange();
}

export function subscribeToSyncStatus(listener: (status: SyncStatus) => void): () => void {
  syncListeners.push(listener);
  listener({ ...syncStatus });
  return () => {
    syncListeners = syncListeners.filter((fn) => fn !== listener);
  };
}

export function subscribeToCloudUpdates(listener: (state: CloudAppState) => void): () => void {
  updateListeners.push(listener);
  return () => {
    updateListeners = updateListeners.filter((fn) => fn !== listener);
  };
}

/**
 * Kompakterar scenarier för att rymmas optimalt
 */
function compactScenarios(scenarios: ChargingScenario[]) {
  return scenarios.map((s) => ({
    id: s.id,
    p: s.pricePerKwh,
    m: s.monthlyFee,
    s: s.sessionFee,
    n: s.name,
    d: s.description || undefined,
    c: s.badgeColor || undefined,
  }));
}

function expandScenarios(compactList: any[]): ChargingScenario[] {
  if (!Array.isArray(compactList) || compactList.length === 0) {
    return DEFAULT_SCENARIOS;
  }

  return compactList.map((c) => {
    const defaultMatch = DEFAULT_SCENARIOS.find((ds) => ds.id === c.id);
    return {
      id: c.id,
      name: c.n || defaultMatch?.name || 'Laddscenario',
      description: c.d || defaultMatch?.description || '',
      pricePerKwh: typeof c.p === 'number' ? c.p : (defaultMatch?.pricePerKwh ?? 1.5),
      monthlyFee: typeof c.m === 'number' ? c.m : (defaultMatch?.monthlyFee ?? 0),
      sessionFee: typeof c.s === 'number' ? c.s : (defaultMatch?.sessionFee ?? 0),
      badgeColor: c.c || defaultMatch?.badgeColor || 'cyan',
      isDefault: defaultMatch?.isDefault ?? false,
    };
  });
}

/**
 * Hämtar senaste delade tillstånd från molnet
 */
export async function fetchLatestCloudState(): Promise<CloudAppState | null> {
  const docId = getCloudDocId();
  updateSyncStatus({ isSyncing: true, error: null, cloudDocId: docId });

  try {
    const res = await fetch(`${API_BASE_URL}/${docId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      if (res.status === 404) {
        // Om dokumentet inte finns ännu, initiera det med nuvarande tillstånd
        console.info('Molndokument hittades inte, initierar nytt molndokument...');
        await pushCloudState(currentLocalState, true);
        updateSyncStatus({ isSyncing: false, lastSyncedAt: new Date() });
        return currentLocalState;
      }
      throw new Error(`Molnservern svarade med HTTP ${res.status}`);
    }

    const json = await res.json();
    const data = json?.data;

    if (!data || !data.raw) {
      updateSyncStatus({ isSyncing: false });
      return null;
    }

    let parsed: any = null;
    try {
      parsed = JSON.parse(data.raw);
    } catch (e) {
      console.warn('Kunde inte avkoda rådata från molnet:', e);
      updateSyncStatus({ isSyncing: false });
      return null;
    }

    const scenarios = expandScenarios(parsed.sc);
    const vehicle: VehicleProfile = {
      name: parsed.vh?.n || currentLocalState.vehicle.name,
      consumptionKwhPer100Km: typeof parsed.vh?.kwh100 === 'number' ? parsed.vh.kwh100 : currentLocalState.vehicle.consumptionKwhPer100Km,
      batteryCapacityKwh: typeof parsed.vh?.bat === 'number' ? parsed.vh.bat : currentLocalState.vehicle.batteryCapacityKwh,
    };

    const cloudState: CloudAppState = {
      version: 1,
      updatedAt: parsed.updatedAt || data.updatedAt || new Date().toISOString(),
      updatedBy: parsed.updatedBy || 'remote_user',
      vehicle,
      scenarios,
      tripDistanceMil: typeof parsed.st?.tMil === 'number' ? parsed.st.tMil : 42,
      monthlyDistanceMil: typeof parsed.st?.mMil === 'number' ? parsed.st.mMil : 125,
      startAddress: parsed.st?.sAddr || 'Stockholm',
      destAddress: parsed.st?.dAddr || 'Sälen',
      isRoundTrip: typeof parsed.st?.rt === 'boolean' ? parsed.st.rt : false,
      tripConditions: currentLocalState.tripConditions,
      checklist: currentLocalState.checklist,
      trips: currentLocalState.trips,
    };

    updateSyncStatus({
      isSyncing: false,
      lastSyncedAt: new Date(),
      error: null,
    });

    const cloudTime = new Date(cloudState.updatedAt).getTime();
    const localTime = new Date(currentLocalState.updatedAt).getTime();

    if (cloudTime > localTime) {
      currentLocalState = cloudState;
      updateListeners.forEach((fn) => {
        try {
          fn(cloudState);
        } catch (err) {
          console.error('Fel vid anrop av molnuppdateringslyssnare:', err);
        }
      });
    }

    return cloudState;
  } catch (err: any) {
    const errorMsg = err?.message || 'Nätverksfel vid molnsynkronisering';
    console.warn('Molnsynkronisering misslyckades (använder lokal data):', errorMsg);
    updateSyncStatus({
      isSyncing: false,
      error: errorMsg,
    });
    return null;
  }
}

let pushDebounceTimer: any = null;

/**
 * Pushar uppdaterat tillstånd till det centrala molnet
 */
export function pushCloudState(patch: Partial<CloudAppState>, immediate = false): Promise<void> {
  const now = new Date().toISOString();
  currentLocalState = {
    ...currentLocalState,
    ...patch,
    updatedAt: now,
    updatedBy: SESSION_DEVICE_ID,
  };

  if (immediate) {
    if (pushDebounceTimer) clearTimeout(pushDebounceTimer);
    return executePush();
  }

  return new Promise((resolve) => {
    if (pushDebounceTimer) clearTimeout(pushDebounceTimer);
    pushDebounceTimer = setTimeout(async () => {
      await executePush();
      resolve();
    }, 600);
  });
}

async function executePush(): Promise<void> {
  const docId = getCloudDocId();
  updateSyncStatus({ isSyncing: true, error: null, cloudDocId: docId });

  try {
    const compactPayload = {
      sc: compactScenarios(currentLocalState.scenarios),
      vh: {
        n: currentLocalState.vehicle.name,
        kwh100: currentLocalState.vehicle.consumptionKwhPer100Km,
        bat: currentLocalState.vehicle.batteryCapacityKwh,
      },
      st: {
        tMil: currentLocalState.tripDistanceMil,
        mMil: currentLocalState.monthlyDistanceMil,
        sAddr: currentLocalState.startAddress,
        dAddr: currentLocalState.destAddress,
        rt: currentLocalState.isRoundTrip,
      },
      updatedAt: currentLocalState.updatedAt,
      updatedBy: SESSION_DEVICE_ID,
    };

    const raw = JSON.stringify(compactPayload);

    const reqBody = {
      name: 'sjoo_shared_state',
      data: {
        raw,
        updatedAt: currentLocalState.updatedAt,
      },
    };

    const res = await fetch(`${API_BASE_URL}/${docId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reqBody),
    });

    if (!res.ok) {
      throw new Error(`Molnservern avvisade uppdatering (HTTP ${res.status})`);
    }

    updateSyncStatus({
      isSyncing: false,
      lastSyncedAt: new Date(),
      error: null,
    });
  } catch (err: any) {
    const errorMsg = err?.message || 'Kunde inte spara till molnet';
    console.warn('Fel vid sändning till molndatabas:', errorMsg);
    updateSyncStatus({
      isSyncing: false,
      error: errorMsg,
    });
  }
}

/**
 * Startar automatisk bakgrundssynk och lyssnar på fokusförändringar
 */
export function startAutoSync(onRemoteUpdate: (state: CloudAppState) => void): () => void {
  const unsubscribe = subscribeToCloudUpdates(onRemoteUpdate);

  // 1. Initial hämtning direkt
  fetchLatestCloudState();

  // 2. Pollning var 15:e sekund
  const intervalId = setInterval(() => {
    fetchLatestCloudState();
  }, 15000);

  // 3. Omedelbar hämtning när användaren återvänder till fliken/fönstret
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      fetchLatestCloudState();
    }
  };

  const handleWindowFocus = () => {
    fetchLatestCloudState();
  };

  window.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('focus', handleWindowFocus);

  return () => {
    unsubscribe();
    clearInterval(intervalId);
    window.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('focus', handleWindowFocus);
  };
}
