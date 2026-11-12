import test from 'node:test';
import assert from 'node:assert/strict';
import {buildFirmBrief} from '../dist/firm-brief.mjs';
test('partner briefing uses record dates, excludes closed work, and flags record inconsistencies',()=>{
 const state={matters:[{id:'M1',name:'Fictional One',stage:'Intake',created:'2026-10-01',owner:'Unassigned'},{id:'M2',stage:'Discovery',created:'2026-10-01',owner:'Attorney'},{id:'M3',stage:'Closed',created:'2026-01-01'}],tasks:[{id:'T1',matter:'M2',title:'Overdue task',date:'2026-11-11'},{id:'T2',matter:'missing',title:'Orphan task',date:'2026-11-19'},{id:'T3',matter:'M2',title:'Later task',date:'2026-11-20'},{id:'T4',matter:'M2',title:'Done',date:'2026-11-01',done:true}],documents:[{matter:'M2',created:'2026-11-11'}],calls:[{id:'C1',status:'Callback requested'},{id:'C2',status:'Returned by team'}],approvals:[{id:'R1',status:'Pending review'}],appointments:[{id:'A1',resource:'Team',start:'2026-11-13T15:00Z',duration:30,status:'Reserved'},{id:'A2',resource:'Team',start:'2026-11-13T15:15Z',duration:30,status:'Reserved'},{id:'A3',resource:'Team',start:'2026-11-13T15:00Z',status:'Cancelled'}]};
 const before=JSON.stringify(state),brief=buildFirmBrief(state,new Date('2026-11-12T14:00:00Z'));
 assert.deepEqual(brief.counts,{due:2,callbacks:1,reviews:1,stale:1});
 assert.equal(brief.items[0].source,'T1');assert.deepEqual(brief.checks.map(c=>c.count),[1,1,1,1]);
 assert.equal(JSON.stringify(state),before);
 assert.ok(!brief.items.some(item=>item.source==='M3'));
});
test('briefing dates use New York midnight rather than UTC and unknown activity is not invented',()=>{
 const brief=buildFirmBrief({matters:[{id:'M1',stage:'Investigation',owner:'Attorney'}],tasks:[{id:'T1',title:'Today',date:'2026-11-11'}]},new Date('2026-11-12T02:00:00Z'));
 assert.equal(brief.asOf,'2026-11-11');assert.equal(brief.counts.stale,0);assert.equal(brief.items[0].label,'Today');
});
