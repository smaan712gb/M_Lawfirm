const day=value=>{
 if(!value)return null;
 const parsed=new Date(value);if(Number.isNaN(parsed.getTime()))return null;
 return /^\d{4}-\d{2}-\d{2}$/.test(value)?value:new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York'}).format(parsed);
};
const elapsed=(a,b)=>Math.floor((Date.parse(a+'T12:00:00Z')-Date.parse(b+'T12:00:00Z'))/86400000);
export function buildFirmBrief(state,now=new Date()){
 const asOf=day(now.toISOString()),matters=(state.matters||[]).filter(m=>m.stage!=='Closed'),openTasks=(state.tasks||[]).filter(t=>!t.done);
 const due=openTasks.filter(t=>day(t.date)&&elapsed(day(t.date),asOf)<=7).sort((a,b)=>a.date.localeCompare(b.date));
 const callbacks=(state.calls||[]).filter(c=>c.status==='Callback requested');
 const reviews=(state.approvals||[]).filter(a=>a.status==='Pending review');
 const missingFollowup=matters.filter(m=>m.stage==='Intake'&&!openTasks.some(t=>t.matter===m.id));
 const lastRecorded=m=>{
  const dates=[m.created,...['documents','files','messages','jobs','clientUpdates'].flatMap(key=>(state[key]||[]).filter(r=>r.matter===m.id).map(r=>r.created||r.uploaded||r.date))].map(day).filter(d=>d&&d<=asOf);
  return dates.sort().at(-1)||null;
 };
 const stale=matters.map(m=>({...m,lastRecorded:lastRecorded(m)})).filter(m=>m.lastRecorded&&elapsed(asOf,m.lastRecorded)>=14);
 const items=[
  ...due.map(t=>({priority:day(t.date)<asOf?0:day(t.date)===asOf?1:2,orderDate:day(t.date),title:t.title,detail:`${t.matter||'Firm task'} · ${t.owner||'Unassigned'} · ${t.date}`,source:t.id,view:'tasks',label:day(t.date)<asOf?'Overdue':day(t.date)===asOf?'Today':'Next 7 days'})),
  ...callbacks.map(c=>({priority:1,title:'Return the requested call',detail:`${c.name} · ${c.phone}`,source:c.id,view:'reception',label:'Callback'})),
  ...reviews.map(r=>({priority:1,title:r.title||'Review prepared work',detail:`${r.matter||'Unlinked matter'} · ${r.gate||'Review requested'}`,source:r.id,view:'approvals',label:'Attorney review'})),
  ...missingFollowup.map(m=>({priority:1,title:'Assign the next intake step',detail:`${m.id} · ${m.name}`,source:m.id,view:'matters',label:'Follow-up missing'})),
  ...stale.map(m=>({priority:3,title:'Check the matter’s progress',detail:`${m.id} · ${m.name} · last recorded activity ${m.lastRecorded}`,source:m.id,view:'matters',label:'14+ days'}))
 ].sort((a,b)=>a.priority-b.priority||(a.orderDate||asOf).localeCompare(b.orderDate||asOf)||String(a.title||'').localeCompare(String(b.title||'')));
 const orphanTasks=openTasks.filter(t=>t.matter&&!(state.matters||[]).some(m=>m.id===t.matter));
 const unassigned=matters.filter(m=>!m.owner||m.owner==='Unassigned');
 const reserved=(state.appointments||[]).filter(a=>a.status==='Reserved');
 const overlaps=reserved.filter((a,index)=>reserved.some((b,j)=>j<index&&a.resource===b.resource&&Date.parse(a.start)<Date.parse(b.start)+(b.duration||30)*60000&&Date.parse(b.start)<Date.parse(a.start)+(a.duration||30)*60000));
 const checks=[
  {title:'Every intake has a next step',count:missingFollowup.length,detail:missingFollowup.map(m=>m.id).join(', '),view:'tasks'},
  {title:'Every active matter has an owner',count:unassigned.length,detail:unassigned.map(m=>m.id).join(', '),view:'matters'},
  {title:'Tasks link to existing matters',count:orphanTasks.length,detail:orphanTasks.map(t=>t.id).join(', '),view:'tasks'},
  {title:'Reserved team appointments do not overlap',count:overlaps.length,detail:overlaps.map(a=>a.id).join(', '),view:'reception'}
 ];
 return {asOf,preparedAt:now.toISOString(),counts:{due:due.length,callbacks:callbacks.length,reviews:reviews.length,stale:stale.length},items,checks};
}
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function mountFirmBrief(root,ctx){
 function draw(){
  const brief=buildFirmBrief(ctx.read());
  root.innerHTML=`<div class="toolbar"><span class="badge">${esc(brief.asOf)} · NEW YORK</span><button class="button outline small" data-refresh-brief>Refresh briefing ↻</button></div><div class="stats-grid">${[['due','TASKS DUE','Overdue and next seven days'],['callbacks','CALLBACKS WAITING','Requested, not yet returned'],['reviews','PENDING REVIEWS','Explicit attorney review requests'],['stale','MATTERS TO CHECK','No recorded activity in 14+ days']].map(([key,label,detail])=>`<div class="stat"><p>${label}</p><strong>${brief.counts[key]}</strong><small>${detail}</small></div>`).join('')}</div><div class="os-grid"><section class="panel"><div class="panel-head"><h2>Today’s priorities</h2><span class="badge gray">${brief.items.length} recorded items</span></div>${brief.items.map(item=>`<div class="source-item"><span class="badge ${item.priority===0?'amber':'gray'}">${esc(item.label)}</span><h3>${esc(item.title)}</h3><p>${esc(item.detail)}</p><button class="inline-link" data-brief-go="${item.view}">${({tasks:'View task',reception:'Open reception',approvals:'Review work',matters:'Open matters'})[item.view]} ↗</button></div>`).join('')||'<p class="subtle">No priorities are flagged by the current records.</p>'}</section><section class="panel"><div class="panel-head"><h2>Workspace cross-checks</h2></div>${brief.checks.map(check=>`<div class="source-item"><span class="badge ${check.count?'amber':''}">${check.count?check.count+' to review':'No issue found'}</span><h3>${esc(check.title)}</h3>${check.detail?`<p>${esc(check.detail)}</p><button class="inline-link" data-brief-go="${check.view}">Review records ↗</button>`:''}</div>`).join('')}<p class="subtle">These checks compare stored records. Task dates come from the team; they are not court-calculated deadlines. Missing activity can mean an incomplete record. Review external work in Attorney review.</p><button class="button dark small" data-brief-go="approvals">Open attorney review ↗</button></section></div><p class="subtle">Prepared ${esc(new Date(brief.preparedAt).toLocaleString('en-US',{timeZone:'America/New_York'}))} ET. Refresh for the latest workspace records. Scheduled delivery is not enabled.</p>`;
 }
 root.onclick=async event=>{
  const link=event.target.closest('[data-brief-go]');if(link){ctx.go(link.dataset.briefGo);return}
  const refresh=event.target.closest('[data-refresh-brief]');if(refresh){refresh.disabled=true;try{await ctx.refresh();draw()}catch(error){ctx.toast(error.message);refresh.disabled=false}}
 };
 draw();
}
