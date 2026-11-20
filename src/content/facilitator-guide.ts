/**
 * The leaders' guides for the two boot camps, as written in the camp devotional books (Jewels Kids Boot Camp workbook and
 * Teen Boot Camp devotional). The wording is the church's own; only the layout is new.
 */
export type GuideCamp = "jewels" | "teen-life";

export type CampGuide = {
  camp: GuideCamp;
  /** The tab and the heading. */
  name: string;
  book: string;
  intro: string;
  culture: { title: string; lead?: string; points: { title: string; body: string }[] };
  watch: { title: string; lead: string; days: { day: string; theme: string; body: string; risk?: boolean }[] };
  session: { title: string; lead: string; steps: { time: string; name: string; length: string; body: string }[]; note?: string };
};

export const guides: Record<GuideCamp, CampGuide> = {
  jewels: {
    camp: "jewels",
    name: "Jewels Kids Boot Camp",
    book: "Jewels Kids Boot Camp workbook, Original Formation",
    intro: "Three quick pages for leading the Jewels Kids Boot Camp: the right culture, what to watch for each day, and a 60-minute session.",
    culture: {
      title: "How to create the right culture",
      lead: "The difference between a camp that informs and a camp that forms.",
      points: [
        { title: "Honesty before performance", body: "Kids perform by default: for approval, attention and acceptance. Your first job is to make honesty safer than performance. Go first. Share something real about yourself. Model vulnerability before you expect it from them." },
        { title: "Silence is formation", body: "When kids are journaling, do not fill the silence. Five minutes of actual quiet is more valuable than 15 minutes of extra content. Most kids have almost no experience of intentional silence. The discomfort is where formation happens." },
        { title: "Protect what kids share", body: "Establish clearly on Day 1: “What’s shared here stays here.” Uphold it. If a kid shares something vulnerable and someone laughs, address it immediately and gently. Make this rule sacred." },
        { title: "Don’t rescue too fast", body: "When a kid sits with a hard question, resist the urge to jump in with the answer. The discomfort of sitting with a real question is doing formation work. Let it work. Count to 10 silently before responding." },
        { title: "Follow up privately", body: "Some journal questions will surface real pain: family issues, identity struggles, loneliness, hard things at school. Have a plan for private follow-up. Know your referral resources before Day 1." },
      ],
    },
    watch: {
      title: "What to watch for, day by day",
      lead: "Each day’s content touches different tender places. Know before you lead.",
      days: [
        { day: "Day 1", theme: "Sapphire: Identity and comparison", body: "Watch for kids with severe anxiety about appearance or being left out. Comparison culture runs deep even at age 8. Some may need extra encouragement or follow-up." },
        { day: "Day 2", theme: "Emerald: Purpose and worth", body: "Watch for kids under extreme pressure from parents about grades or sports performance. “You’re not your grades” can land as relief or as conflict with what they hear at home. Tread gently." },
        { day: "Day 3", theme: "Ruby: Peer pressure", body: "Some kids may be in genuinely hard friend situations: bullying, exclusion, being pressured into meanness. Be prepared to follow up privately and involve parents if needed." },
        { day: "Day 4", theme: "Amethyst: The real you and masks", risk: true, body: "The highest-risk day. Journal question 2 (“What are you afraid for people to see?”) can surface real pain: family conflict, loneliness, hidden struggles. Have your referral chain ready. Reassure kids of privacy." },
        { day: "Day 5", theme: "Topaz: Service and significance", body: "Low pastoral risk, but watch for kids who are already over-scheduled with activities and need permission to rest, not more to do. Adjust the kindness challenge if needed." },
        { day: "Day 6", theme: "Diamond: Calling and send-off", body: "Some kids may feel overwhelmed by “calling” language, as if they are missing something specific. Emphasize that calling starts with faithfulness in ordinary things, not a dramatic mission. The commissioning is for ordinary life, not just ministry." },
      ],
    },
    session: {
      title: "A suggested 60-minute session",
      lead: "Adjust the timing to your group. The non-negotiables are journal time and the challenge commitment.",
      steps: [
        { time: "0:00", name: "Open", length: "5 min", body: "Recap yesterday’s challenge: “Who did it? What happened?” Open in prayer." },
        { time: "0:05", name: "Ice-breaker", length: "5 min", body: "One fun question connected to today’s theme. Get kids talking before teaching. Example for Day 1: “Show me with your hand, 1 to 5, how much time you spend on screens.”" },
        { time: "0:10", name: "Scripture", length: "5 min", body: "Read the day’s verse aloud. Ask: “What’s one word that stands out to you?” Let two or three kids answer briefly." },
        { time: "0:15", name: "Truth and real talk", length: "20 min", body: "Teach today’s truth and real talk. Use the kid analogies from the slides. Tell a personal story. Leave 5 minutes for kids’ questions." },
        { time: "0:35", name: "Journal time", length: "10 min", body: "Silent writing. No phones. Three questions; kids pick two. You write too. Take it seriously." },
        { time: "0:45", name: "Discussion", length: "10 min", body: "Share from journal responses: optional but encouraged. “Anyone willing to share what they wrote for Q1?” Never force sharing." },
        { time: "0:55", name: "Challenge and prayer", length: "5 min", body: "Read the challenge aloud. Commit to it together. Practise the memory verse together. Close in prayer; let a kid pray if they are willing." },
      ],
      note: "Non-negotiables: don’t cut journal time, and don’t skip the challenge. These two are where formation actually happens.",
    },
  },

  "teen-life": {
    camp: "teen-life",
    name: "Teen Boot Camp",
    book: "Teen Boot Camp devotional, Original",
    intro: "Everything you need to lead the Teen Boot Camp well: the right culture, what to watch for each day, and a 60-minute session.",
    culture: {
      title: "How to create the right culture",
      points: [
        { title: "Honesty before performance", body: "Teens perform by default: for approval, attention and acceptance. The first job of a facilitator is to make honesty safer than performance. Go first. Be real. Model vulnerability before expecting it." },
        { title: "Silence is formation", body: "When teens are journaling, do not fill the silence. Five minutes of actual quiet is more valuable than 15 minutes of additional content. Most teens have almost no experience of intentional silence." },
        { title: "Protect what people share", body: "Establish clearly on Day 1: “What’s shared here stays here.” Then uphold it. If a teen shares something vulnerable and someone laughs or dismisses it, address it immediately and gently." },
        { title: "Don’t rescue too fast", body: "When a teen sits with a hard question, resist the urge to jump in with the answer. The discomfort of sitting with a real question is doing formation work. Let it work." },
        { title: "Follow up privately", body: "Some journal questions will surface real pain: family issues, identity struggles, depression, abuse. Have a plan for private follow-up. Know your referral resources before Day 1." },
      ],
    },
    watch: {
      title: "What to watch for, day by day",
      lead: "Pastoral sensitivity: each day touches different tender places.",
      days: [
        { day: "Day 1", theme: "Identity and social media", body: "Watch for teens with severe anxiety around appearance or social status. The comparison culture runs deep. Some teens may need professional support beyond devotional content." },
        { day: "Day 2", theme: "Purpose", body: "Watch for teens who are under extreme academic pressure or parental performance expectations. “You are not your grades” can land as relief or as conflict with what they are told at home." },
        { day: "Day 3", theme: "Peer pressure", body: "Some teens may be in genuinely harmful peer situations: dangerous friendships, abusive relationships, or groups involved in illegal activity. Be prepared to follow up privately." },
        { day: "Day 4", theme: "The real you and masks", risk: true, body: "This is the highest-risk day pastorally. Identity questions can surface depression, gender confusion, family trauma or hidden abuse. Have your referral resources ready." },
        { day: "Day 5", theme: "Service", body: "Low pastoral risk, but watch for teens who are already overextended in service or ministry and need permission to rest, not add more." },
        { day: "Day 6", theme: "Generation and calling", body: "Some teens may feel overwhelmed by “calling” language, as if they are missing something specific. Emphasize that calling begins with faithfulness in the ordinary, not a dramatic calling experience." },
      ],
    },
    session: {
      title: "A suggested 60-minute session",
      lead: "The daily session flow.",
      steps: [
        { time: "0:00", name: "Open", length: "5 min", body: "Recap the challenge from the previous day: “Who did it? What happened?” Then open in prayer." },
        { time: "0:05", name: "Ice-breaker", length: "5 min", body: "One fun or honest warm-up question connected to the day’s theme. Get teens talking before teaching." },
        { time: "0:10", name: "Scripture", length: "5 min", body: "Read the day’s scripture aloud. Ask: “What’s one word or phrase that stands out to you?” Short responses." },
        { time: "0:15", name: "Truth and real talk", length: "20 min", body: "Teach the content from the Today’s Truth and Real Talk slides. Be direct. Use personal examples. Leave 5 minutes for questions." },
        { time: "0:35", name: "Journal time", length: "10 min", body: "Silent writing. No phones. Three questions. You write too. Take it seriously." },
        { time: "0:45", name: "Discussion", length: "10 min", body: "Share from journal responses: optional but encouraged. “Anyone willing to share what they wrote for Q1?”" },
        { time: "0:55", name: "Challenge and prayer", length: "5 min", body: "Read the challenge aloud. Commit to it together. Close in prayer, preferably led by one of the teens." },
      ],
    },
  },
};

export const guideCamps: GuideCamp[] = ["jewels", "teen-life"];
