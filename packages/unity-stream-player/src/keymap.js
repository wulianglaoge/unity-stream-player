// Minimal keymap: map common KeyboardEvent.code to indices
export const Keymap = new Proxy(
  {},
  {
    get: (_target, prop) => {
      // simple stable hash for key code
      const str = String(prop);
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
      }
      return hash % 110; // keep in range of KeyboardState.sizeInBits
    },
  },
);

