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
                            plan: "FREE",
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
            if (account?.provider === "google" && user.email) {
                const existingUser = await prisma.user.findUnique({
                    where: { email: user.email },
                });

                if (!existingUser) {
                    await prisma.user.create({
                        data: {
                            email: user.email,
                            name: user.name || "Người dùng",
                            password: "",
                            emailVerified: new Date(),
                        },
                    });
                }
            }
            return true;
        },

        async jwt({ token, user, account }) {
            // FIX 494: Only store MINIMUM fields in JWT to keep cookie size tiny
            if (user) {
                token.id = user.id;
                token.role = user.role;
                // ❌ DO NOT store: plan, picture, image, avatar (fetch from DB per-request)
            }

            // For Google OAuth: fetch only user ID from DB
            if (account?.provider === "google" && token.email) {
                const dbUser = await prisma.user.findUnique({
                    where: { email: token.email as string },
                    select: { id: true },
                });
                if (dbUser) {
                    token.id = dbUser.id;
                    token.role = "LANDLORD";
                }
            }

            // Strip any large fields that may have sneaked into token
            // (e.g. Google injects `picture` as full URL which adds bytes)
            delete token.picture;
            delete (token as Record<string, unknown>).image;

            return token;
        },

        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as "LANDLORD" | "TENANT";
                // plan is NOT stored in session — fetch from DB per-request when needed
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
    // FIX 494: Explicit cookie config — prevents multiple cookie chunks accumulating
    cookies: {
        sessionToken: {
            name: "authjs.session-token",
            options: {
                httpOnly: true,
                sameSite: "lax" as const,
                path: "/",
                secure: process.env.NODE_ENV === "production",
            },
        },
    },
    trustHost: true,
    debug: false, // Never enable debug — it bloats response headers
});
