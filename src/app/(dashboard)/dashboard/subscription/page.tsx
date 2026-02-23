import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserPlan } from "@/lib/plans";
import { SubscriptionClient } from "./subscription-client";
import { checkAndEnforcePlanExpiry } from "./actions";

export default async function SubscriptionPage() {
    const session = await auth();
    if (!session?.user) return null;

    await checkAndEnforcePlanExpiry(session.user.id);

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { plan: true, planExpiresAt: true },
    });

    if (!user) return null;

    return (
        <SubscriptionClient
            currentPlan={user.plan as UserPlan}
            userId={session.user.id}
            planExpiresAt={user.planExpiresAt?.toISOString() ?? null}
        />
    );
}
