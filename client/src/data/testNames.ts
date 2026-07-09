// Fake-but-plausible NFL-style name generator used by the "Fill with test data"
// button on the Protected Players setup tab. Transliterated verbatim from
// intuti-draft-prototype.html. Per HANDOFF.md Section 4, this should eventually
// pull real random players from Sleeper's database once connected — for now it
// stays as the generated-name placeholder.

export const TEST_FIRST = [
  "Patrick","Josh","Lamar","Jalen","Joe","Justin","Dak","Trevor","Tua","Jordan",
  "Brock","Kyler","Derek","Geno","Baker","Sam","Mac","Kenny","Deshaun","Russell",
  "Kirk","Daniel","Carson","Jimmy","Ryan","Taylor","Saquon","Derrick","Dalvin","Nick",
  "Alvin","Austin","Miles","Tony","Aaron","Ezekiel","David","James","Dameon","Rachamel",
  "Travis","Tyreek","Davante","Stefon","Jaylen","Cooper","Deebo","Ja'Marr","Mike","Justin",
  "CeeDee","Amari","Keenan","Chris","DeAndre","Tee","Brandin","Diontae","Allen","Tyler",
  "Mark","Dallas","Evan","George","Pat","Cole","Darren","Hunter","Kyle","Zach",
  "Gerald","Logan","Marquise","Kadarius","Jamison","Elijah","Christian","Noah","Isaiah","Adam",
  "Robert","Cole","Irv","Dawson",
];

export const TEST_LAST = [
  "Mahomes","Allen","Jackson","Hurts","Burrow","Herbert","Prescott","Lawrence","Tagovailoa","Love",
  "Purdy","Murray","Carr","Smith","Mayfield","Darnold","Jones","Pickett","Watson","Wilson",
  "Cousins","Jones","Wentz","Garoppolo","Tannehill","Hill","Barkley","Henry","Cook","Chubb",
  "Kamara","Ekeler","Sanders","Pollard","Jones","Elliott","Montgomery","Conner","Pierce","White",
  "Kelce","Hill","Adams","Diggs","Waddle","Kupp","Samuel","Chase","Evans","Jefferson",
  "Lamb","Cooper","Allen","Godwin","Hopkins","Higgins","Cooks","Johnson","Robinson","Waller",
  "Goedert","Frey","McBride","Freiermuth","Hockenson","Smith","Hurst","Tonyan","Thomas","Andrews",
  "Gesicki","Moore","Wilson","Wyatt","Moore","Hill","McLaurin","London","St.Brown","Thielen",
  "Lazard","Tonyan",
];

/** Generate one random plausible name not already present in `used`. Mutates `used`. */
export function randPlayerName(used: Set<string>): string {
  let name = "";
  let attempts = 0;
  do {
    const f = TEST_FIRST[Math.floor(Math.random() * TEST_FIRST.length)];
    const l = TEST_LAST[Math.floor(Math.random() * TEST_LAST.length)];
    name = `${f} ${l}`;
    attempts++;
  } while (used.has(name) && attempts < 200);
  used.add(name);
  return name;
}
