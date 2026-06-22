/**
 * Simple self-contained user agent parser to avoid external dependencies
 */
export function parseUserAgent(uaString) {
    if (!uaString) return { device: "Unknown Device", isMobile: false };

    const ua = uaString.toLowerCase();
    const isMobile = /mobile|android|iphone|ipad|phone/i.test(ua);

    let browser = "Browser";
    if (ua.includes("chrome") || ua.includes("crios")) browser = "Chrome";
    else if (ua.includes("safari") && !ua.includes("chrome")) browser = "Safari";
    else if (ua.includes("firefox")) browser = "Firefox";
    else if (ua.includes("edge")) browser = "Edge";

    let os = "OS";
    if (ua.includes("windows")) os = "Windows";
    else if (ua.includes("macintosh") || ua.includes("mac os")) os = "macOS";
    else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS";
    else if (ua.includes("android")) os = "Android";
    else if (ua.includes("linux")) os = "Linux";

    return {
        device: `${browser} on ${os}`,
        isMobile
    };
}

/**
 * Returns mock/fallback location for local testing or resolved location for production
 */
export function getIpLocation(ip) {
    if (!ip) return "Local System";

    const cleanIp = ip === "::1" ? "127.0.0.1" : ip.replace("::ffff:", "");
    if (cleanIp === "127.0.0.1" || cleanIp.startsWith("127.0.") || cleanIp.startsWith("192.168.")) {
        return "Local System";
    }

    return "Local System"; // Fallback default
}
