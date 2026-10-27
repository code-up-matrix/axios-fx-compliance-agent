import {body,handle,json} from "@/lib/security";
import {guard,saveRun} from "@/lib/portfolio";
import {WeaveInput,weave} from "@/lib/rhythmweave";
export const runtime="nodejs";
export async function POST(request:Request){return handle(async()=>{const who=await guard(request,"rhythmweave",15);const input=await body(request,WeaveInput);const art=weave(input);const run=await saveRun(who.sub,"rhythmweave",art);return json({id:run.id,...art});});}
