import assert from 'node:assert/strict';
import { minor,balance,flows,history,parseCSV,csvCell } from './lib/finance.ts';
assert.equal(minor('0.10','BDT')+minor('0.20','BDT'),30);
assert.equal(minor('1303200','BDT'),130320000);
assert.equal(minor('100','JPY'),100);
assert.equal(minor('-0.10','BDT'),-10);
assert.throws(()=>minor('1.01','JPY'));
assert.throws(()=>minor('0.001','EUR'));
const a={id:'a',opening:120000000,date:'2026-10-01'};
const ts=[['02',4500000,'credit'],['04',1500000,'debit'],['06',8000000,'credit'],['08',800000,'debit'],['10',120000,'credit']].map(([d,n,direction])=>({account:'a',date:'2026-10-'+d,amount:Number(n),direction:String(direction)}));
assert.equal(balance(a,ts),130320000);
assert.equal(balance(a,ts,'2026-10-03'),124500000);
assert.equal(balance(a,ts,'2026-09-30'),0);
assert.equal(balance(a,[...ts,{account:'a',date:'2026-10-05',amount:100,direction:'credit',deleted:1}]),130320000);
assert.deepEqual(flows([{amount:100,direction:'credit',transfer:'pair'},{amount:100,direction:'debit',transfer:'pair'},{amount:30,direction:'credit'},{amount:10,direction:'debit'}]),{income:30,expense:10});
assert.equal(history(a,ts,'2026-09-30','2026-10-03').length,3);
assert.deepEqual(parseCSV('date,description\n2026-10-01,"A, B"\n'),[['date','description'],['2026-10-01','A, B']]);
assert.deepEqual(parseCSV('a,b\r\n"x""y","line\n2"'),[['a','b'],['x"y','line\n2']]);
assert.throws(()=>parseCSV('"not closed'));
assert.equal(csvCell('=HYPERLINK("bad")'),'"\'=HYPERLINK(""bad"")"');

for(const [opening,entries,expected] of [
 ['1000000',[['50000','credit'],['20000','debit']],'1030000'],
 ['500000',[['100000','credit'],['30000','debit'],['20000','debit']],'550000']
] as const){assert.equal(balance({id:'case',opening:minor(opening,'BDT'),date:'2026-01-01'},entries.map(([amount,direction])=>({account:'case',date:'2026-01-02',amount:minor(amount,'BDT'),direction}))),minor(expected,'BDT'))}
const transfer=[{account:'a',date:'2026-01-02',amount:10000000,direction:'debit',transfer:'p'},{account:'b',date:'2026-01-02',amount:10000000,direction:'credit',transfer:'p'}];
assert.equal(balance({id:'a',opening:50000000,date:'2026-01-01'},transfer)+balance({id:'b',opening:0,date:'2026-01-01'},transfer),50000000);
assert.deepEqual(flows(transfer),{income:0,expense:0});
assert.equal(minor('2000000','BDT')-minor('800000','BDT'),minor('1200000','BDT'));
console.log('Financial engine: 21 assertions passed.');

