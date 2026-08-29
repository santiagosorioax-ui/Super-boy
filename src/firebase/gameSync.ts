import { doc, getDoc, setDoc, getDocs, collection, query, orderBy, limit } from 'firebase/firestore';
import { db, auth } from './config';
import { handleFirestoreError, OperationType } from './errorHandling';
import { PlayerInventory } from '../types';

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

/**
 * Save user game progress and stats to their private document in Firestore
 */
export async function saveUserProgress(
  bestScore: number,
  inventory: PlayerInventory,
  zombiesDefeated: number
): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  const path = `users/${user.uid}`;
  try {
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
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'users', user.uid), payload, { merge: true });

    // Also update public leaderboard if score > 0
    if (bestScore > 0) {
      await updateLeaderboardEntry(user.uid, user.displayName || 'Super Boy', user.photoURL || undefined, bestScore, inventory.coins, zombiesDefeated);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Load user game progress from Firestore
 */
export async function loadUserProgress(userId: string): Promise<FirebaseUserData | null> {
  const path = `users/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (snap.exists()) {
      return snap.data() as FirebaseUserData;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
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
  try {
    const entry: LeaderboardRecord = {
      userId,
      displayName: displayName.slice(0, 100),
      photoURL: photoURL ? photoURL.slice(0, 500) : undefined,
      bestScore: Math.floor(bestScore),
      coins: Math.floor(coins),
      zombiesDefeated: Math.floor(zombiesDefeated),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'leaderboard', userId), entry, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Fetch top ranked players from global leaderboard
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
    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}
