import assert from 'node:assert/strict';
import {demoAccounts,demoTransactions,demoRecords,demoDocuments,demoCSV,demoSummary,DEMO_START,DEMO_END} from './lib/demo.ts';
import {balance,flows,minor} from './lib/finance.ts';
import {convertMinor,normalizeRate} from './lib/exchange.ts';
import {destinations} from './lib/countries.ts';
let checks=0;function equal(a:unknown,b:unknown){assert.deepEqual(a,b);checks++}function ok(v:unknown){assert.ok(v);checks++}function rejects(f:()=>unknown){assert.throws(f);checks++}
equal(demoAccounts.length,3);equal(new Set(demoTransactions.map(t=>t.date.slice(0,7))).size,12);equal(demoTransactions.length,125);
for(const a of demoAccounts){equal(balance(a,demoTransactions),a.opening+demoTransactions.filter(t=>t.account===a.id).reduce((n,t)=>n+(t.direction==='credit'?t.amount:-t.amount),0));for(const t of demoTransactions.filter(t=>t.account===a.id))ok(balance(a,demoTransactions,t.date)>=0)}
equal(balance(demoAccounts[0],demoTransactions),minor('1167600','BDT'));equal(balance(demoAccounts[1],demoTransactions),minor('1500000','BDT'));equal(balance(demoAccounts[2],demoTransactions),minor('5200','EUR'));
for(const transfer of new Set(demoTransactions.filter(t=>t.transfer).map(t=>t.transfer))){const pair=demoTransactions.filter(t=>t.transfer===transfer);equal(pair.length,2);equal(pair[0].amount,pair[1].amount);equal(flows(pair),{income:0,expense:0})}
const allBDT=demoTransactions.filter(t=>t.account!=='demo-e');const f=flows(allBDT);equal(f.income-f.expense,balance(demoAccounts[0],allBDT)+balance(demoAccounts[1],allBDT)-demoAccounts[0].opening-demoAccounts[1].opening);
for(const name of ['Germany','Italy','Canada','Japan','South Korea'])ok(demoRecords.some(r=>r.kind==='target'&&JSON.parse(r.data).name===name));equal(demoDocuments.length,5);ok(demoDocuments.every(d=>d.name.startsWith('DEMO-')));ok(!destinations.some(c=>c.name==='Thailand'));equal(destinations.length,41);
const summary=demoSummary();equal(summary.start,DEMO_START);equal(summary.end,DEMO_END);ok(summary.label.includes('NOT FINANCIAL EVIDENCE'));ok(demoCSV().startsWith('"DEMO / SAMPLE'));equal(demoCSV().split('\r\n').length,demoTransactions.length+2);
equal(convertMinor('0.10','EUR','BDT','137.93'),1379);equal(convertMinor('100','JPY','EUR','0.006'),60);equal(convertMinor('1','EUR','JPY','177.35'),177);equal(convertMinor('1000','EUR','BDT','137.93','50','2'),13512140);equal(convertMinor('0.01','EUR','EUR','0.5'),1);
for(const fn of [()=>convertMinor('-1','EUR','BDT','137'),()=>convertMinor('1','EUR','BDT','0'),()=>convertMinor('1','EUR','BDT','1','0','101'),()=>convertMinor('1.001','EUR','BDT','1'),()=>convertMinor('1','EUR','BDT','1e20')])rejects(fn);
const now=Date.parse('2026-10-09T12:00:00Z'),raw={date:'2026-10-09',base:'EUR',quote:'BDT',rate:137.93};equal(normalizeRate(raw,'EUR','BDT',undefined,now).date,'2026-10-09');equal(normalizeRate({...raw,date:'2026-10-01'},'EUR','BDT',undefined,now).stale,true);equal(normalizeRate({...raw,date:'2025-01-01'},'EUR','BDT','2025-01-02',now).stale,false);
for(const x of [{...raw,rate:-1},{...raw,quote:'USD'},{...raw,date:'2026-10-10'},{...raw,date:'2026-02-30'}])rejects(()=>normalizeRate(x,'EUR','BDT',undefined,now));
console.log(`V2.3 demo + financial FX policy: ${checks} assertions passed.`);
