export const VERSION = 1;
export const phases = ['Vorbereitung','Maischen','Läutern','Kochen','Whirlpool','Kühlen & Anstellen','Gärung','Abfüllung','Reifung','Genussbereit'];
export const uid = () => crypto.randomUUID();
export const now = () => new Date().toISOString();
export function number(value, required = false) {
  const text = String(value ?? '').trim();
  if (!text) { if (required) throw new Error('Bitte eine Menge oder einen Messwert eingeben.'); return null; }
  if (!/^\d+(?:[.,]\d+)?$/.test(text)) throw new Error('Bitte eine nicht negative Zahl eingeben, z. B. 4,5.');
  const n = Number(text.replace(',','.'));
  if (!Number.isFinite(n) || n > 100000) throw new Error('Der Wert ist zu groß.');
  return n;
}
export function createBatch(recipe, demo = false) {
  const date = new Date().toLocaleDateString('sv-SE');
  return {schemaVersion:VERSION,kind:'private-batch',id:uid(),demo,fast:false,createdAt:now(),updatedAt:now(),name:recipe.name,style:recipe.style,number:demo?'DEMO-001':`NOR-${date.replaceAll('-','')}`,date,description:'',recipe:structuredClone(recipe),checklist:[],events:[],audit:[],steps:recipe.steps.map((s,i)=>({id:s.id,status:i===0?'active':'open',startedAt:null,completedAt:null,durationMs:null}))};
}
export function audit(batch, action, detail) { batch.audit.push({id:uid(),at:now(),action,detail}); }
export function active(batch) { return batch.steps.find(s=>s.status==='active'); }
export function currentPhase(batch) { const step=active(batch); return step?(step.id==='ready'?'Reifung':batch.recipe.steps.find(s=>s.id===step.id).phase):'Genussbereit'; }
export function addEvent(batch, event) {
  if (batch.events.some(e=>e.id===event.id)) return false;
  if (!event.id || !validDate(event.at)) throw new Error('Ungültiger Ereigniszeitpunkt.');
  if (event.value !== null && event.value !== undefined && (!Number.isFinite(event.value)||event.value<0)) throw new Error('Ungültiger Wert.');
  batch.events.push({...event,public:event.public===true,deleted:false});
  audit(batch,'Eintrag erfasst',event.id); return true;
}
export function editEvent(batch, id, changes) {
  const e=batch.events.find(e=>e.id===id); if (!e) throw new Error('Eintrag nicht gefunden.');
  audit(batch,'Eintrag korrigiert',{before:structuredClone(e),changes:structuredClone(changes)});
  Object.assign(e,changes);
}
export function water(batch) {
  const sum=kind=>Math.round(batch.events.filter(e=>!e.deleted&&e.kind===kind).reduce((s,e)=>s+(e.value??0),0)*1000)/1000;
  const main=sum('main-water'),sparge=sum('sparge-water'),plan=batch.recipe.water.sparge;
  return {main,sparge,remaining:Math.max(0,Math.round((plan-sparge)*1000)/1000),total:Math.round((main+sparge)*1000)/1000,over:sparge>plan};
}
export function startTimer(batch, id, timestamp=now()) {
  const state=active(batch), spec=batch.recipe.steps.find(s=>s.id===id);
  if (!state || state.id!==id || !spec.minutes || state.startedAt) return false;
  if (spec.guard && !batch.steps.some(s=>s.id===spec.guard&&s.status==='done')) throw new Error('Zuerst Temperatur und Zugabe bestätigen.');
  state.startedAt=timestamp; state.durationMs=batch.demo&&batch.fast?3000:spec.minutes*60000;
  audit(batch,'Timer gestartet',{step:id,at:timestamp,durationMs:state.durationMs}); return true;
}
export function remaining(state, time=Date.now()) { return state?.startedAt?Math.max(0,state.durationMs-(time-Date.parse(state.startedAt))):null; }
export function completeStep(batch, id, {skip=false,reason='',time=now()}={}) {
  const state=active(batch); if (!state || state.id!==id) return false;
  const spec=batch.recipe.steps.find(s=>s.id===id);
  if(skip&&id==='ready')throw new Error('Genussbereitschaft braucht deine ausdrückliche Bestätigung. Dieser letzte Schritt bleibt bis dahin offen.');
  if (skip && !reason.trim()) throw new Error('Bitte einen Grund für das Überspringen eintragen.');
  if (!skip && (spec.minutes || state.startedAt) && (!state.startedAt || remaining(state,Date.parse(time))>0)) throw new Error('Bitte den Timer starten und die Zeit abwarten oder den Schritt mit Begründung überspringen.');
  if (!skip && spec.guard && !batch.steps.some(s=>s.id===spec.guard&&s.status==='done')) throw new Error('Die vorausgesetzte Zugabe muss bestätigt sein.');
  state.status=skip?'skipped':'done'; state.completedAt=time;
  audit(batch,skip?'Schritt übersprungen':'Schritt bestätigt',{step:id,reason,at:time});
  const next=batch.steps.find(s=>s.status==='open'); if(next)next.status='active'; return true;
}
export function reopenStep(batch,id,reason) {
  if(!reason.trim())throw new Error('Bitte die Korrektur kurz begründen.');
  const idx=batch.steps.findIndex(s=>s.id===id); if(idx<0)throw new Error('Schritt nicht gefunden.');
  audit(batch,'Ablauf korrigiert',{reason,previous:structuredClone(batch.steps),from:id});
  batch.steps.slice(idx).forEach((s,i)=>Object.assign(s,{status:i?'open':'active',startedAt:null,completedAt:null,durationMs:null}));
  // Existing quantity records remain in history; never book them a second time implicitly.
}
export function backup(batch) { return {schemaVersion:VERSION,kind:'nor-apa-backup',exportedAt:now(),batch:structuredClone(batch)}; }
const validDate=v=>typeof v==='string'&&Number.isFinite(Date.parse(v));
function insist(ok, message='Die Datei ist beschädigt oder enthält ungültige Chargendaten.') { if(!ok)throw new Error(message); }
function safeText(v) { return typeof v==='string'&&v.length<=20000; }
export function validateBackup(data) {
  insist(data?.schemaVersion===VERSION&&data.kind==='nor-apa-backup','Inkompatible Sicherung. Erwartet wird NOR APA Sicherung, Schema 1.');
  const b=data.batch;
  insist(b&&b.schemaVersion===VERSION&&b.kind==='private-batch'&&safeText(b.id)&&b.id.length>0&&safeText(b.name)&&safeText(b.style)&&safeText(b.number)&&safeText(b.description)&&/^\d{4}-\d{2}-\d{2}$/.test(b.date));
  insist(typeof b.demo==='boolean'&&typeof b.fast==='boolean'&&(!b.fast||b.demo)&&validDate(b.createdAt)&&validDate(b.updatedAt));
  const r=b.recipe;
  insist(r&&safeText(r.version)&&safeText(r.warning)&&Array.isArray(r.ingredients)&&r.ingredients.length<100&&Array.isArray(r.steps)&&r.steps.length>0&&r.steps.length<100&&Array.isArray(r.checklist)&&r.checklist.every(safeText));
  insist(r.ingredients.every(i=>safeText(i.name)&&safeText(i.unit)&&(i.amount===null||Number.isFinite(i.amount)&&i.amount>=0)&&safeText(i.note)));
  insist(r.water&&['main','sparge'].every(k=>Number.isFinite(r.water[k])&&r.water[k]>=0));
  insist(r.targets&&Object.values(r.targets).every(v=>v===null||Number.isFinite(v)&&v>=0));
  insist(r.steps.every(s=>safeText(s.id)&&safeText(s.title)&&safeText(s.instruction)&&safeText(s.action)&&phases.includes(s.phase)&&[s.temperature,s.minutes].every(v=>v===null||Number.isFinite(v)&&v>=0)));
  insist(r.steps.every(s=>!s.timerRequired||s.minutes>0));
  insist(new Set(r.steps.map(s=>s.id)).size===r.steps.length&&r.steps.every(s=>!s.guard||r.steps.some(t=>t.id===s.guard)));
  insist(Array.isArray(b.steps)&&b.steps.length===r.steps.length&&b.steps.every((s,i)=>s.id===r.steps[i].id&&['open','active','done','skipped'].includes(s.status)&&(s.completedAt===null||validDate(s.completedAt))&&(s.startedAt===null&&s.durationMs===null||validDate(s.startedAt)&&Number.isFinite(s.durationMs)&&s.durationMs>0)));
  const unfinished=b.steps.filter(s=>['open','active'].includes(s.status));
  insist(unfinished.length===0||unfinished[0].status==='active'&&unfinished.filter(s=>s.status==='active').length===1);
  const activeIndex=b.steps.findIndex(s=>s.status==='active');
  insist(activeIndex<0?b.steps.every(s=>['done','skipped'].includes(s.status)):b.steps.slice(0,activeIndex).every(s=>['done','skipped'].includes(s.status))&&b.steps.slice(activeIndex+1).every(s=>s.status==='open'));
  insist(b.steps.at(-1).id==='ready'&&b.steps.at(-1).status!=='skipped');
  insist(Array.isArray(b.checklist)&&b.checklist.every(Number.isInteger)&&Array.isArray(b.audit)&&b.audit.length<50000&&b.audit.every(a=>safeText(a.action)&&validDate(a.at)));
  insist(Array.isArray(b.events)&&b.events.length<50000&&new Set(b.events.map(e=>e.id)).size===b.events.length);
  insist(b.events.every(e=>safeText(e.id)&&safeText(e.kind)&&safeText(e.label)&&safeText(e.unit)&&safeText(e.method)&&safeText(e.text)&&typeof e.public==='boolean'&&typeof e.deleted==='boolean'&&validDate(e.at)&&(e.value===null||Number.isFinite(e.value)&&e.value>=0)));
  return structuredClone(b);
}
export function importBackup(text, existing=[]) {
  let data; try{data=JSON.parse(text);}catch{throw new Error('Die Datei ist kein lesbares JSON. Bitte eine NOR-APA-Sicherung auswählen.');}
  const b=validateBackup(data);
  if(existing.includes(b.id)){const old=b.id;b.id=uid();b.number+=' · Importkopie';audit(b,'Als Kopie importiert',{originalId:old});}
  b.updatedAt=now();return b;
}
export function publicExport(batch, consent) {
  if(!consent.basics)throw new Error('Bitte die Stammdaten ausdrücklich zur Veröffentlichung freigeben.');
  const out={schemaVersion:VERSION,kind:'nor-apa-public',demo:batch.demo,publishedAt:now(),name:batch.name,style:batch.style,number:batch.number,date:batch.date,status:currentPhase(batch),description:consent.description?batch.description:'',ingredients:[],milestones:[],measurements:[],notes:[]};
  if(consent.ingredients)out.ingredients=batch.recipe.ingredients.map(({name,amount,unit,note})=>({name,amount,unit,note}));
  if(consent.milestones)out.milestones=batch.steps.filter(s=>s.status==='done').map(s=>({title:batch.recipe.steps.find(r=>r.id===s.id).title,at:s.completedAt}));
  for(const e of batch.events.filter(e=>!e.deleted&&e.public)) {
    if(['note','tasting'].includes(e.kind)) out.notes.push({kind:e.kind,text:e.text,at:e.at});
    else out.measurements.push({kind:e.kind,label:e.label,value:e.value,unit:e.unit,method:e.method,at:e.at});
  }
  return out;
}
export function validatePublic(p) {
  insist(p&&p.schemaVersion===VERSION&&p.kind==='nor-apa-public'&&typeof p.demo==='boolean'&&validDate(p.publishedAt)&&['name','style','number','date','status','description'].every(k=>safeText(p[k])),'Die öffentliche Chargendatei ist ungültig oder inkompatibel.');
  insist(['ingredients','milestones','measurements','notes'].every(k=>Array.isArray(p[k])&&p[k].length<50000));
  insist(p.ingredients.every(i=>safeText(i.name)&&safeText(i.unit)&&safeText(i.note)&&(i.amount===null||Number.isFinite(i.amount)&&i.amount>=0))&&p.milestones.every(i=>safeText(i.title)&&validDate(i.at))&&p.notes.every(i=>safeText(i.text)&&validDate(i.at))&&p.measurements.every(i=>safeText(i.label)&&safeText(i.unit)&&safeText(i.method)&&validDate(i.at)&&(i.value===null||Number.isFinite(i.value)&&i.value>=0)));
  return p;
}
