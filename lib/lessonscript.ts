export class LessonError extends Error {constructor(public line:number,message:string){super(`Line ${line}: ${message}`);}}
type Fraction={n:bigint;d:bigint};
const gcd=(a:bigint,b:bigint):bigint=>b===0n?(a<0n?-a:a):gcd(b,a%b);
function reduce(n:bigint,d:bigint):Fraction{if(d===0n)throw new Error("Division by zero.");if(n>10n**18n||n< -(10n**18n)||d>10n**18n||d< -(10n**18n))throw new Error("Number exceeds the worksheet limit.");const g=gcd(n,d);return{n:(d<0n?-n:n)/g,d:(d<0n?-d:d)/g};}
export function evaluateExpression(source:string):string{
  if(source.length>150)throw new Error("Expression exceeds 150 characters.");
  const tokens=source.match(/\d+|[()+*/-]|\S/g)||[];let at=0,depth=0;
  function atom():Fraction{if(++depth>20)throw new Error("Too many nested operations.");let value:Fraction;const t=tokens[at++];if(t==="-"){const a=atom();value={n:-a.n,d:a.d};}else if(t==="("){value=sum();if(tokens[at++]!==")")throw new Error("Missing closing parenthesis.");}else if(t&&/^\d{1,9}$/.test(t)){value={n:BigInt(t),d:1n};}else throw new Error("Expected an integer or parenthesized expression.");depth--;return value;}
  function product():Fraction{let a=atom();while(tokens[at]==="*"||tokens[at]==="/"){const op=tokens[at++],b=atom();a=op==="*"?reduce(a.n*b.n,a.d*b.d):reduce(a.n*b.d,a.d*b.n);}return a;}
  function sum():Fraction{let a=product();while(tokens[at]==="+"||tokens[at]==="-"){const op=tokens[at++],b=product();a=reduce(a.n*b.d+(op==="+"?1n:-1n)*b.n*a.d,a.d*b.d);}return a;}
  const a=sum();if(at!==tokens.length)throw new Error(`Unexpected token: ${tokens[at]}.`);return a.d===1n?String(a.n):`${a.n}/${a.d}`;
}
export type Worksheet={title:string;exercises:{prompt:string;expression:string;answer:string;line:number}[];language:"LessonScript 1.0"};
export function compileLesson(source:string):Worksheet{
  if(source.length>8000)throw new LessonError(1,"Program exceeds 8 KB.");
  const result:Worksheet={title:"Untitled worksheet",exercises:[],language:"LessonScript 1.0"};let titled=false;
  for(const [index,raw] of source.split("\n").entries()){
    const line=raw.trim();if(!line||line.startsWith("#"))continue;
    const title=/^title\s+"([^"\r\n]{1,120})"\s*$/.exec(line);
    if(title){if(titled)throw new LessonError(index+1,"Use one title per worksheet.");result.title=title[1];titled=true;continue;}
    const exercise=/^exercise\s+"([^"\r\n]{1,200})"\s*=\s*(.+)$/.exec(line);
    if(!exercise)throw new LessonError(index+1,'Expected title "..." or exercise "..." = arithmetic.');
    if(result.exercises.length>=30)throw new LessonError(index+1,"A worksheet supports at most 30 exercises.");
    try{result.exercises.push({prompt:exercise[1],expression:exercise[2],answer:evaluateExpression(exercise[2]),line:index+1});}catch(e){throw new LessonError(index+1,(e as Error).message);}
  }
  if(!result.exercises.length)throw new LessonError(1,"Add at least one exercise.");return result;
}
