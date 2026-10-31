export type VehicleId = "airplane" | "hiace" | "staria" | "sedan";

export const fleet: {
  id: VehicleId;
  name: string;
  category: string;
  capacity: string;
  text: string;
  features: string[];
  /** Real photos for the 360° viewer, in turning order (angle in degrees, 0 = front). */
  spin?: { src: string; angle: number }[];
}[] = [
  {
    id: "airplane",
    name: "Worldwide Air Travel",
    category: "Air ticketing",
    capacity: "All major airlines",
    text: "IATA licensed ticketing on domestic and international carriers — Lahore to Jeddah, Madinah and the world.",
    features: ["Direct & connecting flights", "Group fares", "Real-time updates"],
  },
  {
    id: "hiace",
    name: "Toyota Hiace",
    category: "Umrah group transport",
    capacity: "Up to 12 passengers",
    text: "Spacious and reliable for groups — airport transfers, Makkah–Madinah travel and ziyarat.",
    features: ["Air-conditioned", "Luggage space", "Experienced drivers"],
    spin: [0, 20, 30, 36, 44, 52, 60, 70, 115, 125, 145, 158, 180, 200, 212, 235, 245, 290, 300, 308, 316, 324, 330, 340].map((angle, i) => ({
      src: `/images/hiace-360/hiace-${String(i).padStart(2, "0")}.webp`,
      angle,
    })),
  },
  {
    id: "staria",
    name: "Hyundai Staria",
    category: "Premium family transport",
    capacity: "Up to 7 passengers",
    text: "A premium, comfortable ride for families who want privacy and extra comfort between the holy cities.",
    features: ["Lounge seating", "Panoramic windows", "Private transfers"],
  },
  {
    id: "sedan",
    name: "Executive Sedan",
    category: "Private transfers",
    capacity: "Up to 3 passengers",
    text: "Comfortable sedans for couples and small families — airport pick-ups and city travel.",
    features: ["Door-to-door", "Punctual service", "Comfortable ride"],
  },
];
