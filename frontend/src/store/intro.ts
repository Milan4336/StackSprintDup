import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Boot intro store.
 *
 * KEY DESIGN:
 *  - `hasSeenBootIntro` is persisted — TRUE means "visited before, skip on reload".
 *    It starts as FALSE only on a brand-new browser (never visited).
 *    We NEVER reset it to false in storage — that caused the reload-replay bug.
 *
 *  - `pendingIntro` is NOT persisted — it lives in memory only.
 *    It is set to TRUE by Login.tsx right after a successful login.
 *    Dashboard reads it and plays the animation, then clears it.
 *    On any page reload the in-memory flag is gone → no replay.
 */
interface IntroState {
  hasSeenBootIntro: boolean;  // persisted: "user has visited before"
  isBootIntroActive: boolean; // in-memory: animation is currently playing
  pendingIntro: boolean;      // in-memory: login just happened, play on next render
  hasHydrated: boolean;
  shouldPlayBootIntro: () => boolean;
  startBootIntro: () => void;
  completeBootIntro: () => void;
  setPendingIntro: (v: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useIntroStore = create<IntroState>()(
  persist(
    (set, get) => ({
      hasSeenBootIntro: false,
      isBootIntroActive: false,
      pendingIntro: false,
      hasHydrated: false,

      // Play if hydrated AND a fresh login just set pendingIntro
      shouldPlayBootIntro: () =>
        get().hasHydrated && get().pendingIntro && !get().isBootIntroActive,

      startBootIntro: () => set({ isBootIntroActive: true, pendingIntro: false }),
      completeBootIntro: () =>
        set({ isBootIntroActive: false, hasSeenBootIntro: true }),

      setPendingIntro: (v) => set({ pendingIntro: v }),
      setHydrated: (hydrated) => set({ hasHydrated: hydrated }),
    }),
    {
      name: 'fraud-boot-intro',
      storage: createJSONStorage(() => localStorage),
      // Only persist the "seen" flag — pendingIntro and isBootIntroActive are session-only
      partialize: (state) => ({ hasSeenBootIntro: state.hasSeenBootIntro }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
