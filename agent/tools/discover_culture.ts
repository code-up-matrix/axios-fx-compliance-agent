import { defineTool } from "eve/tools";
import { TasteInput, cultureRoute } from "../../lib/cultureroute";
import { rateLimit } from "../../lib/db";
export default defineTool({description:"Use Qloo's official event harness to discover places, books or movies from public cultural references. Ask the user to confirm ambiguous entities. Never infer sensitive personal traits. Does not book or send messages.",inputSchema:TasteInput,async execute(input){await rateLimit("qloo:agent:global",10);return cultureRoute(input);}});
