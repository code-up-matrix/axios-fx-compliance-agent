import {z} from "zod";
import {AppError,body,handle,json} from "@/lib/security";
import {guard,saveRun} from "@/lib/portfolio";
import {compileLesson,LessonError} from "@/lib/lessonscript";
export const runtime="nodejs";
export async function POST(request:Request){return handle(async()=>{const who=await guard(request,"lessonscript",15);const {source}=await body(request,z.object({source:z.string().max(8000)}));try{const worksheet=compileLesson(source);const run=await saveRun(who.sub,"lessonscript",{source,worksheet});return json({id:run.id,worksheet});}catch(e){if(e instanceof LessonError)throw new AppError(422,e.message);throw e;}});}
