import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';

/** Offline-first persistence for every store. */
export const persistStorage = createJSONStorage(() => AsyncStorage);
