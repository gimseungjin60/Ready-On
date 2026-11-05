import fs from 'node:fs/promises';
import path from 'node:path';
import {pointInRegion} from '../dist/engine.mjs';
const out=path.resolve('dist/data');await fs.mkdir(out,{recursive:true});
const provinces={'11':'서울','26':'부산','27':'대구','28':'인천','29':'광주','30':'대전','31':'울산','36':'세종','41':'경기','42':'강원','51':'강원','43':'충북','44':'충남','45':'전북','52':'전북','46':'전남','47':'경북','48':'경남','50':'제주'};
const rawRegions=JSON.parse(await fs.readFile('../regions-raw.json','utf8'));
const regions=rawRegions.features.map(f=>{
 const polygons=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;
 const coords=polygons.flat(2);const xs=coords.map(c=>c[0]),ys=coords.map(c=>c[1]);
 const bbox=[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];
 const code=f.properties.ADM_SECT_C,name=f.properties.SGG_NM;
 return {code,name,label:[provinces[code.slice(0,2)],name].filter(Boolean).join(' '),bbox,center:{lat:(bbox[1]+bbox[3])/2,lng:(bbox[0]+bbox[2])/2},polygons:polygons.map(p=>p.map(r=>r.map(c=>c.map(v=>+v.toFixed(5)))))};
});
// Choose an interior representative point for archipelagos and concave regions.
for(const region of regions){
 if(pointInRegion(region.center,region))continue;
 const ordered=[...region.polygons].sort((a,b)=>b[0].length-a[0].length);
 outer:for(const poly of ordered){const ring=poly[0],xs=ring.map(c=>c[0]),ys=ring.map(c=>c[1]);const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  for(let y=1;y<20;y++)for(let x=1;x<20;x++){const point={lat:minY+(maxY-minY)*y/20,lng:minX+(maxX-minX)*x/20};if(pointInRegion(point,region)){region.center=point;break outer;}}
 }
 if(!pointInRegion(region.center,region))throw new Error(`No interior point for ${region.code}`);
}
await fs.writeFile(path.join(out,'regions.json'),JSON.stringify({source:'https://www.safekorea.go.kr/safekorea-kor/data/map/ssg_geojson.json',retrievedAt:'2026-11-05',regions}));
const buckets=new Map(),stats={};
for(const type of ['civil','earthquake','temporary','heat','cold']){
 const raw=JSON.parse(await fs.readFile(`../${type}-raw.json`,'utf8')).mapList;
 const unique=new Map();let invalid=0;
 for(const r of raw){
  if(r.useAt==='N'||r.fcltyOprnAt==='N'||(r.useSeCd&&r.useSeCd!=='1'))continue;
  const dms=(d,m,s)=>Number(d)+Number(m)/60+Number(s)/3600;
  const lat=type==='civil'?dms(r.facilLade,r.facilLami,r.facilLase):Number(r.la);
  const lng=type==='civil'?dms(r.facilLode,r.facilLomi,r.facilLose):Number(r.lo);
  if(!Number.isFinite(lat)||!Number.isFinite(lng)||lat<33||lat>39||lng<124||lng>132){invalid++;continue;}
  const name=String(r.facilNm||r.title||r.vtAcmdfcltyNm||r.rstrNm||'').trim();if(!name){invalid++;continue;}
  const address=String(r.facilRdAddr||r.facilAddr||r.adres||r.rnDtlAdresConvert||r.rnDtlAdres||'').trim();
  const key=`${name}|${lat.toFixed(5)}|${lng.toFixed(5)}`;
  const stamp=r.lastModfDt||r.modfTime||null;
  const updatedAt=stamp&&Number.isFinite(new Date(stamp).getTime())?new Date(stamp).toISOString().slice(0,10):null;
  const item={id:`${type}-${r.facilCode||r.acmdfcltySn||r.rstrFcltyNo||r.rnum}-${lat.toFixed(5)}-${lng.toFixed(5)}`,type,name,address,lat:+lat.toFixed(6),lng:+lng.toFixed(6),updatedAt};
  if(!unique.has(key)||String(updatedAt)>String(unique.get(key).updatedAt))unique.set(key,item);
 }
 for(const item of unique.values()){const grid=`${Math.floor(item.lat)}_${Math.floor(item.lng)}`;if(!buckets.has(grid))buckets.set(grid,[]);buckets.get(grid).push(item);}
 stats[type]={sourceRecords:raw.length,usable:unique.size,invalidCoordinates:invalid};
}
const cells=[];
for(const [id,records] of buckets){await fs.writeFile(path.join(out,`shelters-${id}.json`),JSON.stringify(records));const [lat,lng]=id.split('_').map(Number);cells.push({id,bbox:[lng,lat,lng+1,lat+1],count:records.length});}
const metadata={sourceName:'행정안전부 국민안전24 안전지도',sourceUrl:'https://www.safekorea.go.kr/safekorea-kor/flsm/flsm/facilitiesSafteyMap.do?menuSn=2',retrievedAt:'2026-11-05',liveAvailability:false,stats,cells};
await fs.writeFile(path.join(out,'shelters-index.json'),JSON.stringify(metadata));
console.log(JSON.stringify({stats,cells:cells.length,total:cells.reduce((n,c)=>n+c.count,0)}));
