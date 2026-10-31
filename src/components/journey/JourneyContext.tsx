"use client";

import { createContext, use, useMemo, useReducer, type ReactNode } from "react";
import {
  DEFAULT_ITINERARY,
  allowsSecondMakkah,
  buildJourney,
  normaliseItinerary,
  routeSummary,
  totalDays,
  umrahCount,
  validateItinerary,
  type ItineraryInput,
  type ItineraryIssue,
  type JourneyPhase,
} from "@/lib/journey/itinerary";

type Action =
  | { type: "set"; field: keyof ItineraryInput; value: ItineraryInput[keyof ItineraryInput] }
  | { type: "reset" };

function reducer(state: ItineraryInput, action: Action): ItineraryInput {
  if (action.type === "reset") return DEFAULT_ITINERARY;
  return { ...state, [action.field]: action.value };
}

type JourneyState = {
  /** What the visitor typed (may be out of range while they type) */
  input: ItineraryInput;
  /** What the engine uses after clamping and dropping fields that don't apply */
  itinerary: ItineraryInput;
  phases: JourneyPhase[];
  issues: ItineraryIssue[];
  route: string;
  days: number;
  umrahs: number;
  secondMakkahAvailable: boolean;
  set: <K extends keyof ItineraryInput>(field: K, value: ItineraryInput[K]) => void;
  reset: () => void;
};

const JourneyContext = createContext<JourneyState | null>(null);

/** Holds the itinerary form and everything derived from it, for the whole /umrah-journey page. */
export function JourneyProvider({ children, initial = DEFAULT_ITINERARY }: { children: ReactNode; initial?: ItineraryInput }) {
  const [input, dispatch] = useReducer(reducer, initial);

  const value = useMemo<JourneyState>(() => {
    const itinerary = normaliseItinerary(input);
    return {
      input,
      itinerary,
      phases: buildJourney(itinerary),
      issues: validateItinerary(input),
      route: routeSummary(itinerary),
      days: totalDays(itinerary),
      umrahs: umrahCount(itinerary),
      secondMakkahAvailable: allowsSecondMakkah(itinerary),
      set: (field, value) => dispatch({ type: "set", field, value }),
      reset: () => dispatch({ type: "reset" }),
    };
  }, [input]);

  return <JourneyContext value={value}>{children}</JourneyContext>;
}

export function useJourney() {
  const ctx = use(JourneyContext);
  if (!ctx) throw new Error("useJourney must be used inside <JourneyProvider>");
  return ctx;
}
