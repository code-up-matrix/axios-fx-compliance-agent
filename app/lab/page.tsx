import Link from "next/link";
import {Shell} from "@/components/lab/shared";
const projects=[
  ["fieldbrief","FieldBrief","Turn a pile of handover notes into a brief with traceable sources.","Nebius × NVIDIA","↗"],
  ["cultureroute","CultureRoute","Build a cultural discovery shortlist from the things you already enjoy.","Qloo","✳"],
  ["crowdquest","CrowdQuest","Let Twitch chat solve a challenge together, one verified vote at a time.","Codex × TwitchCon","▦"],
  ["fitreceipt","FitReceipt","See an outfit on your photo before choosing what to buy.","YouCam","◒"],
  ["reloop","ReLoop","Give usable surplus a second destination, with confirmed handovers.","Arbiter · Rethinking Waste","↻"],
  ["lessonscript","LessonScript","A small, precise language for printable math worksheets and answer keys.","Syntax Summit","∑"],
  ["rhythmweave","RhythmWeave","Compose a visual rhythm and export reproducible vector art.","InnovArt 2027","◉"],
  ["catalog","Opportunity board","Every captured Devpost event, its entry constraints and the next useful build.","Research · 27 Oct 2026","≋"],
];
export default function Page(){return <Shell name="Small tools. Real jobs" eyebrow="The Devpost collection · October 2026" tagline="A collection of focused products, each built around a specific problem and the technology required to solve it."><div className="lab-panel" style={{marginBottom:24}}><strong>Builds in preparation</strong><p className="lab-note">Live services need deployment and provider configuration. The interfaces show sample inputs; successful provider results appear only after an actual call. The opportunity board tracks readiness separately.</p></div><div className="lab-cardgrid">{projects.map(([slug,name,desc,event,glyph])=><Link className="lab-card" key={slug} href={`/lab/${slug}`}><span className="lab-glyph">{glyph}</span><span className="lab-eyebrow">{event}</span><h2 style={{marginTop:12}}>{name}</h2><p>{desc}</p><b>Open workspace ↗</b></Link>)}</div><p className="lab-note" style={{marginTop:24}}>The existing <Link href="/checkout">AXIOS PayProof sandbox checkout ↗</Link> is also available in this source branch.</p></Shell>;}
