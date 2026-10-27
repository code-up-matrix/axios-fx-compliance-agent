import { json } from "@/lib/security";
import config from "@/project.json";
import { getVercelOidcToken } from "@vercel/oidc";
export async function GET() {
  const missing = config.requiredEnv.filter((name) => !process.env[name]);
  let gatewayAuth = Boolean(process.env.AI_GATEWAY_API_KEY);
  if (!gatewayAuth) {
    try {
      gatewayAuth = Boolean(await getVercelOidcToken());
    } catch {
      // Local runs can lack OIDC; report presence without exposing credentials.
    }
  }
  if (!gatewayAuth) missing.push("AI_GATEWAY_AUTH");
  return json({
    application: config.name,
    status: missing.length
      ? "configuration_required"
      : "configured_not_live_verified",
    missing,
    mode: missing.length ? "configuration_required" : "connected",
    version: "0.1.0",
  });
}
