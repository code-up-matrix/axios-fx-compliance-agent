import "./lab.css";
import type {ReactNode} from "react";
export const metadata={title:"CodeMatrix Labs · Devpost collection",description:"Focused products with traceable results and a transparent build status."};
export default function Layout({children}:{children:ReactNode}){return <div className="lab">{children}</div>;}
