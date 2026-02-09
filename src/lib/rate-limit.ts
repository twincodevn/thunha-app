/**
 * Simple in-memory rate limiter for server actions
 * Note: For production, use Redis-based rate limiting
 */

type RateLimitRecord = {
    count: number;
    resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitRecord>();

interface RateLimitOptions {
    maxRequests: number;  // Max requests per window
    windowMs: number;     // Time window in milliseconds
}

interface RateLimitResult {
    success: boolean;
    remaining: number;
    resetAt: Date;
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (e.g., userId, IP, actionName)
 * @param options - Rate limit configuration
 * @returns Object with success status and remaining requests
 */
export function checkRateLimit(
    identifier: string,
    options: RateLimitOptions = { maxRequests: 10, windowMs: 60000 }
): RateLimitResult {
    const now = Date.now();
    const record = rateLimitStore.get(identifier);

    // Clean up expired records periodically
    if (rateLimitStore.size > 10000) {
        for (const [key, value] of rateLimitStore.entries()) {
            if (value.resetAt < now) {
                rateLimitStore.delete(key);
            }
        }
    }

    // No existing record or window expired
    if (!record || record.resetAt < now) {
        rateLimitStore.set(identifier, {
            count: 1,
            resetAt: now + options.windowMs,
        });
        return {
            success: true,
            remaining: options.maxRequests - 1,
            resetAt: new Date(now + options.windowMs),
        };
    }

    // Check if limit exceeded
    if (record.count >= options.maxRequests) {
        return {
            success: false,
            remaining: 0,
            resetAt: new Date(record.resetAt),
        };
    }

    // Increment count
    record.count++;
    return {
        success: true,
        remaining: options.maxRequests - record.count,
        resetAt: new Date(record.resetAt),
    };
}

/**
 * Create a rate-limited action wrapper
 * @param action - The server action function
 * @param getIdentifier - Function to get unique identifier from args
 * @param options - Rate limit configuration
 */
export function withRateLimit<T extends (...args: never[]) => Promise<unknown>>(
    action: T,
    getIdentifier: (...args: Parameters<T>) => string,
    options: RateLimitOptions = { maxRequests: 10, windowMs: 60000 }
): T {
    return (async (...args: Parameters<T>) => {
        const identifier = getIdentifier(...args);
        const result = checkRateLimit(identifier, options);

        if (!result.success) {
            throw new Error(
                `Quá nhiều yêu cầu. Vui lòng thử lại sau ${Math.ceil(
                    (result.resetAt.getTime() - Date.now()) / 1000
                )} giây.`
            );
        }

        return action(...args);
    }) as T;
}

// Preset configurations for common use cases
export const RATE_LIMIT_PRESETS = {
    // Auth actions: 5 attempts per minute
    auth: { maxRequests: 5, windowMs: 60000 },
    // Form submissions: 10 per minute
    form: { maxRequests: 10, windowMs: 60000 },
    // API calls: 30 per minute
    api: { maxRequests: 30, windowMs: 60000 },
    // Sensitive actions (payment, delete): 3 per minute
    sensitive: { maxRequests: 3, windowMs: 60000 },
} as const;
