import React, { createContext, useContext, useRef, useMemo } from 'react';

type Entry = { address: string; value: any };

type DraftsAPI = {
  get: (address: string) => any;
  set: (address: string, value: any) => void;
  entries: (prefix?: string) => Entry[];
  clear: (prefix?: string) => void;
  has: (address: string) => boolean;
};

const DraftsContext = createContext<DraftsAPI | null>(null);

export const DraftsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const mapRef = useRef(new Map<string, any>());
  const [version, setVersion] = React.useState(0);
  
  const api = useMemo<DraftsAPI>(() => ({
    get: (address: string) => {
      // Access version to ensure reactivity
      version;
      return mapRef.current.get(address);
    },
    
    set: (address: string, value: any) => {
      mapRef.current.set(address, value);
      setVersion(v => v + 1); // Trigger re-render
    },
    
    entries: (prefix?: string) => {
      // Access version to ensure reactivity
      version;
      const out: Entry[] = [];
      for (const [address, value] of mapRef.current.entries()) {
        if (!prefix || address.startsWith(prefix)) {
          out.push({ address, value });
        }
      }
      return out;
    },
    
    clear: (prefix?: string) => {
      if (!prefix) {
        mapRef.current.clear();
        setVersion(v => v + 1);
        return;
      }
      let hasChanges = false;
      for (const address of Array.from(mapRef.current.keys())) {
        if (address.startsWith(prefix)) {
          mapRef.current.delete(address);
          hasChanges = true;
        }
      }
      if (hasChanges) {
        setVersion(v => v + 1);
      }
    },
    
    has: (address: string) => {
      // Access version to ensure reactivity
      version;
      return mapRef.current.has(address);
    }
  }), [version]);
  
  return (
    <DraftsContext.Provider value={api}>
      {children}
    </DraftsContext.Provider>
  );
};

export const useDrafts = () => {
  const ctx = useContext(DraftsContext);
  if (!ctx) {
    throw new Error('useDrafts must be used within a DraftsProvider');
  }
  return ctx;
};