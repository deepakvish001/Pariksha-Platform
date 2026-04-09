import { Section } from "./dsaLevel1Types";
import { juniorTrainingSections } from "./juniorTrainingData";
import { juniorTrainingBSections } from "./juniorTrainingBData";
import { juniorTrainingC1Sections } from "./juniorTrainingC1Data";
import { juniorTrainingC2Sections } from "./juniorTrainingC2Data";
import { juniorTrainingD1Sections } from "./juniorTrainingD1Data";
import { juniorTrainingD2Sections } from "./juniorTrainingD2Data";
import { juniorTrainingD3Sections } from "./juniorTrainingD3Data";

const wrapSheet = (
  label: string,
  title: string,
  sections: Section[]
): Section => ({
  id: `acm-${label}-main`,
  title,
  subSections: sections.flatMap((s) => s.subSections),
});

export const acmIcpcSections: Section[] = [
  wrapSheet("a", "Level 1 — Warm-up & Fundamentals", juniorTrainingSections),
  wrapSheet("b", "Level 2 — Core Techniques", juniorTrainingBSections),
  wrapSheet("c1", "Level 3 — Problem Solving I", juniorTrainingC1Sections),
  wrapSheet("c2", "Level 4 — Problem Solving II", juniorTrainingC2Sections),
  wrapSheet("d1", "Level 5 — Advanced Algorithms I", juniorTrainingD1Sections),
  wrapSheet("d2", "Level 6 — Advanced Algorithms II", juniorTrainingD2Sections),
  wrapSheet("d3", "Level 7 — Expert Challenges", juniorTrainingD3Sections),
];

export const acmIcpcMeta = {
  id: "acm-icpc-training",
  title: "ACM-ICPC Competitive Programming Sheet",
  description: "1153 problems across 7 levels (A→D3) — Codeforces, UVA, SPOJ & more.",
  lastUpdated: "April 9, 2026",
  totalProblems: 1153,
  completed: 0,
  easy: 378,
  medium: 329,
  hard: 446,
};

export const acmIcpcFaqs = [
  {
    question: "What are the sheet requirements? Should I study algorithms and Data structures?",
    answer:
      "ONLY programming skills (e.g. Programming 1 level). It is highly advised to implement 2-3 projects. NO for OOP. NO for data structures, but learn STL (or Collections in Java/C#). NO for algorithms — the sheet will teach you that in a smooth way. For C++ guys: watch the first 18 videos here → youtube.com/playlist?list=PLPt2dINI2MIZPFq6HyUB1Uhxdh1UDnZMS",
  },
  {
    question: "How much time do I need to finish the sheet?",
    answer:
      "It varies. The sheet has ~900 problems and ~60 videos. Rough estimates by level: 215 problems ≤2.5 (avg 20 min), 93 ≤3.5 (avg 30 min), 270 ≤4.5 (avg 40 min), 178 ≤5.25 (avg 60 min), 127 ≤5.75 (avg 75 min), 53 >5.75 (avg 90 min). Total ≈ 700–900 hours. Practical limit ≈ 1300 hours. You're encouraged to skip problems you find easy (20–30% can be skipped).",
  },
  {
    question: "How many problems to solve per day?",
    answer:
      "Decide the number of hours weekly and cover them. Don't use problem count as a measure.",
  },
  {
    question: "When should I give up and check the editorials?",
    answer:
      "Struggle for a reasonable time first. Check ask.fm/mostafasaad87/answers/144907000290 for detailed advice on when to move on.",
  },
  {
    question: "Got WA — should I check the test cases directly?",
    answer:
      "No. Remember in a real contest you only know your status (WA, TLE, etc). Struggle to find the wrong case by yourself for at least 15-30 minutes. If you can write a brute-force solution, build a stress test to generate random cases and compare.",
  },
  {
    question: "What is the debug time?",
    answer:
      "Once you finish coding and start testing, you verify if the program works as expected. From that moment till getting AC = debugging time. Use print statements or, better, a debugger.",
  },
  {
    question: "Should I solve every problem?",
    answer:
      "Generally yes, but if a level feels easy (solve within 15 min), skip a block. This jumping applies mainly to Codeforces problems.",
  },
  {
    question: "About UVA — can I skip UVA and solve only Codeforces?",
    answer:
      "Many juniors find UVA problems harder. You can finish CF problems first for Div2-A/B, but following the order is better. UVA has important problems not found elsewhere. For debugging UVA, Google solutions (e.g. 'UVA 10110 filetype:cpp'), use uDebug, or get an AC solution for stress testing.",
  },
  {
    question: "Is using C# ok?",
    answer:
      "Generally yes, but C# is not supported on UVA. For such problems write your code but heavily test it. Learning basic C++ + STL is not hard for C#/Java devs. C++/Java/Python are official in UVA; Codeforces allows more languages.",
  },
  {
    question: "When I watch a video, should I solve the problems in its info section?",
    answer:
      "No. The sheet already has a subset of those problems in a specific order. The sheet is self-contained.",
  },
  {
    question: "I watched the video but it is hard, any tips?",
    answer:
      "Algorithms are hard — learn to struggle. Watch the video 2-3 times. Try to rewrite its code by yourself. Still stuck? Google for more materials (PPT/PDF/videos). In worst case, leave it for now and return later.",
  },
  {
    question: "How does this sheet prepare for ECPC/ACPC?",
    answer:
      "The sheet prepares you to reach level 5–5.5/10 in several categories. A team of 3 who solved the whole sheet may rank in the top 15. Success depends on many factors: solving quality problems, improving different skills (reading, thinking, coding, accuracy), healthy training habits, stress management, and team dynamics.",
  },
  {
    question: "How different is this sheet versus Ahmed Aly Ladders?",
    answer:
      "Ladders select problems automatically with no personal investigation. This sheet mixes automated and manual selection with algorithm videos in order. It's not blocking style — if you can't solve a problem, move to the next one.",
  },
  {
    question: "Are problems really sorted by easiness?",
    answer:
      "Yes, but sorting is subjective. No one can give you a list where every problem for YOU is easier than the next. Problems are ordered by people's average. The promise is: problems will be within your range to solve.",
  },
  {
    question: "Topics-based training vs Blind Order?",
    answer:
      "In topics training you master one algorithm deeply, but lose practice discovering which algorithm to use. This sheet uses blind style: you solve 3-5 per topic, then discover the rest. Topics training may help you improve faster early, but you may get stuck sooner.",
  },
  {
    question: "What is after the sheet?",
    answer:
      "There are 2 more levels, each ~1000 problems (semi-senior and senior level). Region stars typically solve 2000-3000 problems. After finishing this sheet, you can move to supervised next-level training.",
  },
  {
    question: "Is it normal to re-solve a problem and make the same mistakes?",
    answer: "Yes, it happens a lot.",
  },
  {
    question: "Should I re-solve problems I already solved?",
    answer:
      "No, always solve new problems. Revise your notes on lessons you learned from past problems.",
  },
];

