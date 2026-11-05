import {createPhotonClient,photonPlaces,dedupePlaces,nearbyShops,SHOP_TYPES,SEARCH_CENTER} from './places.mjs';
import {HAZARDS,CATEGORIES,POLICY,SHELTER_TYPES,calculateKit,normalizeHazards,validateLocation,pointInRegion,resolveRegion,nearestShelters,shelterTypesFor,officialShelterUrl} from './engine.mjs';
const $=s=>document.querySelector(s);
const icons={shield:'M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3z M9 12l2 2 4-4',locate:'M12 2v3M12 19v3M2 12h3M19 12h3 M19 12a7 7 0 1 1-14 0 7 7 0 0 1 14 0 M14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0',pin:'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0 M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0',search:'M20 20l-5-5 M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0',check:'M5 12l4 4L19 6',info:'M12 10v7M12 7v.1 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',waves:'M2 6c3-4 5 4 8 0s5 4 8 0 4 0 4 0M2 12c3-4 5 4 8 0s5 4 8 0 4 0 4 0M2 18c3-4 5 4 8 0s5 4 8 0 4 0 4 0',activity:'M2 12h5l3-8 4 16 3-8h5',wind:'M3 8h12a3 3 0 1 0-3-3M2 12h17a3 3 0 1 1-3 3M4 16h6a3 3 0 1 1-3 3',flame:'M13 3c1 5-5 5-4 10-2-1-3-3-3-3s-5 10 6 12c11-2 7-13 1-19z',snow:'M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9 4l3 3 3-3M9 20l3-3 3 3M4 10l4-1-1-4M20 14l-4 1 1 4M4 14l4 1-1 4M20 10l-4-1 1-4',sun:'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1 1M18 18l1 1M5 19l1-1M18 6l1-1',battery:'M3 7h16v10H3zM21 10v4M7 10v4M11 10v4',radio:'M4 9h16v11H4zM5 9 17 3M7 13h1M12 13h5M12 17h5M8 17h.1',calendar:'M4 5h16v16H4zM8 3v4M16 3v4M4 10h16M8 14h3M8 17h6',drop:'M12 2S4 10 4 15a8 8 0 0 0 16 0c0-5-8-13-8-13zM8 15c0 2 1 3 3 3',food:'M5 6h14l-1 15H6zM8 6V3h8v3M9 10h6M9 14h6M9 18h3',bottle:'M9 2h6v4l3 3v12H6V9l3-3zM9 6h6M6 12h12M6 17h12',flashlight:'M5 3h14l-4 7v11H9V10zM9 10h6M11 13h2',cable:'M7 2v4M11 2v4M5 6h8v4l-2 2H7l-2-2zM9 12v5a4 4 0 0 0 8 0v-4M15 13h4V9h-4z',medical:'M4 7h16v14H4zM8 7V3h8v4M12 11v6M9 14h6',wipes:'M4 9h16v12H4zM8 9 6 4l5 1 3-3 4 7M8 14h8',bag:'M5 7h14l2 14H3zM9 7V3h6v4M7 12h10',gloves:'M7 21 3 13a2 2 0 0 1 3-2l1 2V5a1 1 0 0 1 2 0v6-8a1 1 0 0 1 2 0v8-9a1 1 0 0 1 2 0v9-7a1 1 0 0 1 2 0v9-5a1 1 0 0 1 2 0v9l-2 4z',blanket:'M5 3h14v18H5zM9 3v18M5 8h14M5 16h14M15 3v18',whistle:'M4 12a6 6 0 1 0 12 0l5-4V5h-7l-4 4H4zM10 15h.1M16 6v4',extinguisher:'M8 8h8v13H8zM11 8V4h4M11 4 9 2M15 4h5v8M10 12h4M10 16h4',box:'M3 7l9-4 9 4v13H3zM3 7h18M9 7v5h6V7',copy:'M8 8h12v13H8zM5 16H3V3h12v2',rain:'M4 13a6 6 0 1 1 11-7 4 4 0 1 1 3 7H4zM7 16l-1 3M12 16l-1 3M17 16l-1 3',helmet:'M3 15h18v4H3zM5 15V10a7 7 0 0 1 14 0v5M10 4v8M14 4v8',glasses:'M3 10h7v7H3zM14 10h7v7h-7zM10 12h4M3 10l2-5M21 10l-2-5',map:'M3 5l6-2 6 2 6-2v16l-6 2-6-2-6 2zM9 3v16M15 5v16'};
function icon(name){return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${icons[name]||icons.box}"/></svg>`;}
document.querySelectorAll('[data-icon]').forEach(el=>el.outerHTML=icon(el.dataset.icon));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(n).toLocaleString('ko-KR',{maximumFractionDigits:2});
const config=window.READYKIT_CONFIG||{};
if(new URLSearchParams(location.search).get('embed')==='1')document.body.classList.add('embed');
const state={hazards:['all'],location:null,locationLabel:'',precision:'',region:null,accessibility:null,category:'all',shelterType:'civil',shelters:[],kit:null,selected:false,shops:[],shopType:'all',shopStatus:'idle'};
let regions=[],shelterIndex=null,requestVersion=0,locationVersion=0,searchVersion=0,map,marker,mapMarkers=[],mapProvider='leaflet',toastTimer,regionLoadError=false;
const cellCache=new Map();
const photon=createPhotonClient({baseUrl:config.photonBaseUrl||'https://photon.komoot.io'});
let shopVersion=0,shopTimer,shopMarkers=[];
let placesReady,shelterMap,shelterLocationMarker;
function toast(text){$('#toast').textContent=text;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,4200);}
async function json(url){const res=await fetch(url,{signal:AbortSignal.timeout(20000)});if(!res.ok)throw new Error(`데이터를 가져오지 못했습니다 (${res.status})`);return res.json();}
const regionReady=json('./data/regions.json').then(data=>{regions=data.regions;return regions;}).catch(()=>{regionLoadError=true;return [];});
const indexReady=json('./data/shelters-index.json').then(data=>{shelterIndex=data;return data;}).catch(()=>null);
function renderHazards(){
 $('#hazards').innerHTML=HAZARDS.map(h=>`<button class="hazard-button ${h.id==='all'?'all':''}" data-hazard="${h.id}" aria-pressed="${state.hazards.includes(h.id)}">${icon(h.icon)}<span>${h.name}${h.caption?`<small>${h.caption}</small>`:''}</span><span class="selected-tick">✓</span></button>`).join('');
}
$('#hazards').addEventListener('click',e=>{const button=e.target.closest('[data-hazard]');if(!button)return;const id=button.dataset.hazard;
 if(id==='all')state.hazards=['all'];else{const next=state.hazards.filter(h=>h!=='all');state.hazards=normalizeHazards(next.includes(id)?next.filter(h=>h!==id):[...next,id]);}
 state.selected=false;renderHazards();renderKit();renderShelterTypes();loadShelters();
});
function renderCategories(){const cats={all:'전체',...CATEGORIES};$('#categories').innerHTML=Object.entries(cats).map(([id,name])=>`<button data-category="${id}" aria-pressed="${state.category===id}">${name}</button>`).join('');}
$('#categories').addEventListener('click',e=>{const button=e.target.closest('[data-category]');if(!button)return;state.category=button.dataset.category;renderCategories();renderItems();});
function renderItems(){
 const items=state.kit.items.filter(i=>state.category==='all'||i.category===state.category);$('#visible-count').textContent=`${items.length}개 품목`;
 $('#items').innerHTML=items.map(i=>`<article class="item-row" data-category="${i.category}"><span class="item-icon">${icon(i.icon)}</span><div class="item-description"><h3>${i.name}${i.shared?'<span class="shared-label">공동</span>':''}</h3><p>${i.spec}${i.required!==i.quantity?` · 필요량 ${fmt(i.required)}${i.unit}`:''}</p></div><div class="item-quantity">${fmt(i.quantity)}<small>${i.unit}</small></div></article>`).join('');
 $('#items').scrollTop=0;
}
function renderKit(){
 state.kit=calculateKit({hazards:state.hazards,region:state.region,accessibility:state.accessibility});
 $('#days').textContent=state.kit.days;$('#plan-label').textContent=state.kit.plan.label;
 $('#water').textContent=fmt(state.kit.items.find(i=>i.id==='water').quantity);$('#food').textContent=fmt(state.kit.items.find(i=>i.id==='food').quantity);$('#item-count').textContent=state.kit.items.length;
 $('#basis-text').textContent=state.accessibility?'연결된 접근성 정보로 계산했어요.':state.region?`${state.region.label}${state.regionApproximate?' 인근 (경계 자료 기준 추정)':''} · 행정구역별 기본값, 실시간 도로 상황 미반영`:'위치를 지정하면 지역 기준을 반영해요.';
 $('#select-kit').innerHTML=icon('check')+(state.selected?'선택 완료':'이 구성 선택');
 $('#calculation-body').innerHTML=`<p><strong>${state.kit.days}일분 · ${esc(state.kit.plan.label)}</strong><br>${esc(state.kit.plan.reason)}</p><p>식수: 4L × ${state.kit.days}일 = ${state.kit.days*4}L. <a href="https://www.cdc.gov/water-emergency/about/how-to-create-and-store-an-emergency-water-supply.html" target="_blank" rel="noopener noreferrer">CDC의 1인 1일 약 3.8L 비축 안내</a>를 올림한 계획값입니다.</p><p>건조식량: 2,000kcal × ${state.kit.days}일 ÷ 4,000kcal/kg. 500g 포장 단위로 올림합니다. 열량·식품 구성과 그 외 수량은 서비스 가정값으로, 영양 적합성 검증 전 기준입니다.</p><p>시·구 3일 / 군 7일 / 울릉군 14일 / 지역 미확인 7일을 적용합니다. 이는 공식 재난별 권고 기간이나 구조 도착 예상시간이 아닙니다. 개인별 필요와 공식 지침을 우선 확인하세요.</p><p>공통 물품은 중복 계산하지 않습니다. 소화기·라디오 등 공동 장비는 기간에 따라 늘어나지 않습니다. 소화기 1대는 키트 구성값이며 건물 전체 설치 수량이 아닙니다. 분진용 마스크는 유독가스 보호용이 아닙니다.</p><p>규칙 ${POLICY.version} · <a href="${officialShelterUrl('civil')}" target="_blank" rel="noopener noreferrer">국민안전24 공식 정보</a></p>`;
 renderItems();emit('change');
}
function snapshot(){return {schemaVersion:'1.1',kit:structuredClone(state.kit),location:state.location?{label:state.region?.label||state.locationLabel,precision:state.precision,...(config.shareLocation?state.location:{})}:null,shelters:state.shelters.map(s=>({...s})),shops:state.shops.map(s=>({...s})),shopSource:{name:mapProvider==='kakao'?'Kakao':'OpenStreetMap / Photon',liveInventory:false},shelterSource:{name:'국민안전24',retrievedAt:shelterIndex?.retrievedAt||null,liveAvailability:false}};}
function parentOrigin(){try{const origin=new URL(config.parentOrigin||location.origin).origin;return origin==='null'?null:origin;}catch{return null;}}
function emit(name){if(!state.kit)return;const result=snapshot();document.dispatchEvent(new CustomEvent(`readykit:${name}`,{detail:result}));const callback=config[name==='select'?'onSelect':'onChange'];if(typeof callback==='function'){try{callback(result);}catch{toast('연결된 사이트에서 결과를 처리하지 못했어요.');}}
 const origin=parentOrigin();if(window.parent!==window&&origin)window.parent.postMessage({type:`readykit:${name}`,payload:result},origin);
}
$('#select-kit').addEventListener('click',()=>{state.selected=true;$('#select-kit').innerHTML=icon('check')+'선택 완료';emit('select');toast('이 구성을 선택했어요. 필요하면 목록을 복사해 보관하세요.');});
$('#copy').addEventListener('click',async()=>{
 const lines=[`준비 · ${state.kit.hazards.map(id=>HAZARDS.find(h=>h.id===id).name).join(', ')}`,`${state.region?.label||'지역 미지정'} | 기본 1인분 | ${state.kit.days}일 계획`,...state.kit.items.map(i=>`${i.name} ${fmt(i.quantity)}${i.unit}${i.shared?' (공동 비치용)':''}`),'',`수량은 서비스 계획값입니다. 규칙 ${state.kit.policyVersion}`];
 if(state.shelters.length)lines.push('','가까운 대피시설 (직선거리 · 개방 여부 미확인)',...state.shelters.map(s=>`${s.name} · ${SHELTER_TYPES[s.type].name} · ${distanceLabel(s.distanceKm)} · ${s.address||'상세주소 미제공'}`));
 try{await navigator.clipboard.writeText(lines.join('\n'));toast('준비물 목록을 복사했어요.');}catch{toast('복사를 허용하지 않은 브라우저예요. 목록을 직접 선택해 복사해 주세요.');}
});
async function applyLocation(point,{label='',precision='지정한 좌표',regionOverride=null}={}){
 const parsed=validateLocation(point);const version=++locationVersion;++requestVersion;++searchVersion;state.shelters=[];$('#location-form').removeAttribute('aria-busy');$('#location-form button').disabled=false;
 await regionReady;if(version!==locationVersion)return;
 state.location=parsed;const resolved=resolveRegion(parsed,regions);state.region=regionOverride||resolved.region;state.regionApproximate=!regionOverride&&resolved.approximate;state.locationLabel=label||state.region?.label||'지도에서 지정한 위치';state.precision=precision;state.selected=false;
 $('#location-name').textContent=label||state.region?.label||'지정한 위치';
 $('#location-detail').textContent=`${precision}${state.regionApproximate?' · 경계 인근 지역 추정':''} · ${parsed.lat.toFixed(4)}, ${parsed.lng.toFixed(4)}${regionLoadError?' · 지역 데이터 확인 불가':''}`;
 $('#search-results').hidden=true;updateMapLocation();renderKit();scheduleShops();await loadShelters();
}
$('#locate').addEventListener('click',()=>{
 const button=$('#locate');if(!navigator.geolocation){toast('위치 기능을 사용할 수 없어요. 지역명이나 좌표로 지정해 주세요.');return;}
 const version=++locationVersion;button.disabled=true;button.querySelector('span:not(.button-arrow)')?.removeAttribute('hidden');
 navigator.geolocation.getCurrentPosition(async pos=>{button.disabled=false;if(version!==locationVersion)return;await applyLocation({lat:pos.coords.latitude,lng:pos.coords.longitude},{precision:`현재 위치 · 오차 약 ${Math.ceil(pos.coords.accuracy)}m`});},error=>{button.disabled=false;if(version!==locationVersion)return;toast(error.code===1?'위치 접근이 허용되지 않았어요. 지역명이나 좌표를 입력해 주세요.':'현재 위치를 확인하지 못했어요. 지역명이나 좌표를 입력해 주세요.');},{enableHighAccuracy:true,timeout:12000,maximumAge:300000});
});

