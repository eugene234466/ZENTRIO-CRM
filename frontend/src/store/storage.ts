// storage.ts
// The ONLY place in the app that loads and saves data.
// Everything here is async on purpose: today it reads/writes localStorage,
// but B2 will later swap these internals for real network calls without
// any page or component needing to change how it calls loadState/saveState.

import type { AppState } from '@/types';
import { initialState } from './reducer';

const STORAGE_KEY = 'zentrio-data';
const STORAGE_VERSION = 1;

interface StoredPayload {
  version: number;
  state: AppState;
}

function isValidPayload(value: unknown): value is StoredPayload {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Partial<StoredPayload>;

  return (
    candidate.version === STORAGE_VERSION &&
    !!candidate.state &&
    typeof candidate.state === 'object'
  );
}

function mergeWithInitialState(savedState: AppState): AppState {
  return {
    ...initialState,
    ...savedState,
    settings: {
      ...initialState.settings,
      ...savedState.settings,
      business: {
        ...initialState.settings.business,
        ...savedState.settings?.business,
      },
      invoices: {
        ...initialState.settings.invoices,
        ...savedState.settings?.invoices,
      },
      lists: {
        ...initialState.settings.lists,
        ...savedState.settings?.lists,
      },
      users: {
        ...initialState.settings.users,
        ...savedState.settings?.users,
      },
      account: {
        ...initialState.settings.account,
        ...savedState.settings?.account,
      },
      data: {
        ...initialState.settings.data,
        ...savedState.settings?.data,
      },
    },
  };
}

// Loads saved data. Falls back to the sample data if nothing is saved,
// the saved data is unreadable, or it's from an older/incompatible version.
export async function loadState(): Promise<AppState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) return initialState;

    const parsed: unknown = JSON.parse(raw);

    if (!isValidPayload(parsed)) return initialState;

    return mergeWithInitialState(parsed.state);
  } catch {
    // Corrupted/unreadable JSON (e.g. random text in zentrio-data) —
    // load sample data instead.
    return initialState;
  }
}

// Saves the current state. Throws on failure (e.g. storage full, private browsing)
// so callers can catch it and show an error toast — matching how B2 will later
// need to signal a failed server save without ever claiming a change was saved when it wasn't.
export async function saveState(state: AppState): Promise<void> {
  const payload: StoredPayload = {
    version: STORAGE_VERSION,
    state,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

// S4's "Reset to sample data" — also switched off entirely on the live server per B2.
export async function resetToSampleData(): Promise<AppState> {
  await saveState(initialState);
  return initialState;
}