export interface ChecklistCategory {
  title: string;
  items: string[];
}

export const acmIcpcChecklist: ChecklistCategory[] = [
  {
    title: "Reading",
    items: [
      "Read within 3-5 minutes for short text problem. If no, you need to work on your Reading English Skills.",
      "Never suspect later your problem understanding? If happens, you need to improve your comprehension / case tracing.",
    ],
  },
  {
    title: "Thinking",
    items: [
      "Ready and in the challenging mood before start solving.",
      "Striving against the problem for a reasonable time. If no, you need to change your solving spirit. Be a fighter.",
      "Found a solution? Do verifications: test cases / extra cases / correctness / time & memory.",
    ],
  },
  {
    title: "Coding",
    items: [
      "Sketch in your mind the big picture of the code first. Don't rush for coding.",
      "Code within 10 minutes. If more, you have coding skills problem or your understanding for the approach is not complete.",
      "A lot of copy paste? Something wrong. Need a better code organization.",
      "Needed more than 10 minutes to code medium-size codes? Why? Identify the issue and solve it.",
    ],
  },
  {
    title: "Debugging",
    items: [
      "Which will be faster to catch the mistake? Printing or Debugger?",
      "Don't know how to use a debugger? Learn this skill.",
      "Needed more than 10 minutes to solve bugs? Something is wrong. Why need all this time?",
    ],
  },
  {
    title: "Code is ready!",
    items: [
      "Just submit and see if passed? Wrong. Behave as if you are in a real contest. Are you almost sure it will be AC? If yes, submit.",
      "TRAIN offline as if you are in a real contest. This shortens the gap between training and the real contest.",
    ],
  },
  {
    title: "Code Failed :(",
    items: [
      "Are you nervous / frustrated? Yes → Wrong behavior. Take it easy.",
      "Rush to test cases? Yes → Wrong. Revise idea, then code, then trace more samples. Try for 15 minutes or more first.",
    ],
  },
  {
    title: "Got it AC",
    items: [
      "Read and understood editorial solutions?",
      "Checked 1-3 other AC solutions?",
      "Tried to write a much shorter version of your code?",
      "Tried to write a faster code (better complexity)?",
    ],
  },
  {
    title: "Speed",
    items: [
      "How much time do you need in Div2-A/Div2-B? Target (5, 10) min for semi-seniors, (3, 6) for seniors.",
      "Not that fast? You need regular speed training on easy problems.",
    ],
  },
  {
    title: "Weekly Contests",
    items: [
      "Do you participate in 1-2 contests per week at least? If no, this is bad. Offline training ≠ Online contests.",
      "Train yourself to behave in online contests similar to offline training. This is an important skill.",
    ],
  },
  {
    title: "Sheet Stats",
    items: [
      "Recorded them? Read your problem's row. Where do you consume the most time? These are your weak skills.",
      "Not recording? How will you know your weak points?!",
      "Can't record timing as you mix thinking with coding? Wrong behavior — finish thinking, then move to coding.",
    ],
  },
  {
    title: "Training Time",
    items: [
      "Is it regular and scheduled? Yes → you will have regular improvements.",
      "Your plan was to train X hours. Did you? If no, why?",
      "Without regular and continuous training, your mind might not improve well.",
    ],
  },
  {
    title: "Psychological Issues",
    items: [
      "Do you keep comparing yourself with others?",
      "Do you have negative feelings? Like 'I am stupid, I am hopeless, I will never have a comparable level'?",
      "Do you think of your image if you fail in online contests, so you avoid contests?",
      "Do you use another account to train so people don't know your progress/failure?",
      "Do you wish your friends fail, or get annoyed with their better performance?",
      "Do you avoid teaching friends to remain better than them?",
      "Do you feel bored/frustrated due to no/weak community in your college?",
      "Do you keep training day and night without breaks and no socialization?",
      "Do you hate specific topics and avoid them (probability/geometry)?",
      "'Should I stop' dilemma? Keep thinking is it worth vs a waste of time?",
      "If any of the above is YES, you probably have a problem and need to find a solution.",
    ],
  },
];
