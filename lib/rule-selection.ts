export function selectCurrentRules<T extends {country:string;data:string;created?:string;version?:number}>(rows:T[],day:string):T[]{
 const seen=new Set<string>();
 return [...rows].sort((a,b)=>(b.created||'').localeCompare(a.created||'')||(b.version||0)-(a.version||0)).filter(r=>{
 try{const x=JSON.parse(r.data);if(typeof x.effective!=='string'||x.effective>day||x.status==='Draft')return false;
 const key=JSON.stringify([r.country,x.category,x.nationality,x.jurisdiction]);if(seen.has(key))return false;seen.add(key);
 return x.status==='Verified'&&typeof x.verified==='string'&&x.verified<=day&&typeof x.source==='string'&&x.source.startsWith('https://')&&URL.canParse(x.source);
 }catch{return false}
 });
}
