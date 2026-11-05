/** Deterministic, dependency-free planning engine. Planning assumptions are NOT disaster forecasts. */
export const POLICY = Object.freeze({version:'2026-11-05.v1',urbanDays:3,ruralDays:7,islandDays:14,unknownDays:7,waterL:4,foodKcal:2000,foodKcalPerKg:4000});
export const HAZARDS = [
  {id:'all',name:'종합 대비',icon:'shield',caption:'공통 + 재난별 물품'},
  {id:'war',name:'전쟁·공습',icon:'radio'},
  {id:'flood',name:'홍수·호우',icon:'waves'},
  {id:'quake',name:'지진',icon:'activity'},
  {id:'typhoon',name:'태풍',icon:'wind'},
  {id:'fire',name:'화재·산불',icon:'flame'},
  {id:'cold',name:'폭설·한파',icon:'snow'},
  {id:'heat',name:'폭염',icon:'sun'},
  {id:'outage',name:'정전·단수',icon:'battery'},
];
export const CATEGORIES = {food:'식량·물',power:'조명·전원',care:'응급·위생',protect:'보온·보호',fire:'화재 대비'};
const catalog = [
 ['water','식수','L','food','drop','소모품',4,'음용·기본 생활용수 · 1일 4L 계획값'],
 ['food','건조식량','kg','food','food','소모품',0.5,'조리 없이 먹는 식품 · 4,000kcal/kg 가정'],
 ['bottle','접이식 물통','개','food','bottle','개인',1,'식품용 · 10L 이상'],
 ['torch','손전등','개','power','flashlight','개인',1,'예비 건전지와 규격 확인'],
 ['cells','예비 건전지','세트','power','battery','기간',3,'손전등 1회 교체분 / 3일 계획'],
 ['powerbank','보조배터리','개','power','battery','기간',3,'20,000mAh급 · 3일당 1개 계획'],
 ['radio','휴대용 라디오','개','power','radio','공동',1,'배터리식 또는 수동 충전식'],
 ['cable','충전 케이블','개','power','cable','개인',1,'사용 기기와 호환되는 규격'],
 ['firstaid','구급용품 세트','세트','care','medical','개인',1,'거즈·붕대·반창고 · 의약품 제외'],
 ['wipes','위생 물티슈','장','care','wipes','소모품',10,'1일 10장 계획값'],
 ['bags','폐기물 봉투','장','care','bag','소모품',2,'위생용 · 1일 2장 계획값'],
 ['mask','분진용 마스크','개','protect','mask','소모품',2,'분진용 · 유독가스 보호용 아님'],
 ['gloves','작업용 장갑','켤레','protect','gloves','개인',1,'손 보호용'],
 ['blanket','보온 담요','장','protect','blanket','개인',1,'개인 보온용'],
 ['whistle','호루라기','개','protect','whistle','개인',1,'위치 알림용'],
 ['pouch','방수 보관 파우치','개','protect','bag','개인',1,'문서·전자기기 보관'],
 ['extinguisher','소화기','대','fire','extinguisher','공동',1,'비치용 · 적응 화재와 인증 확인'],
];
const extras = {
 raincoat:['우의','벌','protect','rain','개인',1,'홍수·태풍 시 비·바람 대비'],
 waterproof:['방수 보관함','개','protect','box','공동',1,'물품을 물이 닿지 않는 곳에 보관'],
 helmet:['머리 보호용 안전모','개','protect','helmet','개인',1,'낙하물 대비 · 착용 규격 확인'],
 goggles:['보호안경','개','protect','glasses','개인',1,'먼지·파편 대비'],
 fireblanket:['소화포','장','fire','blanket','공동',1,'적용 가능한 작은 초기 화재에 한함'],
 warmers:['보온팩','개','protect','sun','소모품',2,'한파 대비 · 1일 2개 계획값'],
 sleeping:['침낭','개','protect','blanket','개인',1,'계절에 맞는 보온 규격'],
 hat:['차양 모자','개','protect','sun','개인',1,'야외 햇빛 노출 대비'],
 toilet:['비상 화장실 처리팩','개','care','wipes','소모품',5,'단수 대비 · 1일 5개 계획값'],
};
const hazardExtras = {war:['waterproof'],flood:['raincoat','waterproof'],quake:['helmet','goggles'],typhoon:['raincoat','waterproof'],fire:['goggles','fireblanket'],cold:['warmers','sleeping'],heat:['hat'],outage:['toilet']};
export function normalizeHazards(input=['all']) {
 if(!Array.isArray(input) || input.some(x=>!HAZARDS.some(h=>h.id===x))) throw new TypeError('지원하지 않는 재난 종류입니다.');
 const ids=[...new Set(input)]; return !ids.length||ids.includes('all')?['all']:ids;
}
export function validateLocation(location) {
 if(!location||!Number.isFinite(location.lat)||!Number.isFinite(location.lng)||Math.abs(location.lat)>90||Math.abs(location.lng)>180) throw new TypeError('올바른 위도와 경도를 입력하세요.');
 return {lat:location.lat,lng:location.lng};
}
export function distanceKm(a,b) {
 validateLocation(a);validateLocation(b);
 const rad=x=>x*Math.PI/180; const dlat=rad(b.lat-a.lat),dlng=rad(b.lng-a.lng);
 const x=Math.sin(dlat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dlng/2)**2;
 return 6371*2*Math.atan2(Math.sqrt(x),Math.sqrt(Math.max(0,1-x)));
}
export function pointInRegion(point,region) {
 const {lat:y,lng:x}=validateLocation(point);
 const b=region.bbox;if(x<b[0]||x>b[2]||y<b[1]||y>b[3])return false;
 const inRing=ring=>{let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){
  const [xi,yi]=ring[i],[xj,yj]=ring[j];if(((yi>y)!==(yj>y))&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)inside=!inside;
 }return inside;};
 return region.polygons.some(poly=>inRing(poly[0])&&!poly.slice(1).some(inRing));
}
// The official overview geometry has small gaps around some borders. Only use
// the closest boundary when it is within 500 m, and expose that approximation.
// This only selects a stock-planning policy; it never moves the user's map pin.
export function resolveRegion(point,regions,{boundaryToleranceKm=.5}={}) {
 validateLocation(point);const exact=regions.find(region=>pointInRegion(point,region));
 if(exact)return {region:exact,approximate:false};
 const kmX=111.32*Math.cos(point.lat*Math.PI/180),kmY=111.32;
 let nearest=null,best=boundaryToleranceKm;
 for(const region of regions){
  const b=region.bbox;if(point.lng<b[0]-best/kmX||point.lng>b[2]+best/kmX||point.lat<b[1]-best/kmY||point.lat>b[3]+best/kmY)continue;
  for(const polygon of region.polygons)for(const ring of polygon)for(let i=0,j=ring.length-1;i<ring.length;j=i++){
   const ax=(ring[j][0]-point.lng)*kmX,ay=(ring[j][1]-point.lat)*kmY,bx=(ring[i][0]-point.lng)*kmX,by=(ring[i][1]-point.lat)*kmY;
   const dx=bx-ax,dy=by-ay,den=dx*dx+dy*dy,t=den?Math.max(0,Math.min(1,-(ax*dx+ay*dy)/den)):0;
   const distance=Math.hypot(ax+t*dx,ay+t*dy);if(distance<best){best=distance;nearest=region;}
  }
 }
 return {region:nearest,approximate:!!nearest};
}
export function getRegionalPlan(region=null,accessibility=null) {
 if(accessibility!=null){
  const keys=['supply','road','season'];const weights=[0.45,0.4,0.15];
  if(keys.some(k=>typeof accessibility[k]!=='number'||!Number.isFinite(accessibility[k])||accessibility[k]<0||accessibility[k]>1))throw new TypeError('접근성 지표는 모두 0~1 사이 숫자여야 합니다.');
  const score=Math.round(keys.reduce((sum,k,i)=>sum+accessibility[k]*weights[i],0)*100);
  return {days:score<30?3:score<65?7:14,label:score<30?'접근 제약 낮음':score<65?'접근 제약 중간':'접근 제약 높음',basis:'host-accessibility',score,reason:'연결된 서비스의 접근성 지표에 서비스 계획 규칙을 적용했습니다.'};
 }
 if(!region)return {days:7,label:'기본 비축 기준',basis:'unknown',score:null,reason:'지역 정보가 없어 임시 7일 기준을 적용했습니다.'};
 if(region.name.includes('울릉'))return {days:14,label:'도서 지역 기준',basis:'administrative',score:null,reason:'울릉군의 도서 지역 특성을 반영한 서비스 기본 14일 기준입니다. 실제 보급·도로 상황은 반영하지 않습니다.'};
 if(region.name.endsWith('군'))return {days:7,label:'군 지역 기준',basis:'administrative',score:null,reason:'군 지역에 서비스 기본 7일 기준을 적용했습니다. 실제 보급·도로 상황은 반영하지 않습니다.'};
 return {days:3,label:'시·구 지역 기준',basis:'administrative',score:null,reason:'시·구 지역에 서비스 기본 3일 기준을 적용했습니다. 실제 보급·도로 상황은 반영하지 않습니다.'};
}
export function calculateKit({hazards=['all'],region=null,accessibility=null,policy={}}={}) {
 const selected=normalizeHazards(hazards); const active=selected.includes('all')?HAZARDS.filter(h=>h.id!=='all').map(h=>h.id):selected;
 const plan=getRegionalPlan(region,accessibility);
 const settings={...POLICY,...policy};
 for(const key of ['waterL','foodKcal','foodKcalPerKg'])if(!Number.isFinite(settings[key])||settings[key]<=0)throw new TypeError('계산 기준은 양수여야 합니다.');
 const applicableDays=policy.minimumDays??0;
 if(!Number.isFinite(applicableDays)||applicableDays<0||applicableDays>365)throw new TypeError('비축 기간은 0~365 범위여야 합니다.');
 const days=Math.max(plan.days,Math.ceil(applicableDays));
 const items=new Map();
 const add=(row,reason)=>{
  const [id,name,unit,category,icon,rule,rate,spec]=row;
  const raw=rule==='소모품'?rate*days:rule==='기간'?Math.ceil(days/rate):rate;
  const required=Math.round(raw*1000)/1000;
  const step=unit==='kg'?0.5:unit==='L'?2:1;
  const quantity=Math.ceil((required-1e-9)/step)*step;
  if(items.has(id)){const existing=items.get(id);existing.required=Math.max(existing.required,required);existing.quantity=Math.max(existing.quantity,quantity);existing.reasons.push(reason);return;}
  items.set(id,{id,name,unit,category,icon,rule,required,quantity,packSize:step,packCount:Math.round(quantity/step),spec,shared:rule==='공동',storage:rule==='공동'||id==='water'?'비치용':'개인용',reasons:[reason]});
 };
 for(const row of catalog){const r=[...row];if(r[0]==='water')r[6]=settings.waterL;if(r[0]==='food')r[6]=settings.foodKcal/settings.foodKcalPerKg;add(r,'공통 기본 물품');}
 for(const hazard of active)for(const id of hazardExtras[hazard]||[])add([id,...extras[id]],HAZARDS.find(h=>h.id===hazard).name);
 if(active.includes('cold')){const b=items.get('blanket');b.required=b.quantity=2;b.packCount=2;b.reasons.push('한파용 예비 보온 담요');}
 // Longer periods increase consumables; communal equipment is never multiplied by days.
 return {schemaVersion:'1.0',policyVersion:POLICY.version,hazards:selected,days,people:1,region:region?{code:region.code,name:region.label||region.name}:null,plan,assumptions:{waterL:settings.waterL,foodKcal:settings.foodKcal,foodKcalPerKg:settings.foodKcalPerKg},items:[...items.values()],notes:['1인분 계획용 기본값이며 개인별 필요량을 보장하지 않습니다.','물과 무거운 장비는 비치용으로 구분해 준비하세요.','물 4L는 CDC의 1일 약 3.8L 비축 안내를 올림한 계획값입니다. 나머지 수량은 서비스 가정값입니다.','소화기 1대는 이 구성의 기본값이며 건물 전체 설치 수량을 산정한 결과가 아닙니다.']};
}
export const SHELTER_TYPES={civil:{name:'민방위 대피소',for:'전쟁·공습',title:'민방위대피소'},earthquake:{name:'지진 옥외대피장소',for:'지진',title:'지진옥외대피소'},temporary:{name:'이재민 임시주거시설',for:'홍수·태풍·화재 등',title:'이재민임시주거시설'},heat:{name:'무더위쉼터',for:'폭염',title:'무더위쉼터'},cold:{name:'한파쉼터',for:'한파',title:'한파쉼터'}};
export function shelterTypesFor(hazards){
 const ids=normalizeHazards(hazards);if(ids.includes('all'))return Object.keys(SHELTER_TYPES);
 const types=new Set();for(const id of ids){if(id==='war')types.add('civil');else if(id==='quake')types.add('earthquake');else if(id==='heat')types.add('heat');else if(id==='cold')types.add('cold');else types.add('temporary');}
 return [...types];
}
export function nearestShelters(records,location,{types=Object.keys(SHELTER_TYPES),limit=5,radiusKm=30}={}){
 validateLocation(location);
 return records.filter(r=>types.includes(r.type)&&Number.isFinite(r.lat)&&Number.isFinite(r.lng)&&r.active!==false).map(r=>({...r,distanceKm:distanceKm(location,r)})).filter(r=>r.distanceKm<=radiusKm).sort((a,b)=>a.distanceKm-b.distanceKm||String(a.id).localeCompare(String(b.id))).slice(0,limit);
}
export function officialShelterUrl(type){return 'https://www.safekorea.go.kr/safekorea-kor/flsm/flsm/facilitiesSafteyMap.do?menuSn=2&title='+encodeURIComponent(SHELTER_TYPES[type]?.title||'대피시설');}
