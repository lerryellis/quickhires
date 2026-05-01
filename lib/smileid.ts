import { prisma } from "@/lib/prisma";

interface SmileIDConfig {
  partnerId: string;
  apiKey: string;
  mode: "sandbox" | "live";
  enabled: boolean;
}

const SANDBOX_URL = "https://testapi.smileidentity.com/v1";
const LIVE_URL = "https://api.smileidentity.com/v1";

export async function getSmileIDConfig(): Promise<SmileIDConfig | null> {
  const partner = await prisma.partner.findUnique({
    where: { slug: "smile_id" },
    include: { configs: true },
  });

  if (!partner) return null;

  const get = (key: string) =>
    partner.configs.find((c) => c.configKey === key)?.configValue ?? "";

  return {
    partnerId: get("partner_id"),
    apiKey: get("api_key"),
    mode: (get("mode") as "sandbox" | "live") || "sandbox",
    enabled: get("enabled") === "1",
  };
}

export async function verifyID(
  idType: string,
  idNumber: string,
  country = "GH"
): Promise<{ success: boolean; summary: string; reference: string; raw: object }> {
  const config = await getSmileIDConfig();
  if (!config || !config.enabled) {
    return { success: false, summary: "Smile ID not configured", reference: "", raw: {} };
  }

  const baseUrl = config.mode === "live" ? LIVE_URL : SANDBOX_URL;

  const payload = {
    partner_id: config.partnerId,
    api_key: config.apiKey,
    country,
    id_type: idType.toUpperCase(),
    id_number: idNumber,
    source_sdk: "quickhire-nextjs",
    source_sdk_version: "1.0.0",
  };

  const res = await fetch(`${baseUrl}/id_verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  const success = data.ResultCode === "1012";
  const reference = data.SmileJobID ?? `SMJ-${Date.now()}`;
  const summary = success
    ? `${idType.replace("_", " ")} verified — name matches authority record`
    : data.ResultText ?? "Verification failed";

  return { success, summary, reference, raw: data };
}
