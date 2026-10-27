import { body, handle, json } from "@/lib/security";
import { guard, saveRun } from "@/lib/portfolio";
import { EvidenceInput, fieldBrief } from "@/lib/fieldbrief";
export const runtime="nodejs";
export const maxDuration=120;
export async function POST(request:Request){return handle(async()=>{
  const who=await guard(request,"fieldbrief",4);
  const input=await body(request,EvidenceInput);
  const result=await fieldBrief(input);
  const record=await saveRun(who.sub,"fieldbrief",result);
  return json({id:record.id,...result});
});}
