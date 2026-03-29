import { create } from 'zustand'

interface UIState {
	sidebarOpen: boolean
	setSidebarOpen: (open: boolean) => void
	toggleSidebar: () => void
}

/**
 * Global UI state for layout-level concerns.
 * Kept separate from boardStore so non-board pages can still toggle the sidebar.
 */
export const useUIStore = create<UIState>()(set => ({
	sidebarOpen: false,
	setSidebarOpen: open => set({ sidebarOpen: open }),
	toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
}))
