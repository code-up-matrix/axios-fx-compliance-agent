import {beforeEach,describe,expect,it,vi} from "vitest";
import {createHmac} from "node:crypto";
import {EvidenceInput,fieldBrief,validateBrief} from "../lib/fieldbrief";
import {verifyTwitch,voteChoice} from "../lib/crowdquest";
import {assetUrl,uploadedFile,createTryOn,uploadSlot} from "../lib/fitreceipt";
import {sign} from "../lib/security";
import {compileLesson,evaluateExpression} from "../lib/lessonscript";
import {rhythm,weave} from "../lib/rhythmweave";
beforeEach(()=>{vi.unstubAllGlobals();process.env.SESSION_SECRET="test-session-secret-with-at-least-32-characters";process.env.TWITCH_WEBHOOK_SECRET="test-webhook-secret-with-at-least-32-characters";});
describe("grounded provider output",()=>{
 const valid={summary:"Check the guard.",findings:[{claim:"Guard is loose.",evidenceIds:["E1"]}],unknowns:[],nextChecks:["Inspect guard."]};
 it("rejects fabricated evidence IDs",()=>expect(()=>validateBrief({...valid,findings:[{claim:"Ready",evidenceIds:["FAKE"]}]},["E1"])).toThrow("unverifiable"));
 it("rejects duplicate evidence identifiers",()=>expect(EvidenceInput.safeParse({question:"What happened?",evidence:[{id:"E1",text:"First record"},{id:"E1",text:"Other record"}]}).success).toBe(false));
 it("calls Nebius using a catalog-confirmed NVIDIA model and preserves provenance",async()=>{process.env.NEBIUS_API_KEY="test-nebius-key";process.env.NEBIUS_NVIDIA_MODEL="nvidia/test-model";const f=vi.fn().mockResolvedValueOnce(Response.json({data:[{id:"nvidia/test-model"}]})).mockResolvedValueOnce(Response.json({id:"test-response",choices:[{message:{content:JSON.stringify(valid)}}]}));vi.stubGlobal("fetch",f);const r=await fieldBrief({question:"What is known?",evidence:[{id:"E1",text:"Guard is loose."},{id:"E2",text:"Not inspected."}]});expect(r.provenance.responseId).toBe("test-response");expect(f.mock.calls[1][0]).toBe("https://api.tokenfactory.nebius.com/v1/chat/completions");expect(JSON.parse(f.mock.calls[1][1].body).model).toBe("nvidia/test-model");});
 it("fails closed if the configured model is absent",async()=>{process.env.NEBIUS_API_KEY="test-key";process.env.NEBIUS_NVIDIA_MODEL="nvidia/missing";const f=vi.fn().mockResolvedValue(Response.json({data:[]}));vi.stubGlobal("fetch",f);await expect(fieldBrief({question:"What is known?",evidence:[{id:"E1",text:"Test record."}]})).rejects.toThrow("catalog");expect(f).toHaveBeenCalledTimes(1);});
});
describe("Twitch event integrity",()=>{
 function headers(raw:string,time=new Date().toISOString()){const h=new Headers({"twitch-eventsub-message-id":"evt-1","twitch-eventsub-message-timestamp":time});h.set("twitch-eventsub-message-signature","sha256="+createHmac("sha256",process.env.TWITCH_WEBHOOK_SECRET!).update("evt-1"+time+raw).digest("hex"));return h;}
 it("accepts authentic raw-body signatures",()=>expect(verifyTwitch(headers("{}"),"{}")).toBe("evt-1"));
 it("rejects tampered bodies",()=>expect(()=>verifyTwitch(headers("{}"),'{"vote":"A"}')).toThrow("signature"));
 it("rejects stale signed messages",()=>expect(()=>verifyTwitch(headers("{}",new Date(Date.now()-700000).toISOString()),"{}")).toThrow("Expired"));
 it("rejects invalid timestamps",()=>expect(()=>verifyTwitch(headers("{}","bad"),"{}")).toThrow("Expired"));
 it("requires a whole explicit vote command",()=>{expect(voteChoice("!vote d")).toBe(3);expect(voteChoice("hello !vote A")).toBeNull();expect(voteChoice("!vote E")).toBeNull();});
});
describe("YouCam ownership and provider contract",()=>{
 it("rejects another session's upload token",()=>expect(()=>uploadedFile(sign({kind:"youcam-upload",owner:"alice",fileId:"file",exp:Date.now()+60000}),"bob")).toThrow("belong"));
 it("blocks non-provider image hosts and credentials",()=>{expect(()=>assetUrl("http://127.0.0.1/image")).toThrow();expect(()=>assetUrl("https://evil.example/image")).toThrow();expect(()=>assetUrl("https://user:pass@yce-us.s3-accelerate.amazonaws.com/a")).toThrow();});
 it("returns signed upload ownership and no provider credential",async()=>{process.env.YOUCAM_API_KEY="test-youcam-key";vi.stubGlobal("fetch",vi.fn().mockResolvedValue(Response.json({data:{files:[{file_id:"file-a",requests:[{url:"https://yce-us.s3-accelerate.amazonaws.com/a",method:"PUT",headers:{"Content-Type":"image/jpg"}}]}]}})));const slot=await uploadSlot("alice",{consent:true,name:"a.jpg",size:500,type:"image/jpeg"});expect(uploadedFile(slot.token,"alice")).toBe("file-a");expect(JSON.stringify(slot)).not.toContain("test-youcam-key");});
 it("uses the documented cloth-v4 payload",async()=>{process.env.YOUCAM_API_KEY="test-key";const token=sign({kind:"youcam-upload",owner:"alice",fileId:"file-a",exp:Date.now()+60000});const f=vi.fn().mockResolvedValue(Response.json({data:{task_id:"task-1"}}));vi.stubGlobal("fetch",f);await createTryOn("alice",{consent:true,source:token,garment:token,category:"outer"});expect(f.mock.calls[0][0]).toContain("/task/cloth-v4");expect(JSON.parse(f.mock.calls[0][1].body)).toEqual({src_file_id:"file-a",ref_file_id:"file-a",garment_category:"outer"});});
});
describe("LessonScript language",()=>{
 it("keeps rational arithmetic exact",()=>expect(evaluateExpression("1/3 + 1/6")).toBe("1/2"));
 it("implements precedence and unary minus",()=>expect(evaluateExpression("-(2+3) * 4 / 2")).toBe("-10"));
 it("reports source lines on errors",()=>expect(()=>compileLesson('title "Fractions"\nexercise "Divide" = 2/0')).toThrow("Line 2: Division by zero"));
 it("rejects executable JavaScript",()=>expect(()=>compileLesson('exercise "Oops" = process.exit()')).toThrow("Expected an integer"));
 it("limits nesting and numeric work",()=>{expect(()=>evaluateExpression("(".repeat(25)+"1"+")".repeat(25))).toThrow("nested");expect(()=>evaluateExpression("999999999 * 999999999 * 999999999")).toThrow("limit");});
});
describe("reproducible generative art",()=>{
 it("preserves pulse count for each allowed rhythm",()=>{for(let n=8;n<=48;n++)for(let k=1;k<=n;k++)expect(rhythm(n,k,3).filter(Boolean)).toHaveLength(k);});
 it("exports accessible deterministic SVG without active content",()=>{const input={steps:24,pulses:9,rings:8,rotation:0,palette:"moss" as const};const a=weave(input);expect(a.svg).toBe(weave(input).svg);expect(a.svg).toContain("<desc");expect(a.svg).not.toContain("<script");expect(a.svg.match(/<circle/g)).toHaveLength(24*8+1);});
});
