// A fixed snapshot of each owner's actual 2025-season Yahoo roster, transcribed
// by hand from roster screenshots and cross-checked against Sleeper's live
// player data for spelling. This replaces the old randomly-generated test
// data so that repeated local testing works against the same real teams and
// rosters every time, instead of a fresh batch of fake names on every click.
//
// Order here becomes the default draft order when loaded — Robin can still
// reorder on the Draft Order tab afterward, this is just a starting point.
//
// Keyed by OWNER, not team name. Owners rename their teams during the season,
// so a team name is a moving target across years while the ten people are not.
// Each entry keeps its 2025 team name in a trailing comment purely so these
// rosters can still be traced back to the original screenshots.
export interface Roster2025 {
  /** The owner's name — see the note above on why this isn't the team name. */
  ownerName: string;
  players: string[];
}

export const ROSTERS_2025: Roster2025[] = [
  {
    ownerName: "Paul", // 2025 team name: The Paulyators
    players: [
      "Tyler Shough", "Brady Cook", "George Pickens", "Justin Jefferson", "Kyle Williams",
      "Kyren Williams", "Christian McCaffrey", "Darren Waller", "Ricky Pearsall", "Breece Hall",
      "Taysom Hill", "Adonai Mitchell", "Rashee Rice", "Patrick Mahomes", "Jayden Daniels",
      "Bhayshul Tuten", "Garrett Wilson", "Cam Skattebo", "Tyler Loop", "Lions",
    ],
  },
  {
    ownerName: "Mark G", // 2025 team name: Action Jaxon
    players: [
      "Max Brosmer", "Josh Johnson", "Jaxon Smith-Njigba", "Chris Olave", "Tre Tucker",
      "Travis Etienne Jr.", "Bucky Irving", "Colby Parkinson", "Wan'Dale Robinson", "Kyle Monangai",
      "Jayden Reed", "Jayden Higgins", "Woody Marks", "Rico Dowdle", "Jordan Love",
      "J.J. McCarthy", "Tucker Kraft", "Travis Hunter", "Ka'imi Fairbairn", "Patriots",
    ],
  },
  {
    ownerName: "Mark Sr", // 2025 team name: The Chase Hurts
    players: [
      "Josh Allen", "Jalen Hurts", "CeeDee Lamb", "Ja'Marr Chase", "Amon-Ra St. Brown",
      "Jonathan Taylor", "RJ Harvey", "Colston Loveland", "Jordan Addison", "Jaxson Dart",
      "Emeka Egbuka", "TreVeyon Henderson", "Tyler Warren", "Zach Charbonnet", "Tanner McKee",
      "Malik Willis", "Justin Fields", "Devin Neal", "Cameron Dicker", "Eagles",
    ],
  },
  {
    ownerName: "Vince", // 2025 team name: Buck Donuts
    players: [
      "Jacoby Brissett", "Tyler Huntley", "Michael Wilson", "A.J. Brown", "DJ Moore",
      "Saquon Barkley", "Josh Jacobs", "Jake Ferguson", "Jauan Jennings", "Philip Rivers",
      "Kenneth Walker III", "DK Metcalf", "Mac Jones", "Joe Flacco", "Anthony Richardson Sr.",
      "Rachaad White", "Lamar Jackson", "Daniel Jones", "Cam Little", "Steelers",
    ],
  },
  {
    ownerName: "Phil", // 2025 team name: Brocked Up
    players: [
      "Baker Mayfield", "Caleb Williams", "Terry McLaurin", "Courtland Sutton", "Nico Collins",
      "Michael Carter", "Kenny Gainwell", "Oronde Gadsden", "Alec Pierce", "Kirk Cousins",
      "Marvin Harrison Jr.", "Brock Bowers", "David Montgomery", "Trey Benson", "Jacory Croskey-Merritt",
      "Chuba Hubbard", "Michael Penix Jr.", "Malik Nabers", "Chase McLaughlin", "Rams",
    ],
  },
  {
    ownerName: "Tee", // 2025 team name: Hock-TUA
    players: [
      "Matthew Stafford", "Sam Darnold", "Puka Nacua", "Tetairoa McMillan", "Mike Evans",
      "Jaylen Warren", "Dylan Sampson", "Mike Gesicki", "T.J. Hockenson", "Aaron Jones Sr.",
      "Alvin Kamara", "Khalil Shakir", "Tua Tagovailoa", "Xavier Worthy", "Jameis Winston",
      "Joe Milton III", "Quinshon Judkins", "Tyreek Hill", "Eddy Pineiro", "Buccaneers",
    ],
  },
  {
    ownerName: "Jason", // 2025 team name: Cafe
    players: [
      "Dak Prescott", "Geno Smith", "Chris Godwin Jr.", "Jameson Williams", "Luther Burden III",
      "D'Andre Swift", "Tony Pollard", "Trey McBride", "Drake London", "Brock Purdy",
      "Jerry Jeudy", "Rhamondre Stevenson", "Blake Corum", "Brandon Aiyuk", "Jawhar Jordan",
      "Michael Mayer", "Chris Rodriguez Jr.", "Kyler Murray", "Andy Borregales", "Broncos",
    ],
  },
  {
    ownerName: "Robin", // 2025 team name: Five Yards a Carry
    players: [
      "C.J. Stroud", "Bryce Young", "Jaylen Waddle", "Deebo Samuel", "Jalen Coker",
      "Bijan Robinson", "James Cook III", "Kyle Pitts Sr.", "Zay Flowers", "Aaron Rodgers",
      "Ashton Jeanty", "Shedeur Sanders", "Quentin Johnston", "Spencer Rattler", "Rome Odunze",
      "Quinn Ewers", "Tyler Allgeier", "Calvin Ridley", "Erick All Jr.", "Brandon Aubrey",
    ],
  },
  {
    ownerName: "Christian", // 2025 team name: Yang Hansen
    players: [
      "Trevor Lawrence", "Drake Maye", "Jakobi Meyers", "Stefon Diggs", "Brian Thomas Jr.",
      "Jahmyr Gibbs", "De'Von Achane", "Dallas Goedert", "Darius Slayton", "Javonte Williams",
      "Christian Watson", "Cam Ward", "Tyrone Tracy Jr.", "Brian Robinson", "Davante Adams",
      "Darnell Mooney", "George Kittle", "Dalton Kincaid", "Jason Myers", "Jaguars",
    ],
  },
  {
    ownerName: "Mark Jr", // 2025 team name: tHe pEnNy tRaDeRs
    players: [
      "Jared Goff", "Justin Herbert", "Ladd McConkey", "DeVonta Smith", "Tee Higgins",
      "Derrick Henry", "Chase Brown", "Brenton Strange", "Isaac TeSlaa", "Joe Burrow",
      "Harold Fannin Jr.", "Michael Pittman Jr.", "Pat Bryant", "Kayshon Boutte", "Bo Nix",
      "Omarion Hampton", "Sam LaPorta", "Chris Boswell", "Texans",
    ],
  },
];
