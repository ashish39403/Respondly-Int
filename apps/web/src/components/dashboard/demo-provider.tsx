"use client";

import {
  createContext,
  useContext,
  useReducer,
  useState,
  useEffect,
  type Dispatch,
  type ReactNode,
} from "react";
import { demoReducer, type DemoAction, type DemoState } from "./demo-state";
import { createDemoState } from "./demo-data";

const DemoContext = createContext<{
  state: DemoState;
  dispatch: Dispatch<DemoAction>;
  logo: string | null;
  setLogo: (logo: string | null) => void;
} | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(demoReducer, undefined, createDemoState);
  const [logo, setLogo] = useState<string | null>(null);
  useEffect(
    () => () => {
      if (logo) URL.revokeObjectURL(logo);
    },
    [logo],
  );
  return (
    <DemoContext value={{ state, dispatch, logo, setLogo }}>
      {children}
    </DemoContext>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error("useDemo requires DemoProvider");
  return context;
}
