import { describe, it, expect, vi, afterEach } from "vitest";
import { price, assess } from "../lib/catalog";
import {
  approvalLink,
  verifiedCapture,
  orderPayload,
  paypal,
} from "../lib/paypal";
afterEach(() => vi.unstubAllGlobals());
describe("commerce boundaries", () => {
  it("uses integer cents and ignores caller-supplied prices", () => {
    expect(
      price({ sku: "team-seat", quantity: 3, totalCents: 1 }).totalCents,
    ).toBe(3600);
    expect(assess({ sku: "team-seat", quantity: 3 }, 3500).withinBudget).toBe(
      false,
    );
    expect(() => price({ sku: "team-seat", quantity: 0 })).toThrow();
  });
  it("restricts approval to PayPal sandbox", () => {
    expect(() =>
      approvalLink({ links: [{ rel: "approve", href: "https://evil.test/" }] }),
    ).toThrow();
    expect(
      approvalLink({
        links: [
          {
            rel: "approve",
            href: "https://www.sandbox.paypal.com/checkoutnow?token=ABC",
          },
        ],
      }),
    ).toContain("sandbox.paypal.com");
  });
  it("accepts only a completed matching capture", () => {
    const p = {
      id: "ORDER1234567",
      status: "COMPLETED",
      purchase_units: [
        {
          custom_id: "ours",
          payments: {
            captures: [
              {
                id: "CAPTURE1",
                status: "COMPLETED",
                amount: { value: "30.00", currency_code: "USD" },
              },
            ],
          },
        },
      ],
    };
    expect(verifiedCapture(p, 3000, "ours").captureId).toBe("CAPTURE1");
    expect(() => verifiedCapture(p, 3001, "ours")).toThrow();
    expect(() => verifiedCapture(p, 3000, "theirs")).toThrow();
    p.purchase_units[0].payments.captures[0].status = "PENDING";
    expect(() => verifiedCapture(p, 3000, "ours")).toThrow();
  });
  it("builds server-owned prices and explicit return URLs", () => {
    const payload = orderPayload(
      "ours",
      price({ sku: "inspection-credit", quantity: 2 }),
      "https://app.test",
    );
    expect(payload.purchase_units[0].amount.value).toBe("30.00");
    expect(payload.payment_source.paypal.experience_context.return_url).toBe(
      "https://app.test/checkout",
    );
  });
  it("never falls back to live PayPal and preserves idempotency", async () => {
    process.env.PAYPAL_CLIENT_ID = "test";
    process.env.PAYPAL_CLIENT_SECRET = "test";
    const mock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ access_token: "token" }))
      .mockResolvedValueOnce(Response.json({ id: "ORDER1234567" }));
    vi.stubGlobal("fetch", mock);
    await paypal("/v2/checkout/orders", "POST", {}, "same-checkout");
    expect(mock.mock.calls[1][0]).toBe(
      "https://api-m.sandbox.paypal.com/v2/checkout/orders",
    );
    expect(mock.mock.calls[1][1].headers["PayPal-Request-Id"]).toBe(
      "same-checkout",
    );
  });
});