function kakaoSearch(query){
 const services=window.kakao.maps.services;
 const places=new services.Places(),geocoder=new services.Geocoder();
 const call=(api,method)=>new Promise((resolve,reject)=>api[method](query,(items,status)=>{
  if(status===services.Status.ERROR){reject(new Error('검색 서비스를 불러오지 못했어요.'));return;}
  resolve((items||[]).map(r=>({id:r.id||r.address_name,label:r.place_name||r.address_name,address:r.road_address_name||r.address_name,point:{lat:+r.y,lng:+r.x},kind:r.category_group_code==='SW8'?'station':'place',precision:'검색한 장소',source:'Kakao'})));
 }));
 return Promise.allSettled([call(places,'keywordSearch'),call(geocoder,'addressSearch')]).then(results=>{if(results.every(r=>r.status==='rejected'))throw new Error('장소 검색 실패');return results.flatMap(r=>r.status==='fulfilled'?r.value:[]);});
}
$('#location-query').addEventListener('input',()=>{++searchVersion;$('#search-results').hidden=true;$('#location-form').removeAttribute('aria-busy');$('#location-form button').disabled=false;});
$('#location-query').addEventListener('keydown',e=>{if(e.key==='Escape'){$('#search-results').hidden=true;++searchVersion;}});
$('#location-form').addEventListener('submit',async e=>{
 e.preventDefault();const query=$('#location-query').value.trim();if(!query){toast('장소명, 주소 또는 좌표를 입력해 주세요.');return;}
 const coordinate=query.match(/^(-?\d+(?:\.\d+)?)\s*[,\s]\s*(-?\d+(?:\.\d+)?)$/);
 if(coordinate){try{await applyLocation({lat:Number(coordinate[1]),lng:Number(coordinate[2])});}catch(err){toast(err.message);}return;}
 const version=++searchVersion;$('#location-form').setAttribute('aria-busy','true');$('#location-form button').disabled=true;$('#search-hint').textContent='장소와 주소를 찾고 있어요…';
 await Promise.all([regionReady,placesReady]);if(version!==searchVersion)return;
 const normalized=query.replace(/특별자치도|특별자치시|특별시|광역시|\s/g,'');
 const regionMatches=normalized?regions.filter(r=>r.label.replace(/특별자치도|특별자치시|특별시|광역시|\s/g,'').includes(normalized)||r.name===query).slice(0,10).map(r=>({id:'region-'+r.code,label:r.label,point:r.center,region:r,precision:'지역 대표 위치',kind:'region'})):[];
 let results=[],failed=false;
 try{results=mapProvider==='kakao'?await kakaoSearch(query):await photon.search(query);}catch{failed=true;}
 if(version!==searchVersion)return;
 $('#location-form').removeAttribute('aria-busy');$('#location-form button').disabled=false;
 results=dedupePlaces([...results,...regionMatches],query);
 $('#search-hint').textContent=failed?'장소 검색 연결이 지연돼요. 지역 검색과 지도 선택을 사용할 수 있어요.':'장소명·주소를 검색하거나 지도에서 바로 선택하세요.';
 if(!results.length){showSearchMessage(failed?'장소 검색에 연결하지 못했어요. 다시 검색하거나 지도를 눌러 선택하세요.':'검색 결과가 없어요. 지역명을 함께 입력하거나 지도에서 선택해 주세요.');return;}
 if(results.length===1){const result=results[0];await applyLocation(result.point,{label:result.label,precision:result.precision,regionOverride:result.region});$('#search-hint').textContent=result.label+' 위치를 선택했어요. 지도에서 조정할 수 있어요.';}
 else showSearch(results);
});
function showSearchMessage(message){const box=$('#search-results');box.replaceChildren();const p=document.createElement('p');p.textContent=message;box.append(p);box.hidden=false;}
function showSearch(results){
 const box=$('#search-results');box.replaceChildren();
 for(const result of results){const button=document.createElement('button');button.type='button';const label=document.createElement('span');label.textContent=result.label;const small=document.createElement('small');small.textContent=result.precision==='지역 대표 위치'?'지역 대표 위치':result.address||'이 장소로 선택';button.append(label,small);button.addEventListener('click',()=>{applyLocation(result.point,{label:result.label,precision:result.precision,regionOverride:result.region});$('#location-query').value=result.label;});box.append(button);}
 box.hidden=false;$('#search-hint').textContent=results.length+'곳을 찾았어요. 원하는 장소를 선택하세요.';
}
function renderShelterTypes(){const types=shelterTypesFor(state.hazards);if(!types.includes(state.shelterType))state.shelterType=types[0];$('#shelter-types').innerHTML=types.map(type=>`<button data-type="${type}" aria-pressed="${state.shelterType===type}">${SHELTER_TYPES[type].name}</button>`).join('');$('#official-link').href=officialShelterUrl(state.shelterType);}
$('#shelter-types').addEventListener('click',e=>{const button=e.target.closest('[data-type]');if(!button)return;state.shelterType=button.dataset.type;renderShelterTypes();loadShelters();});
function emptyShelters(title,detail,link=false){$('#shelter-list').innerHTML=`<div class="shelter-empty">${icon('map')}<strong>${esc(title)}</strong><p>${esc(detail)}</p>${link?`<a href="${officialShelterUrl(state.shelterType)}" target="_blank" rel="noopener noreferrer">공식 대피시설 조회 ↗</a>`:''}</div>`;}
function distanceLabel(km){return km<1?`${Math.round(km*1000)}m`:`${km.toFixed(1)}km`;}
async function loadShelters(){
 const version=++requestVersion;state.shelters=[];clearShelterMarkers();emit('change');
 if(!state.location){$('#shelter-scope').textContent='위치 지정 후 조회';emptyShelters('먼저 위치를 알려주세요','현재 위치, 지역 검색, 지도 클릭으로 지정할 수 있어요.');return;}
 $('#shelter-scope').textContent='반경 30km 내 시설 확인 중';emptyShelters('가까운 시설을 찾고 있어요','공식 공개자료를 불러오는 중입니다.');
 const index=await indexReady;if(version!==requestVersion)return;if(!index){$('#shelter-scope').textContent='시설 데이터 확인 불가';emptyShelters('대피시설 자료를 불러오지 못했어요','국민안전24에서 현재 시설 정보를 확인해 주세요.',true);return;}
 const point={...state.location};const latRadius=30/111.2,lngRadius=30/(111.2*Math.max(.05,Math.cos(point.lat*Math.PI/180)));
 const cells=index.cells.filter(c=>c.bbox[0]<=point.lng+lngRadius&&c.bbox[2]>=point.lng-lngRadius&&c.bbox[1]<=point.lat+latRadius&&c.bbox[3]>=point.lat-latRadius);
 try{
  const chunks=await Promise.all(cells.map(cell=>{if(!cellCache.has(cell.id))cellCache.set(cell.id,json(`./data/shelters-${cell.id}.json`).catch(error=>{cellCache.delete(cell.id);throw error;}));return cellCache.get(cell.id);}));if(version!==requestVersion)return;
  state.shelters=nearestShelters(chunks.flat(),point,{types:[state.shelterType],limit:5,radiusKm:30});$('#shelter-scope').textContent=`반경 30km · 가까운 ${state.shelters.length}곳`;
  if(!state.shelters.length){emptyShelters('이 자료에서 가까운 시설을 찾지 못했어요','시설이 없다는 뜻은 아니에요. 공식 정보를 확인해 주세요.',true);emit('change');return;}
  $('#shelter-list').innerHTML=state.shelters.map((s,i)=>`<article class="shelter-card"><span class="shelter-number">${i+1}</span><div><h3>${esc(s.name)}</h3><p>${esc(s.address||'상세주소 미제공 · 지도 위치로 확인')}</p><span class="shelter-type-label">${SHELTER_TYPES[s.type].for} · 개방 여부 미확인</span></div><div class="shelter-distance"><strong>${distanceLabel(s.distanceKm)}</strong><a href="https://map.kakao.com/link/map/${encodeURIComponent(s.name)},${s.lat},${s.lng}" target="_blank" rel="noopener noreferrer">지도 보기 ↗</a></div></article>`).join('');
  renderShelterMarkers();emit('change');
 }catch{if(version!==requestVersion)return;$('#shelter-scope').textContent='시설 데이터 확인 불가';emptyShelters('시설 자료를 불러오지 못했어요','네트워크를 확인하거나 공식 안전지도를 이용해 주세요.',true);}
}
function clearShelterMarkers(){for(const mark of mapMarkers){if(mapProvider==='kakao')mark.setMap(null);else mark.remove();}mapMarkers=[];}
function updateMapLocation(){if(!map||!state.location)return;const {lat,lng}=state.location;$('#map-caption').textContent=state.locationLabel+' 주변 · 지도를 눌러 위치 변경';
 if(mapProvider==='kakao'){const pos=new window.kakao.maps.LatLng(lat,lng);if(!marker)marker=new window.kakao.maps.Marker({position:pos,map});else marker.setPosition(pos);map.setCenter(pos);map.setLevel(state.precision==='지도에서 지정한 위치'?Math.min(3,map.getLevel()):3);}
 else{const pos=[lat,lng];if(!marker)marker=L.marker(pos,{icon:L.divIcon({className:'',html:'<div class="user-marker"></div>',iconSize:[16,16],iconAnchor:[8,8]}),keyboard:false}).addTo(map);else marker.setLatLng(pos);map.setView(pos,state.precision==='지도에서 지정한 위치'?Math.max(16,map.getZoom()):16,{animate:false});}
 updateShelterMapLocation();
}
function renderShelterMarkers(){if(!map)return;clearShelterMarkers();for(const targetMap of [map,shelterMap].filter(Boolean))for(const [index,s]of state.shelters.entries()){
  if(mapProvider==='kakao'){const mark=new window.kakao.maps.Marker({position:new window.kakao.maps.LatLng(s.lat,s.lng),map:targetMap,title:s.name});const info=new window.kakao.maps.InfoWindow({content:`<div style="padding:10px;font-size:12px">${esc(s.name)}</div>`});window.kakao.maps.event.addListener(mark,'click',()=>info.open(targetMap,mark));mapMarkers.push(mark);}
  else{const node=document.createElement('div');const name=document.createElement('strong');name.textContent=s.name;const text=document.createElement('span');text.textContent=`${SHELTER_TYPES[s.type].name} · ${distanceLabel(s.distanceKm)} · 개방 여부 미확인`;node.append(name,text);const mark=L.marker([s.lat,s.lng],{icon:L.divIcon({className:'',html:`<div class="shelter-marker">${index+1}</div>`,iconSize:[27,29],iconAnchor:[13,29]}),title:s.name}).addTo(targetMap).bindPopup(node);mapMarkers.push(mark);}
 }}
