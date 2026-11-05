import fs from 'node:fs/promises';
import path from 'node:path';
const dest = path.resolve('dist/data');
const endpoint = 'https://www.safekorea.go.kr/safekorea-kor/flsm/flsm/facilityDataList.do';
const types = [
  ['civil','TFK_CIVIL_EMR_FACL_TEMP','민방위대피소'],
  ['earthquake','TFK_ACMD_SPCE_FCLTY_TEMP','지진옥외대피소'],
  ['temporary','TFK_ACMDFCLTY_TEMP','이재민임시주거시설'],
  ['heat','TFK_HTW_RSTR_TEMP','무더위쉼터'],
  ['cold','TFK_CDW_RSTR_TEMP','한파쉼터'],
];
await fs.mkdir(dest,{recursive:true});
const boundaryResponse=await fetch('https://www.safekorea.go.kr/safekorea-kor/data/map/ssg_geojson.json');
if(!boundaryResponse.ok)throw new Error('Boundary download failed');
await fs.writeFile(path.resolve('../regions-raw.json'),await boundaryResponse.text());
for(const [type,tableNm,tableKorNm] of types) {
  const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({tableNm,tableKorNm,sggCd:'',page:'1',size:'5'}),signal:AbortSignal.timeout(60000)});
  if(!response.ok) throw new Error(`${type}: HTTP ${response.status}`);
  const raw=await response.json();
  if(!Array.isArray(raw.mapList)) throw new Error(`${type}: missing mapList`);
  // Temporary raw data stays outside the repository; never publish contact/person fields.
  await fs.writeFile(path.resolve(`../${type}-raw.json`),JSON.stringify(raw));
  console.log(JSON.stringify({type,count:raw.mapList.length,keys:Object.keys(raw.mapList[0]||{}).filter(k=>!/nm$|tel|register|updusr/i.test(k)),example:raw.mapList[0]?.title||raw.mapList[0]?.facilNm}));
}
