import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserPlan } from "@/lib/plans";
import { SubscriptionClient } from "./subscription-client";

export default async function SubscriptionPage() {
    const session = await auth();
    if (!session?.user) return null;

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { plan: true },
    });

    if (!user) return null;

    return (
        <SubscriptionClient
            currentPlan={user.plan as UserPlan}
            userId={session.user.id}
        />
    );
}