async function initializeMap(){
 if(config.kakaoJavaScriptKey){try{await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(config.kakaoJavaScriptKey)}&libraries=services&autoload=false`;script.onload=()=>window.kakao?.maps?.load?window.kakao.maps.load(resolve):reject(new Error('Kakao SDK unavailable'));script.onerror=reject;document.head.append(script);setTimeout(()=>reject(new Error('Kakao SDK timeout')),10000);});
  mapProvider='kakao';map=new window.kakao.maps.Map($('#map'),{center:new window.kakao.maps.LatLng(SEARCH_CENTER.lat,SEARCH_CENTER.lng),level:4});window.kakao.maps.event.addListener(map,'click',event=>applyLocation({lat:event.latLng.getLat(),lng:event.latLng.getLng()},{precision:'지도에서 지정한 위치'}));map.addControl(new window.kakao.maps.ZoomControl(),window.kakao.maps.ControlPosition.RIGHT);updateMapLocation();renderShelterMarkers();return;
 }catch{mapProvider='leaflet';}}
 if(!window.L){$('#map').innerHTML='<div class="shelter-empty">지도를 불러오지 못했어요. 지역명이나 좌표로 위치를 지정해 주세요.</div>';return;}
 map=L.map('map',{zoomControl:false,scrollWheelZoom:false}).setView([SEARCH_CENTER.lat,SEARCH_CENTER.lng],15);L.control.zoom({position:'bottomright'}).addTo(map);
 const tiles=L.tileLayer(config.tileUrl||'https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'}).addTo(map);let errors=0;tiles.on('tileerror',()=>{if(++errors===3)toast('배경 지도를 불러오지 못했어요. 지역 검색과 계산은 계속 사용할 수 있어요.');});
 map.on('click',event=>applyLocation(event.latlng,{precision:'지도에서 지정한 위치'}));L.control.scale({position:'bottomleft',imperial:false}).addTo(map);updateMapLocation();renderShelterMarkers();
}
async function setContext(context={}){
 const nextHazards=context.hazards?normalizeHazards(context.hazards):state.hazards;
 if('accessibility'in context)calculateKit({accessibility:context.accessibility});
 if(context.location)validateLocation(context.location);
 state.hazards=nextHazards;
 if('accessibility'in context)state.accessibility=context.accessibility;
 state.selected=false;renderHazards();renderShelterTypes();if(context.location)await applyLocation(context.location);else{renderKit();await loadShelters();}return snapshot();
}
window.addEventListener('message',event=>{if(event.source!==window.parent||event.origin!==parentOrigin()||event.data?.type!=='readykit:set-context')return;setContext(event.data.payload).catch(err=>toast(err.message));});
renderHazards();renderCategories();renderKit();renderShelterTypes();loadShelters();
placesReady=initializeMap().then(initializeShelterMap);
renderShops();
const ready=Promise.all([regionReady,indexReady,placesReady]).then(()=>snapshot());
window.ReadyKit={calculate:calculateKit,setContext,getResult:snapshot,ready,version:POLICY.version};
if(config.initialContext)ready.then(()=>setContext(config.initialContext)).catch(err=>toast(err.message));

$('#map-recenter').addEventListener('click',()=>{if(state.location)updateMapLocation();else focusMap(SEARCH_CENTER,false);});
function focusMap(point,scroll=true){
 if(!map)return;if(mapProvider==='kakao'){map.setCenter(new window.kakao.maps.LatLng(point.lat,point.lng));map.setLevel(3);}else map.setView([point.lat,point.lng],17,{animate:false});
 if(scroll)$('#map').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});
}
function clearShopMarkers(){for(const m of shopMarkers){if(mapProvider==='kakao')m.setMap(null);else m.remove();}shopMarkers=[];}
function renderShopMarkers(shops){
 clearShopMarkers();if(!map)return;
 for(const [i,s]of shops.entries()){
  const label='M'+(i+1);const node=document.createElement('button');node.type='button';node.className='shop-marker';node.textContent=label;node.title=s.label;node.setAttribute('aria-label',s.label+' 매장');
  if(mapProvider==='kakao'){const mark=new window.kakao.maps.CustomOverlay({position:new window.kakao.maps.LatLng(s.point.lat,s.point.lng),content:node,map,yAnchor:1});node.addEventListener('click',e=>{e.stopPropagation();window.kakao.maps.event.preventMap();toast(s.label+' · '+distanceLabel(s.distanceKm));});shopMarkers.push(mark);}
  else{const popup=document.createElement('div');const title=document.createElement('strong');title.textContent=s.label;const text=document.createElement('span');text.textContent=SHOP_TYPES[s.kind]+' · '+distanceLabel(s.distanceKm)+' · 재고·영업 여부 미확인';popup.append(title,text);const mark=L.marker([s.point.lat,s.point.lng],{icon:L.divIcon({className:'',html:'<span class="shop-marker">'+label+'</span>',iconSize:[32,28],iconAnchor:[16,28]}),title:s.label}).addTo(map).bindPopup(popup);shopMarkers.push(mark);}
 }
}
function scheduleShops(){
 ++shopVersion;clearTimeout(shopTimer);state.shops=[];state.shopStatus=state.location?'loading':'idle';renderShops();
 if(state.location)shopTimer=setTimeout(loadShops,650);
}
async function kakaoShops(point){
 const services=window.kakao.maps.services,places=new services.Places();
 const results=await Promise.all(['MT1','CS2'].map(code=>new Promise((resolve,reject)=>places.categorySearch(code,(items,status)=>{
  if(status===services.Status.ERROR){reject(new Error('매장 조회 실패'));return;}
  resolve((items||[]).map(s=>({id:'kakao-'+s.id,label:s.place_name,address:s.road_address_name||s.address_name,point:{lat:+s.y,lng:+s.x},kind:code==='MT1'?'supermarket':'convenience',source:'Kakao'})));
 },{location:new window.kakao.maps.LatLng(point.lat,point.lng),radius:3000,sort:services.SortBy.DISTANCE,size:15}))));
 return results.flat();
}
async function loadShops(){
 const version=++shopVersion;if(!state.location)return;const point={...state.location};state.shopStatus='loading';renderShops();
 try{await placesReady;const results=mapProvider==='kakao'?await kakaoShops(point):await photon.shops(point);if(version!==shopVersion)return;state.shops=nearbyShops(results,point,{limit:50});state.shopStatus='loaded';}
 catch{if(version!==shopVersion)return;state.shopStatus='error';state.shops=[];}
 renderShops();emit('change');
}
function renderShops(){
 const list=$('#shop-list'),scope=$('#shop-scope');clearShopMarkers();
 const messages={idle:['위치를 선택하면 주변 매장을 보여드려요','위 지도에서 클릭하거나 장소명을 검색하세요.'],loading:['주변 매장을 찾고 있어요','선택한 위치 주변 3km를 조회합니다.'],error:['매장 정보를 불러오지 못했어요','검색 서비스가 잠시 응답하지 않아요. 다시 시도해 주세요.']};
 if(state.shopStatus!=='loaded'){const [title,detail]=messages[state.shopStatus];scope.textContent=state.shopStatus==='idle'?'위치 지정 후 조회':state.shopStatus==='error'?'조회 연결 실패':'반경 3km 내 조회 중';list.innerHTML='<div class="shelter-empty">'+icon('box')+'<strong>'+title+'</strong><p>'+detail+'</p>'+(state.shopStatus==='error'?'<button id="retry-shops" class="button secondary">다시 조회</button>':'')+'</div>';$('#retry-shops')?.addEventListener('click',loadShops);return;}
 const shops=nearbyShops(state.shops,state.location,{type:state.shopType,limit:8});scope.textContent='반경 3km · 가까운 '+shops.length+'곳';
 if(!shops.length){list.innerHTML='<div class="shelter-empty"><strong>이 자료에서 주변 매장을 찾지 못했어요</strong><p>실제 매장이 없다는 뜻은 아니에요. 다른 위치나 매장 종류를 확인해 주세요.</p></div>';return;}
 list.innerHTML=shops.map((s,i)=>'<article class="shelter-card shop-card"><span class="shop-number">M'+(i+1)+'</span><div><h3>'+esc(s.label)+'</h3><p>'+esc(s.address||'상세주소 미제공')+'</p><span class="shelter-type-label">'+SHOP_TYPES[s.kind]+'</span></div><div class="shelter-distance"><strong>'+distanceLabel(s.distanceKm)+'</strong><button type="button" data-focus-shop="'+i+'">지도에서 보기</button><a href="https://map.kakao.com/link/map/'+encodeURIComponent(s.label)+','+s.point.lat+','+s.point.lng+'" target="_blank" rel="noopener noreferrer">카카오맵 ↗</a></div></article>').join('');
 list.querySelectorAll('[data-focus-shop]').forEach(b=>b.addEventListener('click',()=>{const i=+b.dataset.focusShop;focusMap(shops[i].point);if(mapProvider!=='kakao')shopMarkers[i]?.openPopup();}));
 $('#shop-source').innerHTML=mapProvider==='kakao'?'출처: Kakao · 재고 연동 없음':'출처: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> / Photon · 재고 연동 없음';
 renderShopMarkers(shops);
}
$('#shop-types').addEventListener('click',e=>{const button=e.target.closest('[data-shop-type]');if(!button)return;state.shopType=button.dataset.shopType;$('#shop-types').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));renderShops();});

function initializeShelterMap(){
 if(!map)return;
 if(mapProvider==='kakao'){
  shelterMap=new window.kakao.maps.Map($('#shelter-map'),{center:new window.kakao.maps.LatLng(SEARCH_CENTER.lat,SEARCH_CENTER.lng),level:4});
  shelterMap.addControl(new window.kakao.maps.ZoomControl(),window.kakao.maps.ControlPosition.RIGHT);
 }else{
  shelterMap=L.map('shelter-map',{zoomControl:false,scrollWheelZoom:false}).setView([SEARCH_CENTER.lat,SEARCH_CENTER.lng],15);
  L.control.zoom({position:'bottomright'}).addTo(shelterMap);
  L.tileLayer(config.tileUrl||'https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'}).addTo(shelterMap);
 }
 updateShelterMapLocation();renderShelterMarkers();
}
function updateShelterMapLocation(){
 if(!shelterMap||!state.location)return;const {lat,lng}=state.location;
 if(mapProvider==='kakao'){
  const pos=new window.kakao.maps.LatLng(lat,lng);shelterMap.setCenter(pos);shelterMap.setLevel(3);
  if(shelterLocationMarker)shelterLocationMarker.setPosition(pos);else shelterLocationMarker=new window.kakao.maps.Marker({map:shelterMap,position:pos,title:'선택 위치'});
 }else{
  shelterMap.setView([lat,lng],16,{animate:false});
  if(shelterLocationMarker)shelterLocationMarker.setLatLng([lat,lng]);else shelterLocationMarker=L.marker([lat,lng],{icon:L.divIcon({className:'',html:'<div class="user-marker"></div>',iconSize:[16,16],iconAnchor:[8,8]}),keyboard:false}).addTo(shelterMap);
 }
}
$('#shelter-map-recenter').addEventListener('click',()=>{
 if(!shelterMap)return;updateShelterMapLocation();
 if(state.shelters.length){
  if(mapProvider==='kakao'){const bounds=new window.kakao.maps.LatLngBounds();for(const s of state.shelters)bounds.extend(new window.kakao.maps.LatLng(s.lat,s.lng));if(state.location)bounds.extend(new window.kakao.maps.LatLng(state.location.lat,state.location.lng));shelterMap.setBounds(bounds);}
  else shelterMap.fitBounds([...state.shelters.map(s=>[s.lat,s.lng]),...(state.location?[[state.location.lat,state.location.lng]]:[])],{padding:[35,35],maxZoom:16,animate:false});
 }
});
