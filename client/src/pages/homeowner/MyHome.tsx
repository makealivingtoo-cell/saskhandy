import {useState} from "react";
import {useAuth} from "@/_core/hooks/useAuth";
import {AppLayout} from "@/components/AppLayout";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {trpc} from "@/lib/trpc";
import {Link} from "wouter";
import {toast} from "sonner";
import SaveProfessional from "@/components/SaveProfessional";
export default function MyHome(){
 const {user,loading}=useAuth(),utils=trpc.useUtils();
 const q=trpc.myHome.overview.useQuery(undefined,{enabled:user?.userType==="homeowner",retry:false});
 const [label,setLabel]=useState(""),[city,setCity]=useState("Saskatoon"),[property,setProperty]=useState(""),[title,setTitle]=useState(""),[due,setDue]=useState("");
 const refresh=()=>void utils.myHome.overview.invalidate();
 const add=trpc.myHome.addProperty.useMutation({onSuccess:()=>{setLabel("");refresh();},onError:e=>toast.error(e.message)});
 const task=trpc.myHome.addTask.useMutation({onSuccess:()=>{setTitle("");setDue("");refresh();},onError:e=>toast.error(e.message)});
 const complete=trpc.myHome.completeTask.useMutation({onSuccess:refresh,onError:e=>toast.error(e.message)});
 const remove=trpc.myHome.removeTask.useMutation({onSuccess:refresh,onError:e=>toast.error(e.message)});
 if(loading||q.isLoading&&user?.userType==="homeowner")return <AppLayout><div className="h-40 animate-pulse rounded-xl bg-muted" aria-label="Loading My Home"/></AppLayout>;
 if(!user||user.userType!=="homeowner")return <AppLayout><p>Sign in as a homeowner to use My Home.</p><Link href="/sign-in">Sign in</Link></AppLayout>;
 if(q.isError)return <AppLayout><p>My Home is temporarily unavailable.</p><Button onClick={()=>void q.refetch()}>Try again</Button></AppLayout>;
 if(!q.data?.enabled)return <AppLayout><p>My Home is not available yet.</p><Link href="/dashboard">Back to your jobs</Link></AppLayout>;
 const data=q.data;
 return <AppLayout><div className="mx-auto max-w-4xl space-y-6"><header><h1 className="text-3xl font-serif">My Home</h1><p className="mt-2 text-sm text-muted-foreground">Keep your home projects, maintenance and favourite professionals organized.</p></header>
 <section className="space-y-4 rounded-2xl border bg-white p-5"><h2 className="text-lg font-semibold">Your properties</h2>{data.properties.length===0?<p className="text-sm text-muted-foreground">Add a home to start your maintenance list. No street address required.</p>:data.properties.map(p=><div className="rounded-xl border p-3" key={p.id}><p className="font-medium">{p.label}</p><p className="text-sm text-muted-foreground">{p.city}</p></div>)}
 <form className="grid gap-3 sm:grid-cols-2" onSubmit={e=>{e.preventDefault();add.mutate({label,city});}}><label className="text-sm font-medium">Property name<Input value={label} onChange={e=>setLabel(e.target.value)} maxLength={100} required placeholder="My home"/></label><label className="text-sm font-medium">City<Input value={city} onChange={e=>setCity(e.target.value)} maxLength={100} required/></label><Button className="sm:col-span-2" disabled={add.isPending}>Add property</Button></form></section>
 <section className="space-y-4 rounded-2xl border bg-white p-5"><h2 className="text-lg font-semibold">Maintenance reminders</h2><p className="text-sm text-muted-foreground">We'll send an in-app reminder when a task is due.</p>{data.maintenance.length===0?<p className="text-sm text-muted-foreground">No tasks yet.</p>:data.maintenance.map(t=><div key={t.id} className="flex flex-wrap items-center gap-3 rounded-xl border p-3"><label className="flex flex-1 items-center gap-3 text-sm"><input type="checkbox" checked={t.completed} disabled={complete.isPending} onChange={e=>complete.mutate({id:t.id,completed:e.target.checked})}/><span><span className={t.completed?"line-through":""}>{t.title}</span><span className="block text-xs text-muted-foreground">{t.dueDate} · {data.properties.find(p=>p.id===t.propertyId)?.label??"Property"}</span></span></label><Button variant="ghost" size="sm" disabled={remove.isPending} onClick={()=>{if(window.confirm("Remove this maintenance task?"))remove.mutate({id:t.id});}}>Remove</Button></div>)}
 {data.properties.length>0&&<form className="grid gap-3" onSubmit={e=>{e.preventDefault();task.mutate({propertyId:Number(property||data.properties[0].id),title,dueDate:due});}}><label className="text-sm font-medium">Property<select className="mt-1 block w-full rounded-md border p-2" value={property||String(data.properties[0].id)} onChange={e=>setProperty(e.target.value)}>{data.properties.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}</select></label><label className="text-sm font-medium">Task<Input required maxLength={160} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Replace furnace filter"/></label><label className="text-sm font-medium">Due date<Input required type="date" value={due} onChange={e=>setDue(e.target.value)}/></label><Button disabled={task.isPending}>Add reminder</Button></form>}</section>
 <section className="space-y-3 rounded-2xl border bg-white p-5"><h2 className="text-lg font-semibold">Saved professionals</h2>{data.saved.length===0?<p className="text-sm text-muted-foreground">Save professionals from their profiles to find them again easily.</p>:data.saved.map(p=><div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3"><div><Link href={`/profile/${p.id}`} className="font-medium text-primary">{p.name??"Professional"}</Link><p className="text-sm text-muted-foreground">{p.serviceArea??"Service area not listed"}</p></div><SaveProfessional handymanId={p.id}/></div>)}</section>
 <section className="space-y-3 rounded-2xl border bg-white p-5"><h2 className="text-lg font-semibold">Completed projects</h2>{data.history.length===0?<p className="text-sm text-muted-foreground">Completed SaskHandy jobs will appear here.</p>:data.history.map(j=><div key={j.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3"><Link href={`/jobs/${j.id}`} className="font-medium text-primary">{j.title}</Link><div className="flex gap-2">{j.handymanId&&<Link href={`/profile/${j.handymanId}`} className="text-sm underline">Professional</Link>}<Button asChild size="sm" variant="outline"><Link href="/post-job">New request</Link></Button></div></div>)}</section>
 </div></AppLayout>;
}
