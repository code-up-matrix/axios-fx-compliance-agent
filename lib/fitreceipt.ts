import { z } from "zod";
import { AppError, required, sign, verify } from "./security";
import { providerJson } from "./portfolio";
const endpoint="https://yce-api-01.makeupar.com/s2s/v2.0";
const headers=()=>({Authorization:`Bearer ${required("YOUCAM_API_KEY")}`,"Content-Type":"application/json"});
export const UploadInput=z.object({consent:z.literal(true),name:z.string().min(1).max(120),type:z.enum(["image/jpeg","image/png"]),size:z.number().int().min(1).max(8_000_000)});
export const TryOnInput=z.object({consent:z.literal(true),source:z.string().max(6000),garment:z.string().max(6000),category:z.enum(["upper_body","full_body","outer","shoes","auto"])});
export function assetUrl(value:string){
  let u:URL;try{u=new URL(value);}catch{throw new AppError(502,"Invalid provider image URL.");}
  if(u.protocol!=="https:"||u.username||u.password||!/^yce-[a-z0-9-]+\.s3(?:[.-][a-z0-9-]+)*\.amazonaws\.com$/.test(u.hostname))throw new AppError(502,"Unexpected provider image host.");
  return u.toString();
}
export async function uploadSlot(owner:string,input:z.infer<typeof UploadInput>){
  const data=await providerJson(endpoint+"/file",{method:"POST",headers:headers(),body:JSON.stringify({files:[{content_type:input.type==="image/jpeg"?"image/jpg":input.type,file_name:input.name.replace(/[^a-zA-Z0-9._-]/g,"_"),file_size:input.size}]})});
  const parsed=z.object({data:z.object({files:z.array(z.object({file_id:z.string().max(2000),requests:z.array(z.object({url:z.string(),method:z.literal("PUT"),headers:z.record(z.string(),z.string())})).length(1)})).length(1)})}).safeParse(data);
  if(!parsed.success)throw new AppError(502,"Unexpected YouCam upload response.");
  const file=parsed.data.data.files[0];const request=file.requests[0];
  return {token:sign({kind:"youcam-upload",owner,fileId:file.file_id,exp:Date.now()+900000}),url:assetUrl(request.url),method:"PUT",headers:{"Content-Type":request.headers["Content-Type"]||input.type}};
}
export function uploadedFile(token:string,owner:string){const data=verify(token);if(data.kind!=="youcam-upload"||data.owner!==owner||typeof data.fileId!=="string")throw new AppError(403,"Image does not belong to this session.");return data.fileId;}
export async function createTryOn(owner:string,input:z.infer<typeof TryOnInput>){
  const result=await providerJson(endpoint+"/task/cloth-v4",{method:"POST",headers:headers(),body:JSON.stringify({src_file_id:uploadedFile(input.source,owner),ref_file_id:uploadedFile(input.garment,owner),garment_category:input.category})});
  const parsed=z.object({data:z.object({task_id:z.string().min(1).max(2000)})}).safeParse(result);
  if(!parsed.success)throw new AppError(502,"YouCam did not return a task ID.");
  return {taskId:parsed.data.data.task_id,category:input.category,provider:"YouCam cloth-v4",createdAt:new Date().toISOString()};
}
export async function tryOnStatus(taskId:string){
  const result=await providerJson(endpoint+"/task/cloth-v4/"+encodeURIComponent(taskId),{headers:headers()});
  const parsed=z.object({data:z.object({task_status:z.string(),error:z.unknown().optional(),results:z.object({url:z.string()}).nullable().optional()})}).safeParse(result);
  if(!parsed.success)throw new AppError(502,"Unexpected YouCam task response.");
  return {status:parsed.data.data.task_status,url:parsed.data.data.results?.url?assetUrl(parsed.data.data.results.url):null,error:parsed.data.data.error?"The provider could not process these images. Check the photo requirements.":null};
}
