// Combat is fiction. Experience links and achievements refer to Jackson's real work.
export const HEALTH = [[100,62],[92,62],[92,40],[58,40],[58,40],[1,40]];
const fight = (boss, level, moves, win, leave, achievement = '', subtitle = '') => ({
  boss, level, subtitle,
  moves: moves.map(([name, text, experience], i) => ({name, text, experience, actor:i % 2 ? 'boss' : 'jackson', hp:HEALTH[i]})),
  win: {name:win[0], text:win[1]}, leave:{name:leave[0], text:leave[1]}, achievement
});
export const FIGHTS = {
  allrounder: fight("The To Do List", "LV 99+", [
    ["Fix a Bike","He’s fixed plenty of bikes at Brocklebikes. This one works.",{"text":"From running Brocklebikes","href":"experience.html#p-bikes"}],
    ["Grow Three New Items",""],
    ["Bring the Run Club","He started a running society. They outnumber the list.",{"text":"Falmouth Running Society","href":"experience.html#p-runclub"}],
    ["Remember the Other Thing",""],
    ["Bake Something","This has become a different task."],
    ["Sunday Evening",""]
  ], ["Actually Finish One","The list is one item shorter."], ["Write a New List","The old one is technically defeated."],
  "", ""),
  master: fight("The Word Count", "LV 11,517", [
    ["Cut a Paragraph","He’s done this for two dissertations. It still makes sense.",{"text":"Dissertation work on redox flow batteries","href":"experience.html#p-redox"}],
    ["Over the Limit",""],
    ["Explain the Research","He’s written up a coating project before. This sentence can be shorter.",{"text":"Materials research with Finisterre","href":"experience.html#p-pfas"}],
    ["Reference Formatting","The afternoon is gone."],
    ["Read One Last Paper","There are more papers."],
    ["The Night Before the Deadline",""]
  ], ["Submit","11,517 words."], ["Move It to the Appendix","The Word Count accepts this."],
  "Submitted an 11,517 word dissertation.", ""),
  researcher: fight("The Forever Chemical", "LV ∞", [
    ["Dip, Pad and Cure","He coats cotton with the fluorine free finish he made.",{"text":"His coating project with Finisterre","href":"experience.html#p-pfas"}],
    ["Refuse to Leave","It’s still here."],
    ["Contact Angle","134° on coated cotton.",{"text":"Measured wetting and durability","href":"experience.html#p-pfas"}],
    ["Ask About Durability","Fair question."],
    ["Tilt the Sample","The small drop stays put.",{"text":"What didn’t work","href":"experience.html#p-pfas"}],
    ["Twenty Wash Cycles","The easy part is over."]
  ], ["Leave Out the Fluorine","The blob was not invited."], ["Write Up the Limitations","The caveats take up the rest of the screen."],
  "Developed a fluorine free water repellent coating on cotton. Tested through 20 wash cycles.", ""),
  builder: fight("Test Day", "", [
    ["Redirect the Flow","He tested a hydroturbine in a stream. The car goes backwards.",{"text":"Built and tested a hydroturbine","href":"experience.html#p-hydro"}],
    ["Radio Controlled Car","Heavier than it looked."],
    ["Borrow a Robot","His maze solving robot finds a way round.",{"text":"Built a maze solving robot","href":"experience.html#p-maze"}],
    ["The Glue Is Still Wet",""],
    ["Launch the Solar Boat","He’s raced a solar boat. There’s no water here.",{"text":"Designed, machined and raced a solar boat","href":"experience.html#p-solar"}],
    ["Full Load",""]
  ], ["The Fix","The bridge held the car."], ["Tape","It held, somehow."],
  "The bridge held the car, the only one in the group that did.", ""),
  operator: fight("The Knee", "", [
    ["Fit the Baseline","He fits a battery lifetime model. The start of the curve lines up.",{"text":"Battery lifetime modelling with Python and MATLAB","href":"experience.html#p-huawei"}],
    ["Turn the Corner",""],
    ["Model the Knee","He gives the bend its own term.",{"text":"Separating the fade from the knee","href":"experience.html#p-huawei"}],
    ["Try Another Condition","Less convincing now."],
    ["Automate It","He writes a script to save time. Now he’s debugging the script.",{"text":"Tools he made for himself","href":"experience.html#p-pocket"}],
    ["55°C","The prediction misses."]
  ], ["Separate the Fade From the Knee","The two effects get their own terms."], ["Plot the Residuals","At least the problem is visible."],
  "Battery lifetime modelling with Python and MATLAB.", "Battery life"),
  creator: fight("The Algorithm", "LV ???", [
    ["Jump Cut","He’s been editing his own videos for years.",{"text":"Making and editing his own films","href":"experience.html#p-film"}],
    ["Show It to Nobody",""],
    ["Post Again","He grew a TikTok account. Someone’s watching.",{"text":"His TikTok, @jacksontigerb","href":"experience.html#p-tiktok"}],
    ["Change the Rules","It hasn’t said which ones."],
    ["Film the Sunset","He forgot to watch it."],
    ["Swipe Away",""]
  ], ["The One That Went Viral","One TikTok reached 1.2 million views."], ["Log Off","The Algorithm has no power here."],
  "One TikTok reached 1.2 million views.", ""),
  rider: fight("Mile 23", "LV 26.2", [
    ["Steady Pace","He’s run the London Marathon. This pace is fine.",{"text":"Finished the London Marathon","href":"experience.html#p-marathon"}],
    ["The Wall",""],
    ["Bring the Run Club","He started Falmouth Running Society. They keep him going.",{"text":"Founded Falmouth Running Society","href":"experience.html#p-runclub"}],
    ["Cramp",""],
    ["Check the Distance","Still not there."],
    ["Keep Going","The finish has not moved."]
  ], ["GO TIGGY","He spotted the sign."], ["Walk a Bit","Still finished."],
  "Finished the London Marathon. Raised £1,647 for Marie Curie.", ""),
  wanderer: fight("The Baggage Allowance", "", [
    ["Pack Light","He’s packed for Senegal, the Dolomites and New York.",{"text":"Travelling and shooting on film","href":"experience.html#travel"}],
    ["Step on the Scales",""],
    ["Wear Every Layer","The bag is lighter and he’s too hot.",{"text":"The Dolomites, with a tent","href":"experience.html#p-dolomites"}],
    ["Fit It in the Frame",""],
    ["Explain That It Fitted Before","No effect."],
    ["Excess Fee",""]
  ], ["Made the Flight","The bag comes too."], ["Leave Something Behind","It hurt."],
  "Senegal, the Dolomites, New York and Perth. Hakuba next.", ""),
  skier: fight("The Last Chair", "", [
    ["Read the Mountain","He’s been skiing since he was three.",{"text":"On skis since age three","href":"experience.html#skiing"}],
    ["Whiteout",""],
    ["Keep Moving","He’s filmed runs like this before.",{"text":"Filming his own skiing","href":"experience.html#skiing"}],
    ["Lifts Closing",""],
    ["One More Turn","The camera is still running. He could have gone straight."],
    ["Last Chair","It’s leaving."]
  ], ["One More Run","Made it."], ["Hike It","Slower, but he gets there."],
  "On skis since he was three.", ""),
};
export const LOADOUT = {
  "allrounder": "Runs a bike repair business and started a running club.",
  "master": "Has written two dissertations and formatted a lot of references.",
  "researcher": "Made a fluorine free water repellent coating and put it through 20 wash cycles.",
  "builder": "Built a hydroturbine, a maze solving robot and a bridge that held.",
  "operator": "Models battery lifetime in Python and MATLAB.",
  "creator": "Films and edits his own videos. One TikTok reached 1.2 million views.",
  "rider": "Ran the London Marathon and started Falmouth Running Society.",
  "wanderer": "Has been to Senegal, the Dolomites, New York and Perth.",
  "skier": "Has been skiing since he was three, usually with a camera."
};
export const EMAIL = 'jackson.brocklebank.25@ucl.ac.uk';
export const LINKEDIN = 'https://www.linkedin.com/in/jacksontigerb';
export function mailHref(key) {
  const body = `Hi Jackson,\r\n\r\nI saw you taking on ${FIGHTS[key].boss} on your site and thought I’d say hello.\r\n\r\n`;
  return `mailto:${EMAIL}?subject=${encodeURIComponent('Sending backup')}&body=${encodeURIComponent(body)}`;
}
