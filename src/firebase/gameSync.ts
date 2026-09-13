import { doc, getDoc, setDoc, getDocs, collection, query, orderBy, limit } from 'firebase/firestore';
import { db, auth } from './config';
import { handleFirestoreError, OperationType } from './errorHandling';
import { PlayerInventory, PlayerCustomization } from '../types';

export interface FirebaseUserData {
  userId: string;
  displayName: string;
  email?: string;
  photoURL?: string;
  bestScore: number;
  coins: number;
  equippedSwordId?: string | null;
  ownedSwordIds: string[];
  playerMultiplier: number;
  unlockedMultipliers: number[];
  zombiesDefeated: number;
  customization?: PlayerCustomization;
  updatedAt: string;
  createdAt?: string;
}

export interface LeaderboardRecord {
  userId: string;
  displayName: string;
  photoURL?: string;
  bestScore: number;
  coins: number;
  zombiesDefeated: number;
  updatedAt: string;
}

const LOCAL_SAVE_PREFIX = 'superboy_save_';
const LOCAL_LEADERBOARD_KEY = 'superboy_leaderboard_cache';

function isOfflineOrUnavailable(error: unknown): boolean {
  if (!error) return false;
  const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  const code = (error as { code?: string }).code;
  return (
    code === 'unavailable' ||
    msg.includes('unavailable') ||
    msg.includes('offline') ||
    msg.includes('could not reach cloud firestore')
  );
}

/**
 * Save user game progress and stats to their private document in Firestore with offline local fallback
 */
export async function saveUserProgress(
  bestScore: number,
  inventory: PlayerInventory,
  zombiesDefeated: number,
  customization?: PlayerCustomization
): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  const payload: FirebaseUserData = {
    userId: user.uid,
    displayName: user.displayName || 'Jugador Super Boy',
    email: user.email || undefined,
    photoURL: user.photoURL || undefined,
    bestScore: Math.floor(bestScore),
    coins: Math.floor(inventory.coins),
    equippedSwordId: inventory.equippedSwordId,
    ownedSwordIds: inventory.ownedSwordIds,
    playerMultiplier: inventory.playerMultiplier,
    unlockedMultipliers: inventory.unlockedMultipliers,
    zombiesDefeated: Math.floor(zombiesDefeated),
    ...(customization ? { customization } : {}),
    updatedAt: new Date().toISOString(),
  };

  // 1. Immediately cache locally for offline durability
  try {
    localStorage.setItem(`${LOCAL_SAVE_PREFIX}${user.uid}`, JSON.stringify(payload));
  } catch (e) {
    // localStorage full or disabled
  }

  // 2. Sync to Cloud Firestore
  const path = `users/${user.uid}`;
  try {
    await setDoc(doc(db, 'users', user.uid), payload, { merge: true });

    // Also update public leaderboard if score > 0
    if (bestScore > 0) {
      await updateLeaderboardEntry(
        user.uid,
        user.displayName || 'Super Boy',
        user.photoURL || undefined,
        bestScore,
        inventory.coins,
        zombiesDefeated
      );
    }
  } catch (error) {
    if (isOfflineOrUnavailable(error)) {
      // Offline mode: progress safely saved to local storage
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Load user game progress from Firestore with offline fallback
 */
export async function loadUserProgress(userId: string): Promise<FirebaseUserData | null> {
  const path = `users/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (snap.exists()) {
      const data = snap.data() as FirebaseUserData;
      try {
        localStorage.setItem(`${LOCAL_SAVE_PREFIX}${userId}`, JSON.stringify(data));
      } catch (e) {}
      return data;
    }
  } catch (error) {
    if (isOfflineOrUnavailable(error)) {
      // Fallback to local storage when backend is unavailable
      try {
        const cached = localStorage.getItem(`${LOCAL_SAVE_PREFIX}${userId}`);
        if (cached) {
          return JSON.parse(cached) as FirebaseUserData;
        }
      } catch (e) {}
      return null;
    }
    handleFirestoreError(error, OperationType.GET, path);
  }

  // Fallback to local cache if no cloud doc found
  try {
    const cached = localStorage.getItem(`${LOCAL_SAVE_PREFIX}${userId}`);
    if (cached) {
      return JSON.parse(cached) as FirebaseUserData;
    }
  } catch (e) {}

  return null;
}

/**
 * Update user record in the global high score leaderboard
 */
export async function updateLeaderboardEntry(
  userId: string,
  displayName: string,
  photoURL: string | undefined,
  bestScore: number,
  coins: number,
  zombiesDefeated: number
): Promise<void> {
  const path = `leaderboard/${userId}`;
  const entry: LeaderboardRecord = {
    userId,
    displayName: displayName.slice(0, 100),
    photoURL: photoURL ? photoURL.slice(0, 500) : undefined,
    bestScore: Math.floor(bestScore),
    coins: Math.floor(coins),
    zombiesDefeated: Math.floor(zombiesDefeated),
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'leaderboard', userId), entry, { merge: true });
  } catch (error) {
    if (isOfflineOrUnavailable(error)) {
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Fetch top ranked players from global leaderboard with offline resilience
 */
export async function getTopLeaderboard(maxCount: number = 20): Promise<LeaderboardRecord[]> {
  const path = 'leaderboard';
  try {
    const q = query(collection(db, 'leaderboard'), orderBy('bestScore', 'desc'), limit(maxCount));
    const snapshot = await getDocs(q);
    const results: LeaderboardRecord[] = [];
    snapshot.forEach((docSnap) => {
      results.push(docSnap.data() as LeaderboardRecord);
    });

    if (results.length > 0) {
      try {
        localStorage.setItem(LOCAL_LEADERBOARD_KEY, JSON.stringify(results));
      } catch (e) {}
    }

    return results;
  } catch (error) {
    if (isOfflineOrUnavailable(error)) {
      try {
        const cached = localStorage.getItem(LOCAL_LEADERBOARD_KEY);
        if (cached) {
          return JSON.parse(cached) as LeaderboardRecord[];
        }
      } catch (e) {}
      return [];
    }
    handleFirestoreError(error, OperationType.LIST, path);
  }
}
