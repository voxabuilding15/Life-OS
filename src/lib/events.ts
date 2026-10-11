type Listener = () => void;
const listeners = new Set<Listener>();

/** Tiny pub/sub so stores can announce local changes without importing the sync engine (avoids cycles). */
export const onLocalChange = (fn: Listener) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};
export const emitLocalChange = () => listeners.forEach((fn) => fn());
