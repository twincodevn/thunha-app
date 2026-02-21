import { prisma } from "@/lib/prisma";

export const SCORING_RULES = {
    BASE_SCORE: 600,
    MAX_SCORE: 850,
    MIN_SCORE: 300,

    // Positive Actions
    ON_TIME_PAYMENT: 5,
    EARLY_PAYMENT: 10,

    // Negative Actions
    LATE_PAYMENT_MINOR: -15, // 1-5 days late
    LATE_PAYMENT_MAJOR: -30, // > 5 days late
    INCIDENT_WARNING: -20,   // E.g., noise complaint
    EVICTION_BREACH: -100    // E.g., severe contract breach
};

export async function calculateNewScore({
    tenantId,
    pointsChange,
    reason
}: {
    tenantId: string;
    pointsChange: number;
    reason: string;
}) {
    // 1. Fetch current tenant score
    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { creditScore: true, paymentHistory: true }
    });

    if (!tenant) throw new Error("Tenant not found");

    // 2. Calculate new score within bounds
    const currentScore = tenant.creditScore || SCORING_RULES.BASE_SCORE;
    let newScore = currentScore + pointsChange;

    if (newScore > SCORING_RULES.MAX_SCORE) newScore = SCORING_RULES.MAX_SCORE;
    if (newScore < SCORING_RULES.MIN_SCORE) newScore = SCORING_RULES.MIN_SCORE;

    // 3. Append to history
    const historyEntry = {
        date: new Date().toISOString(),
        pointsChange,
        newScore,
        reason
    };

    const currentHistory = Array.isArray(tenant.paymentHistory)
        ? tenant.paymentHistory
        : [];

    const updatedHistory = [...currentHistory, historyEntry];

    // 4. Update the Tenant record
    return await prisma.tenant.update({
        where: { id: tenantId },
        data: {
            creditScore: newScore,
            paymentHistory: updatedHistory,
        }
    });
}
