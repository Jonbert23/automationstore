import { create } from 'zustand';

const useUIStore = create((set) => ({
  animations: [],
  
  // Start a new animation
  startAnimation: (startRect, imageSrc) => {
    const id = Date.now() + Math.random();
    set((state) => ({
      animations: [...state.animations, { id, startRect, imageSrc }]
    }));
  },

  // Remove an animation when it's done
  removeAnimation: (id) => {
    set((state) => ({
      animations: state.animations.filter((anim) => anim.id !== id)
    }));
  }
}));

export default useUIStore;
