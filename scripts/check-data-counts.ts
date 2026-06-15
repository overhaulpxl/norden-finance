import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

config({ path: '.env.local', quiet: true });
config({ path: '.env', quiet: true });

const prisma = new PrismaClient();

const counters = [
  ['profiles', () => prisma.profile.count()],
  ['billingSubscriptions', () => prisma.billingSubscription.count()],
  ['wallets', () => prisma.balance.count()],
  ['transactions', () => prisma.transaction.count()],
  ['budgets', () => prisma.budget.count()],
  ['savingGoals', () => prisma.savingGoal.count()],
  ['debts', () => prisma.debt.count()],
  ['paylaters', () => prisma.paylater.count()],
  ['appSubscriptions', () => prisma.appSubscription.count()],
  ['paymentRequests', () => prisma.paymentRequest.count()],
  ['plans', () => prisma.plan.count()],
  ['settings', () => prisma.setting.count()],
  ['feedback', () => prisma.feedback.count()],
  ['notifications', () => prisma.notification.count()],
] as const;

async function main() {
  const counts: Record<string, number> = {};

  for (const [name, count] of counters) {
    counts[name] = await count();
  }

  console.log(JSON.stringify({
    checkedAt: new Date().toISOString(),
    databaseProvider: 'postgresql',
    counts,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error('Data count check failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
