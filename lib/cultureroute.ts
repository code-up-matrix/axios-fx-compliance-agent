import {runQlooExec,createDirectQlooWorkflowExecutorFromEnvironment} from "@qloo/qloo-harness";
import {z} from "zod";
import {AppError,required} from "./security";
export const TasteInput=z.object({signals:z.array(z.string().trim().min(2).max(120)).min(1).max(4),city:z.string().trim().min(2).max(100),target:z.enum(["place","book","movie"])});
export async function cultureRoute(input:z.infer<typeof TasteInput>){
 const env={NODE_ENV:process.env.NODE_ENV,QLOO_API_KEY:required("QLOO_API_KEY")};
 try{
  let stdout="";
  // Invoke the official `qloo exec` entry point in-process. This preserves its
  // validation/resolution contract and lets both Next and Eve trace the dependency.
  // No shell, model runtime, external script, home config or fallback transport.
  const code=await runQlooExec(["recommend","--input",JSON.stringify({target_type:input.target,signals:input.signals,...(input.target==="place"?{filter_location:input.city}:{}),limit:6,explain:true})],{
   env,signal:AbortSignal.timeout(45000),
   createExecutor:()=>createDirectQlooWorkflowExecutorFromEnvironment({env,readConfigFile:()=>"{}"}),
   writeOut:text=>{stdout+=text;if(Buffer.byteLength(stdout)>1_000_000)throw new AppError(502,"Qloo response was too large.");},
   writeError:()=>{} // Provider errors may contain private request details.
  });
  if(code!==0)throw new AppError(502,"Qloo could not complete the recommendation. Check the event credential and quota.");
  const envelope=z.object({status:z.string(),summary:z.string().optional()}).passthrough().parse(JSON.parse(stdout));
  if(envelope.status==="error")throw new AppError(502,"Qloo could not complete the recommendation.");
  return {source:"Qloo official harness 0.1.26",input,result:envelope,limits:"Aggregate cultural affinity is a discovery signal, not a prediction of individual preference. Confirm opening times and access with the venue.",generatedAt:new Date().toISOString()};
 }catch(e){if(e instanceof AppError)throw e;throw new AppError(502,"The Qloo harness did not complete. Check event-issued credentials and provider availability. No fallback data was used.");}
}
