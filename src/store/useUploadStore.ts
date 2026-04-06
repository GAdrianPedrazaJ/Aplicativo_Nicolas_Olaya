import { create } from 'zustand'

type State = {
  uploading: boolean
  progress: number
  status: 'idle' | 'validating' | 'uploading' | 'success' | 'error'
  message: string | null
  setUploading: (v: boolean) => void
  setProgress: (p: number) => void
  setStatus: (s: State['status']) => void
  setMessage: (m: string | null) => void
  reset: () => void
}

export const useUploadStore = create<State>((set, get) => ({
  uploading: false,
  progress: 0,
  status: 'idle',
  message: null,
  setUploading: (v) => set({ uploading: v }),
  setProgress: (p) => set({ progress: p }),
  setStatus: (s) => set({ status: s }),
  setMessage: (m) => set({ message: m }),
  reset: () => {
    const self = get()
    self.setUploading(false)
    self.setProgress(0)
    self.setStatus('idle')
    self.setMessage(null)
  },
}))

