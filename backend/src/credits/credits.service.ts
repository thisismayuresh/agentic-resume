import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { InsufficientCreditsError } from '@app/shared';
import type {
  CreditBalance,
  CreditGrantReason,
  CreditTransaction,
} from './credit.types';
import {
  DAILY_BONUS_CREDITS,
  SIGNUP_BONUS_CREDITS,
} from './credit.types';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Dummy credits ledger - in-memory only.
 *
 * TODO(credits): before wiring this into real flows, decide (1) what costs
 * credits, (2) where the balance is shown in the UI, (3) the daily-bonus
 * UX (pop-up? automatic?), and (4) the MongoDB schema - MONGODB_URI is
 * already in .env and mongodb is in docker-compose.yml.
 */
@Injectable()
export class CreditsService {
  // TODO(credits): replace with MongoDB once the schema is designed.
  private readonly balances = new Map<string, CreditBalance>();
  private readonly transactions: CreditTransaction[] = [];

  /** TODO(credits): call this on the real signup flow - not wired yet. */
  grantSignupBonus(userId: string): CreditBalance {
    return this.grant(userId, SIGNUP_BONUS_CREDITS, 'signup_bonus');
  }

  /** Grants the daily bonus at most once per 24h. */
  grantDailyBonus(userId: string): CreditBalance {
    const balance = this.balanceOf(userId);
    const lastGrant = balance.lastDailyBonusAt
      ? Date.parse(balance.lastDailyBonusAt)
      : 0;
    const elapsed = Date.now() - lastGrant;

    if (elapsed < ONE_DAY_MS) {
      return balance;
    }

    const updated = this.grant(userId, DAILY_BONUS_CREDITS, 'daily_bonus');
    updated.lastDailyBonusAt = new Date().toISOString();
    return updated;
  }

  balanceOf(userId: string): CreditBalance {
    const existing = this.balances.get(userId);
    if (existing) {
      return existing;
    }

    const fresh: CreditBalance = {
      userId,
      balance: 0,
      lastDailyBonusAt: null,
      updatedAt: new Date().toISOString(),
    };
    this.balances.set(userId, fresh);
    return fresh;
  }

  spend(
    userId: string,
    amount: number,
    reason: CreditGrantReason,
  ): CreditBalance {
    const balance = this.balanceOf(userId);

    if (balance.balance < amount) {
      throw new InsufficientCreditsError(amount, balance.balance);
    }

    this.applyDelta(userId, -amount, reason);
    return this.balanceOf(userId);
  }

  historyOf(userId: string): CreditTransaction[] {
    return this.transactions.filter((entry) => entry.userId === userId);
  }

  private grant(
    userId: string,
    amount: number,
    reason: CreditGrantReason,
  ): CreditBalance {
    this.applyDelta(userId, amount, reason);
    return this.balanceOf(userId);
  }

  private applyDelta(
    userId: string,
    amount: number,
    reason: CreditGrantReason,
  ): void {
    const current = this.balanceOf(userId);
    const nextBalance: CreditBalance = {
      userId,
      balance: current.balance + amount,
      lastDailyBonusAt: current.lastDailyBonusAt,
      updatedAt: new Date().toISOString(),
    };
    this.balances.set(userId, nextBalance);
    this.transactions.push({
      id: randomUUID(),
      userId,
      amount,
      reason,
      createdAt: nextBalance.updatedAt,
    });
  }
}
