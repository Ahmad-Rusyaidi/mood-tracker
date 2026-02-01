const PROMPTS = [
  "How are you feeling today?",
  "How’s your heart right now?",
  "Checking in — how do you feel?",
  "What’s your mood today?",
  "How’s today treating you?",
];

export function getDailyPrompt(date: string) {
  // stable prompt per date
  let hash = 0;
  for (let i = 0; i < date.length; i++) {
    hash = (hash + date.charCodeAt(i)) % PROMPTS.length;
  }
  return PROMPTS[hash];
}
