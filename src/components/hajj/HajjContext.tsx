"use client";

import { createContext, use, useMemo, useReducer, type ReactNode } from "react";
import {
  DEFAULT_HAJJ,
  buildHajjJourney,
  hajjPlan,
  hajjRoute,
  normaliseHajj,
  pebblesNeeded,
  validateHajj,
  type HajjInput,
  type HajjIssue,
  type HajjPhase,
  type HajjPlan,
} from "@/lib/hajj/itinerary";

type Action = { type: "set"; field: keyof HajjInput; value: HajjInput[keyof HajjInput] } | { type: "reset" };

function reducer(state: HajjInput, action: Action): HajjInput {
  if (action.type === "reset") return DEFAULT_HAJJ;
  return { ...state, [action.field]: action.value };
}

type HajjState = {
  /** What the visitor typed (may be out of range while they type) */
  input: HajjInput;
  /** What the engine uses after clamping */
  itinerary: HajjInput;
  /** What the three answers work out to: days per city and the flight home */
  plan: HajjPlan;
  phases: HajjPhase[];
  issues: HajjIssue[];
  route: string;
  pebbles: number;
  set: <K extends keyof HajjInput>(field: K, value: HajjInput[K]) => void;
  reset: () => void;
};

const HajjContext = createContext<HajjState | null>(null);

/** Holds the "Plan the Hajj Journey" form and everything derived from it. */
export function HajjProvider({ children, initial = DEFAULT_HAJJ }: { children: ReactNode; initial?: HajjInput }) {
  const [input, dispatch] = useReducer(reducer, initial);

  const value = useMemo<HajjState>(() => {
    const itinerary = normaliseHajj(input);
    return {
      input,
      itinerary,
      plan: hajjPlan(itinerary),
      phases: buildHajjJourney(itinerary),
      issues: validateHajj(input),
      route: hajjRoute(itinerary),
      pebbles: pebblesNeeded(itinerary),
      set: (field, value) => dispatch({ type: "set", field, value }),
      reset: () => dispatch({ type: "reset" }),
    };
  }, [input]);

  return <HajjContext value={value}>{children}</HajjContext>;
}

export function useHajj() {
  const ctx = use(HajjContext);
  if (!ctx) throw new Error("useHajj must be used inside <HajjProvider>");
  return ctx;
}
