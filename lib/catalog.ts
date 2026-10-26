import { z } from "zod";
export const catalog = [
  {
    id: "inspection-credit",
    name: "Equipment inspection report",
    description: "One digital analysis report for a maintenance team.",
    cents: 1500,
  },
  {
    id: "archive-month",
    name: "Evidence archive · one month",
    description: "Digital evidence storage for one project for one month.",
    cents: 900,
  },
  {
    id: "team-seat",
    name: "Reviewer workspace seat",
    description: "One digital reviewer seat for one month.",
    cents: 1200,
  },
] as const;
export const Cart = z.object({
  sku: z.enum(["inspection-credit", "archive-month", "team-seat"]),
  quantity: z.number().int().min(1).max(20),
});
export function price(input: unknown) {
  const cart = Cart.parse(input);
  const item = catalog.find((i) => i.id === cart.sku)!;
  return {
    ...cart,
    name: item.name,
    unitCents: item.cents,
    totalCents: item.cents * cart.quantity,
    currency: "USD" as const,
  };
}
export const money = (cents: number) => (cents / 100).toFixed(2);
export function assess(input: unknown, budgetCents: number) {
  const cart = price(input);
  return {
    ...cart,
    budgetCents,
    withinBudget: cart.totalCents <= budgetCents,
    remainingCents: budgetCents - cart.totalCents,
  };
}
