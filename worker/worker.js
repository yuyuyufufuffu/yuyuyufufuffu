// Cloudflare Worker backend for Yu's public AI profile.
// Set OPENAI_API_KEY as a Cloudflare *Secret*, never inside GitHub.
// Change ALLOWED_ORIGIN if your domain changes.
const ALLOWED_ORIGIN = 'https://yuyuyufufuffu.github.io';
const SYSTEM = `You are Yu's professional website assistant. Reply in friendly, concise English.
Known public facts: Yu is an independent English educator. Areas include IELTS,
TOEFL iBT, SAT Reading & Writing, Cambridge English qualifications, curriculum design,
structured reading and writing instruction, personalized practice and student feedback.
Yu is interested in responsible AI in education: lesson planning, adaptive practice,
writing feedback and educational automation. These are interests, not released projects.
Do not invent qualifications, employment, location, contact information, prices,
student identities, or credentials. If asked about unknown facts, say you don't know.
Do not present yourself as Yu or claim to be a human. You are an AI guide to this profile.
Do not request or disclose student personal details. You can't book lessons or email Yu.`;
function headers(origin){return {'Access-Control-Allow-Origin': origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};}
function json(body,status,origin){return new Response(JSON.stringify(body),{status,headers:{...headers(origin),'Content-Type':'application/json; charset=utf-8'}})}
export default {
 async fetch(request, env){
  const origin=request.headers.get('Origin')||'';
  if(origin !== ALLOWED_ORIGIN) return json({error:'Origin not allowed'},403,origin);
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:headers(origin)});
  if(request.method!=='POST') return json({error:'Use POST'},405,origin);
  const size=Number(request.headers.get('content-length')||0);
  if(size>14000) return json({error:'Message too long'},413,origin);
  if(!env.OPENAI_API_KEY) return json({error:'Server not configured'},503,origin);
  let body;try{body=await request.json()}catch{return json({error:'Invalid JSON'},400,origin)}
  const message=typeof body.message==='string'?body.message.trim():'';
  if(!message || message.length>500) return json({error:'Please enter a message up to 500 characters'},400,origin);
  const history=Array.isArray(body.history)?body.history.slice(-8):[];
  const safeHistory=history.filter(m=>m && ['user','assistant'].includes(m.role) && typeof m.content==='string').map(m=>({role:m.role,content:m.content.slice(0,500)}));
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),18000);
  try{
   const upstream=await fetch('https://api.openai.com/v1/responses',{
    method:'POST',
    headers:{'Authorization':`Bearer ${env.OPENAI_API_KEY}`,'Content-Type':'application/json'},
    body:JSON.stringify({model:'gpt-4.1-mini',instructions:SYSTEM,input:[...safeHistory,{role:'user',content:message}],max_output_tokens:280,store:false}),
    signal:controller.signal
   });
   if(!upstream.ok){return json({error:'AI provider request failed. Please try again later.'},502,origin)}
   const data=await upstream.json();
   const reply=(data.output||[]).flatMap(i=>i.content||[]).filter(c=>c.type==='output_text').map(c=>c.text).join('\n').trim();
   return json({reply:reply||'Sorry, I could not produce a response.'},200,origin);
  }catch{return json({error:'The AI service is currently unavailable.'},502,origin)}finally{clearTimeout(timeout)}
 }
};
