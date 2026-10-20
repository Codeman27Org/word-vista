export const APP_NAME = "Word Vista";
export const SAVE_KEY = "wordvista.save.v1";

export const MIN_WORD_LENGTH = 3;
export const MAX_WHEEL_LETTERS = 7;

export const START_COINS = 100;
export const HINT_COST = 25;
export const LEVEL_REWARD = 10;
export const PACK_REWARD = 50;
export const BONUS_GOAL = 10;
export const BONUS_REWARD = 25;

/** Shown for streak 2,3,4,5,6+ (index = min(streak, 6) - 2). */
export const STREAK_COMPLIMENTS = ["Good!", "Great!", "Awesome!", "Amazing!", "Outstanding!"] as const;
export const LEVEL_COMPLIMENTS = ["Splendid!", "Brilliant!", "Excellent!", "Fantastic!", "Superb!"] as const;

export const TIMES_OF_DAY = ["dawn", "day", "dusk", "night"] as const;
export const LEVELS_PER_PACK = 15;
