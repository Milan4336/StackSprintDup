import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiState {
    isSidebarCollapsed: boolean;
    isExecutiveMode: boolean;
    toggleSidebar: () => void;
    toggleExecutiveMode: () => void;
}

export const useUiStore = create<UiState>()(
    persist(
        (set) => ({
            isSidebarCollapsed: false,
            isExecutiveMode: false,
            toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
            toggleExecutiveMode: () => set((state) => ({ isExecutiveMode: !state.isExecutiveMode })),
        }),
        {
            name: 'fraud-console-ui-state',
        }
    )
);
