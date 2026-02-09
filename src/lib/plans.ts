import { PLAN_FEATURES, PLAN_LIMITS } from "./constants";

export type UserPlan = "FREE" | "BASIC" | "PRO" | "BUSINESS";
export type PlanFeature = keyof typeof PLAN_FEATURES.FREE;

/**
 * Check if a user's plan allows a specific feature
 */
export function canAccessFeature(plan: UserPlan, feature: PlanFeature): boolean {
    const planFeatures = PLAN_FEATURES[plan];
    return planFeatures[feature] === true;
}

/**
 * Check if user's plan is still valid (not expired)
 */
export function isPlanActive(planExpiresAt: Date | null, plan: UserPlan): boolean {
    // FREE plan never expires
    if (plan === "FREE") {
        return true;
    }

    // If no expiry date set, consider active (edge case)
    if (!planExpiresAt) {
        return true;
    }

    return new Date() < new Date(planExpiresAt);
}

/**
 * Get the effective plan (considering expiry)
 */
export function getEffectivePlan(plan: UserPlan, planExpiresAt: Date | null): UserPlan {
    if (isPlanActive(planExpiresAt, plan)) {
        return plan;
    }
    return "FREE";
}

/**
 * Get room limit for a plan
 */
export function getPlanRoomLimit(plan: UserPlan): number {
    return PLAN_LIMITS[plan];
}

/**
 * Check if user can add more rooms
 */
export function canAddRoom(plan: UserPlan, currentRoomCount: number): boolean {
    const limit = getPlanRoomLimit(plan);
    return currentRoomCount < limit;
}

/**
 * Get list of features for a plan
 */
export function getPlanFeatures(plan: UserPlan) {
    return PLAN_FEATURES[plan];
}

/**
 * Check if a plan is paid (not FREE)
 */
export function isPaidPlan(plan: UserPlan): boolean {
    return plan !== "FREE";
}

/**
 * Compare plans (returns -1, 0, or 1)
 */
export function comparePlans(planA: UserPlan, planB: UserPlan): number {
    const order: Record<UserPlan, number> = {
        FREE: 0,
        BASIC: 1,
        PRO: 2,
        BUSINESS: 3,
    };
    return order[planA] - order[planB];
}

/**
 * Check if planA is higher or equal to planB
 */
export function isAtLeast(userPlan: UserPlan, requiredPlan: UserPlan): boolean {
    return comparePlans(userPlan, requiredPlan) >= 0;
}
