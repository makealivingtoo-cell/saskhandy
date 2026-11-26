import {useState} from "react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {trpc} from "@/lib/trpc";
import {toast} from "sonner";
import {Link} from "wouter";
export default function ProfessionalTools({userId}:{userId:number}){
 const q=trpc.proTools.overview.useQuery(undefined,{retry:false});
 const [search,setSearch]=useState("");
 if(q.isError)return <p className="rounded-xl border p-3 text-sm">Business tools are temporarily unavailable.</p>;
 if(!q.data?.enabled)return null;
 const data=q.data;
 const customers=data.customers.filter(c=>(c.name+" "+(c.email??"")+" "+(c.phone??"")).toLowerCase().includes(search.trim().toLowerCase()));
 const currency=(v:number)=>new Intl.NumberFormat("en-CA",{style:"currency",currency:"CAD"}).format(v);
 return <section className="space-y-4 rounded-2xl border bg-white p-5">
 <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Your business</h2><p className="text-sm text-muted-foreground">Your recent quotes and customer history.</p></div><Button variant="outline" onClick={async()=>{try{await navigator.clipboard.writeText(window.location.origin+"/profile/"+userId);toast.success("Profile link copied.");}catch{toast.error("Could not copy the link.");}}}>Copy profile link</Button></div>
 {data.summary&&<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[[String(data.summary.total),"Recent quotes"],[String(data.summary.awaiting),"Awaiting response or payment"],[String(data.summary.paid),"Paid quotes"],[currency(data.summary.paidAmount),"Gross paid quote value"]].map(([v,label])=><div key={label} className="rounded-xl bg-muted/40 p-3"><p className="text-lg font-semibold">{v}</p><p className="text-xs text-muted-foreground">{label}</p></div>)}</div>}
 <p className="text-xs text-muted-foreground">Based on up to 500 recent quotes. Gross amounts include taxes and are not payout or profit.</p>
 <details><summary className="cursor-pointer font-medium">Customers ({data.customers.length})</summary><div className="mt-3 space-y-2"><Input type="search" placeholder="Find a customer" aria-label="Search customers" value={search} onChange={e=>setSearch(e.target.value)}/>{customers.length===0?<p className="text-sm text-muted-foreground">No matching customer records.</p>:customers.map(c=><details key={c.key} className="rounded-lg border p-3"><summary className="cursor-pointer text-sm font-medium">{c.name} · {c.quotes.length} quote{c.quotes.length===1?"":"s"}</summary><div className="mt-2 space-y-2 text-sm"><p>{c.email??""} {c.phone??""}</p>{c.quotes.map(row=><p key={row.id} className="text-muted-foreground">{row.title} · {currency(Number(row.totalAmount))} · {row.status.replaceAll("_"," ")}</p>)}</div></details>)}</div></details>
 <Link href={`/profile/${userId}`} className="text-sm font-medium text-primary underline">View public profile</Link>
 </section>;
}
