// One place for everything about the nine games: the card on the select screen, the real
// project each one ends on, and how to load it. Game code loads only when a game starts.
export const EMAIL = 'jacksontiger2004@icloud.com';
export const LINKEDIN = 'https://www.linkedin.com/in/jacksontigerb';

export const GAMES = {
  allrounder: {
    title: 'Jackson’s decathlon.', line: 'Four quick events from things I actually do.', shows: 'My bike repair business, and the rest',
    blurb: 'Runs a bike repair business and started a running club.',
    load: () => import('./decathlon.mjs?v=3'),
  },
  master: {
    title: 'Term time.', line: 'Get every task to the right room before it storms off.', shows: 'Getting an MSc done',
    blurb: 'Has written two dissertations and formatted a lot of references.',
    load: () => import('./term.mjs?v=3'),
  },
  researcher: {
    title: 'Shed the rain.', line: 'Tilt my coated cotton so the rain rolls off.', shows: 'My PFAS free coating',
    blurb: 'Made a fluorine free water repellent coating and put it through 20 wash cycles.',
    load: () => import('./rain.mjs?v=3'),
  },
  builder: {
    title: 'Bridge the gap.', line: 'Build a balsa bridge, then send the car across.', shows: 'Building and testing prototypes',
    blurb: 'Built a hydroturbine, a maze solving robot and a bridge that held.',
    load: () => import('./bridge.mjs?v=3'),
  },
  operator: {
    title: 'Find the knee.', line: 'Call where a battery hits 70%, as early as you dare.', shows: 'Battery ageing models',
    blurb: 'Models battery lifetime in Python and MATLAB.',
    load: () => import('./knee.mjs?v=3'),
  },
  creator: {
    title: 'Get the shot.', line: 'Frame five moments and shoot at the right time.', shows: 'Filming and editing',
    blurb: 'Films and edits his own videos. One TikTok reached 1.2 million views.',
    load: () => import('./shot.mjs?v=3'),
  },
  rider: {
    title: 'Run club.', line: 'Gather runners and get the club through Mile 23.', shows: 'Starting a running club',
    blurb: 'Ran the London Marathon and started Falmouth Running Society.',
    load: () => import('./run.mjs?v=3'),
  },
  wanderer: {
    title: 'Route finder.', line: 'Pack light, then pick a route to the summit for sunrise.', shows: 'Planning a trip',
    blurb: 'Has been to Senegal, the Dolomites, New York and Perth.',
    load: () => import('./route.mjs?v=3'),
  },
  skier: {
    title: 'Last run.', line: 'Get down the mountain before the last chair goes.', shows: 'Skiing since I was three',
    blurb: 'Has been skiing since he was three, usually with a camera.',
    load: () => import('./ski.mjs?v=3'),
  },
};

// The real project at the end of each game. Facts come from experience.html.
export const EVIDENCE = {
  allrounder: {image: 'cards/brocklebikes-800.webp', alt: 'A bike on the repair stand in the garden', title: 'Brocklebikes', text: 'I started repairing bikes at sixteen and have fixed more than 495.', href: 'experience.html#p-bikes'},
  master: {image: 'sem-dispersed.jpg', alt: 'SEM image of surface modified titanium dioxide in finer clusters across the fibres', title: 'The MSc at UCL', text: 'My research year: the PFAS free coating project. Most of it was synthesis in the lab and a lot of hours on SEM, TEM, FTIR, XRD and XPS. This is one of my SEM images.', href: 'experience.html#education'},
  researcher: {image: 'pfas/c-a1-droplet.jpg', alt: 'A droplet on my C-A1 coated cotton in the goniometer', title: 'The coating in the lab', text: 'I made a fluorine free coating with Finisterre and tested how it shed water after washing and abrasion.', href: 'experience.html#p-pfas'},
  builder: {image: 'cards/bridge-800.webp', alt: 'Building our balsa bridge in the workshop with two teammates', title: 'The bridge from Test Day', text: 'I tested a small prototype and found it needed lateral support. Our finished bridge was the only one in the group to hold the car.', href: 'experience.html#p-bridge'},
  operator: {image: 'battery-illustration.svg', alt: 'Illustration of gradual battery capacity loss followed by a knee, not measured data', title: 'The battery model', text: 'I modelled gradual capacity loss and the later knee separately in Python. Across six held out conditions, mean error was 0.711 against a baseline of 1.000, with lower being better.', href: 'experience.html#p-huawei'},
  creator: {image: 'cards/tiktok-profile-800.webp', alt: 'My TikTok profile with 80.9 thousand followers in July 2026', title: 'My TikTok', text: 'I filmed, edited and posted the videos myself. One reached 1.2 million views.', href: 'experience.html#p-tiktok'},
  rider: {image: 'cards/runclub-street-800.webp', alt: 'Run club running down a pastel terraced street at dusk', title: 'Falmouth Running Society', text: 'I started the society in January 2024, set the routes, ran the socials and led the sessions myself. By June it was 25 runners a week.', href: 'experience.html#p-runclub'},
  wanderer: {image: 'cards/dolomites-lake-800.webp', alt: 'A backflip into an alpine lake in the Dolomites', title: 'The Dolomites', text: 'A few days camping, a sunrise hike and a backflip into a freezing lake.', href: 'experience.html#p-dolomites'},
  skier: {image: 'ski-pov.jpg', alt: 'A view down a piste while skiing', title: 'Out on the mountain', text: 'I’ve been skiing since I was three. I film runs as I go, and the clips on the portfolio are mine.', href: 'experience.html#skiing'},
};

export const stillFor = key => `assets/games/stills/${key}.webp`;
