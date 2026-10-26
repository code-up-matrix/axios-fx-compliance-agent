"use client";
import { useState } from "react";
import { Workspace, Download, post } from "@/components/workspace";
type Plan = {
  name: string;
  quantity: number;
  unitCents: number;
  totalCents: number;
  currency: string;
  withinBudget: boolean;
  remainingCents: number;
  rationale: string;
  mode: string;
  quoteToken?: string;
};
export default function Page() {
  const [requirement, setRequirement] = useState(
    "I need two equipment inspection reports for our maintenance team.",
  );
  const [budget, setBudget] = useState("40");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [requestId, setRequestId] = useState("");
  async function run(mode: string) {
    setBusy(true);
    setError("");
    setPlan(null);
    try {
      setPlan(
        await post("/api/plan", {
          mode,
          requirement,
          budgetCents: Math.round(Number(budget) * 100),
        }),
      );
      setRequestId(crypto.randomUUID());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Planning failed.");
    } finally {
      setBusy(false);
    }
  }
  async function checkout() {
    if (!plan?.quoteToken) return;
    setBusy(true);
    setError("");
    try {
      const order = await post("/api/orders/create", {
        quoteToken: plan.quoteToken,
        requestId,
      });
      window.location.assign(order.approvalUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed.");
      setBusy(false);
    }
  }
  return (
    <Workspace name="AXIOS / PAYPROOF" tag="AGENTIC COMMERCE">
      <section className="hero">
        <div>
          <span className="eyebrow">
            YOU SET THE NEED. YOU APPROVE THE SPEND.
          </span>
          <h1>
            A smarter plan.
            <br />
            <em>A payment you can prove.</em>
          </h1>
          <p>
            Turn a requirement into a budget-checked purchase. Review the
            reasoning, approve in PayPal, and keep a verified receipt.
          </p>
        </div>
        <div className="hero-symbol">
          02
          <span>
            PLAN
            <br />
            APPROVE
            <br />
            VERIFY
          </span>
        </div>
      </section>
      <div className="workspace-grid">
        <aside className="panel">
          <div className="panel-title">
            <span>Your purchase brief</span>
            <span className="number">01</span>
          </div>
          <label>
            What does your team need?
            <textarea
              rows={5}
              value={requirement}
              maxLength={3000}
              onChange={(e) => setRequirement(e.target.value)}
            />
          </label>
          <label>
            Budget · USD
            <input
              type="number"
              min="1"
              max="2000"
              step="0.01"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />
          </label>
          <button disabled={busy} onClick={() => run("connected")}>
            {busy ? "Working…" : "Build my AI purchase plan →"}
          </button>
          <button
            disabled={busy}
            className="secondary"
            onClick={() => run("sample")}
          >
            Explore a synthetic example
          </button>
          <p className="caption">
            Connected planning needs workspace access and AI Gateway. Sandbox
            checkout never charges real money.
          </p>
          <p className="error" role="alert">
            {error}
          </p>
          <div className="mini-list">
            <div>
              <b>AI planning</b>
              <span>Structured catalog selection</span>
            </div>
            <div>
              <b>PayPal</b>
              <span>Approval and sandbox capture</span>
            </div>
            <div>
              <b>Server verification</b>
              <span>Amount, owner and payment state</span>
            </div>
          </div>
        </aside>
        <section>
          <div className="metrics">
            <div>
              <span>Your budget</span>
              <strong>${Number(budget || 0).toFixed(0)}</strong>
            </div>
            <div>
              <span>Proposed total</span>
              <strong>
                {plan ? "$" + (plan.totalCents / 100).toFixed(2) : "—"}
              </strong>
            </div>
            <div>
              <span>Payment environment</span>
              <strong className="metric-word">Sandbox</strong>
            </div>
          </div>
          {plan ? (
            <article className="panel finding">
              <div className="finding-heading">
                <span
                  className={
                    "status " + (plan.withinBudget ? "watch" : "action")
                  }
                >
                  {plan.withinBudget ? "Within budget" : "Over budget"}
                </span>
                <span className="number">
                  {plan.mode === "sample" ? "SAMPLE" : "AI PLAN"}
                </span>
              </div>
              <h2>{plan.name}</h2>
              <p>{plan.rationale}</p>
              <div className="next-step">
                <b>Review your order</b>
                <p>
                  {plan.quantity} × ${(plan.unitCents / 100).toFixed(2)} = $
                  {(plan.totalCents / 100).toFixed(2)} USD
                </p>
                <p>
                  Digital service demonstration. No real goods or services are
                  delivered.
                </p>
              </div>
              <div className="actions">
                <Download data={plan} name="purchase-plan.json" />
                {plan.quoteToken && plan.withinBudget ? (
                  <button onClick={checkout} disabled={busy}>
                    Review & approve on PayPal ↗
                  </button>
                ) : (
                  <p className="caption">
                    {plan.mode === "sample"
                      ? "Run connected AI planning to enable a sandbox checkout."
                      : "Adjust your brief or budget before checkout."}
                  </p>
                )}
              </div>
            </article>
          ) : (
            <div className="panel empty">
              <span className="empty-mark">↗</span>
              <h2>
                Useful AI stops
                <br />
                before spending your money.
              </h2>
              <p>
                Prices come from a controlled catalog. The model proposes. You
                review. PayPal records the result.
              </p>
              <div className="flow-labels">
                <span>Requirement</span>
                <span>→</span>
                <span>Human approval</span>
                <span>→</span>
                <span>Receipt</span>
              </div>
            </div>
          )}
          <p className="caption legal">
            PayPal sandbox only · Signed quotes expire after 15 minutes · No
            autonomous purchases
          </p>
        </section>
      </div>
    </Workspace>
  );
}
