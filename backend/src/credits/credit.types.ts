/**
 * Credits - placeholder types.
 *
 * TODO(credits): decide how the credit system shows up in the product
 * (where the balance is displayed, what an action costs, what happens when
 * the balance hits zero) BEFORE implementing storage for real.
 * MongoDB is already in docker-compose.yml (MONGODB_URI in .env) for the
 * eventual persistence.
 */

/** Why credits moved in or out of an account. */
export type CreditGrantReason =
  | 'signup_bonus'
  | 'daily_bonus'
  | 'action_spend'
  | 'admin_adjustment';

export interface CreditBalance {
  userId: string;
  balance: number;
  /** Last time the daily bonus was granted - used to rate-limit to once a day. */
  lastDailyBonusAt: string | null;
  updatedAt: string;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  /** Positive = credits added, negative = credits spent. */
  amount: number;
  reason: CreditGrantReason;
  createdAt: string;
}

/** Bonus credits a new account starts with. */
export const SIGNUP_BONUS_CREDITS = 10;

/** Free credits granted once per day. */
export const DAILY_BONUS_CREDITS = 5;

/** Actions not yet priced - TODO(credits): attach a cost per action. */
export interface CreditCosts {
  chatMessage: number;
  roast: number;
  match: number;
}
