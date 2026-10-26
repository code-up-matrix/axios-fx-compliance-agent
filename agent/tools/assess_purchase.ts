import { defineTool } from "eve/tools";
import { z } from "zod";
import { catalog, assess, Cart } from "../../lib/catalog";
export default defineTool({
  description:
    "Read the catalog and compute exact budget checks. This tool cannot pay.",
  inputSchema: Cart.extend({
    budgetCents: z.number().int().min(1).max(200000),
  }),
  execute(input) {
    return {
      catalog,
      plan: assess(input, input.budgetCents),
      environment: "sandbox",
      paymentAuthorized: false,
    };
  },
});
