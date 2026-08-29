import type { StateCreator } from "zustand";

export interface UserSlice {
  typoraMd: string;
  setTyporaMd: (v: string) => void;
  faceTimeImages: {
    [date: string]: string;
  };
  addFaceTimeImage: (v: string) => void;
  delFaceTimeImage: (k: string) => void;
}

export const createUserSlice: StateCreator<UserSlice> = (set) => ({
  typoraMd: `# Hi 👋\nA browser-based macOS-inspired desktop environment built with modern web technologies.`,
  setTyporaMd: (v) => set(() => ({ typoraMd: v })),
  faceTimeImages: {},
  addFaceTimeImage: (v) =>
    set((state: UserSlice) => ({
      faceTimeImages: {
        ...state.faceTimeImages,
        [+new Date()]: v
      }
    })),
  delFaceTimeImage: (k) =>
    set((state: UserSlice) => {
      const { [k]: _, ...remainingImages } = state.faceTimeImages;
      return { faceTimeImages: remainingImages };
    })
});
