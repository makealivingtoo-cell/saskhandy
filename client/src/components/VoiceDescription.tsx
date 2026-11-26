import {useEffect,useRef,useState} from "react";
import {Button} from "@/components/ui/button";
import {Mic,MicOff} from "lucide-react";
import {toast} from "sonner";
type Recognition={lang:string;continuous:boolean;interimResults:boolean;onresult:((e:{results:ArrayLike<ArrayLike<{transcript:string}>>})=>void)|null;onerror:(()=>void)|null;onend:(()=>void)|null;start:()=>void;stop:()=>void;abort:()=>void};
type RecognitionWindow=Window&{SpeechRecognition?:new()=>Recognition;webkitSpeechRecognition?:new()=>Recognition};
export default function VoiceDescription({onText}:{onText:(text:string)=>void}){
 const ref=useRef<Recognition|null>(null),[recording,setRecording]=useState(false),[supported,setSupported]=useState(false);
 useEffect(()=>{const w=window as RecognitionWindow;setSupported(!!(w.SpeechRecognition||w.webkitSpeechRecognition));return()=>{ref.current?.abort();};},[]);
 if(!supported)return null;
 const start=()=>{if(recording){ref.current?.stop();return;}const w=window as RecognitionWindow,C=w.SpeechRecognition||w.webkitSpeechRecognition;if(!C)return;
 if(!window.confirm("Use your microphone to dictate the request? Your browser may send audio to its speech recognition provider. Review the text before submitting."))return;
 const rec=new C();rec.lang="en-CA";rec.continuous=false;rec.interimResults=false;
 rec.onresult=e=>{const text=Array.from(e.results).map(r=>r[0]?.transcript??"").join(" ").trim();if(text)onText(text);};
 rec.onerror=()=>{setRecording(false);toast.error("Voice input was unavailable. You can type your request instead.");};rec.onend=()=>{setRecording(false);ref.current=null;};
 try{ref.current=rec;rec.start();setRecording(true);}catch{ref.current=null;setRecording(false);toast.error("Could not access your microphone.");}
 };
 return <Button type="button" size="sm" variant="outline" onClick={start}>{recording?<MicOff className="mr-2 h-4 w-4"/>:<Mic className="mr-2 h-4 w-4"/>}{recording?"Stop dictation":"Use voice"}</Button>;
}
