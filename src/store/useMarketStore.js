import { create } from 'zustand'

const useMarketStore = create((set) => ({
  marketRecords: [],
  setMarketRecords: (records) => set({ marketRecords: records }),
}))

export default useMarketStore
