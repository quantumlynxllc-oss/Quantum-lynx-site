'use client';
import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Priority } from '@/lib/content';

const Context = createContext<{ priority: Priority; setPriority: (priority: Priority) => void } | null>(null);
export function PriorityProvider({ children, initialPriority = 'survey' }: { children: ReactNode; initialPriority?: Priority }) {
  const [priority, setPriority] = useState<Priority>(initialPriority);
  return <Context.Provider value={{ priority, setPriority }}>{children}</Context.Provider>;
}
export function usePriority() {
  const value = useContext(Context);
  if (!value) throw new Error('PriorityProvider is required');
  return value;
}
