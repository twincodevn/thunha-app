import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema, tenantLoginSchema } from "@/lib/validators";

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        // Google OAuth
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        // Email/Password (Landlord) & Username/Password (Tenant)
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                // 1. Try Landlord Login (Email)
                const landlordValidation = loginSchema.safeParse(credentials);
                if (landlordValidation.success) {
                    const { email, password } = landlordValidation.data;
                    const user = await prisma.user.findUnique({ where: { email } });

                    if (user && user.password && await bcrypt.compare(password, user.password)) {
                        return {
                            id: user.id,
                            email: user.email,
                            name: user.name,
                            plan: user.plan,
                            role: "LANDLORD",
                        };
                    }
                }

                // 2. Try Tenant Login (Username)
                const tenantValidation = tenantLoginSchema.safeParse(credentials);
                if (tenantValidation.success) {
                    const { username, password } = tenantValidation.data;
                    const tenant = await prisma.tenant.findUnique({ where: { username } });

                    if (tenant && tenant.password && await bcrypt.compare(password, tenant.password)) {
                        return {
                            id: tenant.id,
                            email: tenant.email,
                            name: tenant.name,
                            plan: "FREE", // Tenants don't have plans
                            role: "TENANT",
                        };
                    }
                }

                return null;
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account }) {
            // Handle OAuth sign in - create/update user in DB
            if (account?.provider === "google" && user.email) {
                const existingUser = await prisma.user.findUnique({
                    where: { email: user.email },
                });

                if (!existingUser) {
                    // Create new user for OAuth
                    await prisma.user.create({
                        data: {
                            email: user.email,
                            name: user.name || "Người dùng",
                            password: "", // OAuth users don't need password
                            emailVerified: new Date(),
                        },
                    });
                }
            }
            return true;
        },
        async jwt({ token, user, account, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.plan = user.plan;
                token.role = user.role;
            }

            // Update session trigger
            if (trigger === "update" && token.sub) {
                const dbUser = await prisma.user.findUnique({
                    where: { id: token.sub },
                });
                if (dbUser) {
                    token.name = dbUser.name;
                    token.picture = dbUser.avatar; // Map avatar to picture/image
                    // token.email = dbUser.email; // Email usually doesn't change or needs verify
                }
            }

            // For OAuth users, fetch plan from DB
            if (account?.provider === "google" && token.email) {
                const dbUser = await prisma.user.findUnique({
                    where: { email: token.email as string },
                });
                if (dbUser) {
                    token.id = dbUser.id;
                    token.plan = dbUser.plan;
                    token.role = "LANDLORD"; // OAuth implies Landlord for now
                    token.picture = dbUser.avatar; // Ensure avatar is synced
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.plan = token.plan as string;
                session.user.role = token.role as "LANDLORD" | "TENANT";
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    trustHost: true,
    debug: process.env.NODE_ENV === "development",
});
