export interface Live365Channel {
  id: string;
  stationId: string;
  name: string;
  description: string;
  genre: string;
}

// Add more channels here as you create stations on Live365.
// Each channel maps to a Live365 station ID.
export const channels: Live365Channel[] = [
  {
    id: "deep-focus",
    stationId: "a69813",
    name: "Deep Focus",
    description: "Techno & electronic for heads-down work",
    genre: "Techno",
  },
  // Example for when you add more stations:
  // {
  //   id: "morning-compile",
  //   stationId: "aXXXXX",
  //   name: "Morning Compile",
  //   description: "Classic rock to start the day",
  //   genre: "Rock",
  // },
];
