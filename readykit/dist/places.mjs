import {distanceKm as haversineKm,validateLocation} from './engine.mjs';

export const SHOP_TYPES={supermarket:'마트·슈퍼',convenience:'편의점'};
export const SEARCH_CENTER={lat:37.5538871,lng:126.9698806};
export const normalizeQuery=value=>String(value||'').normalize('NFKC').replace(/\s/g,'').toLocaleLowerCase();
export function photonPlaces(data){
 return (data?.features||[]).flatMap(feature=>{
  const p=feature.properties||{},coords=feature.geometry?.coordinates;
  if(feature.geometry?.type!=='Point'||!coords||p.countrycode&&p.countrycode!=='KR')return [];
  let point;try{point=validateLocation({lat:coords[1],lng:coords[0]});}catch{return [];}
  const address=[p.state,p.city,p.county,p.district,p.street,p.housenumber].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).join(' ');
  return [{id:`osm-${p.osm_type}-${p.osm_id}`,label:p.name||(SHOP_TYPES[p.osm_value]?SHOP_TYPES[p.osm_value]+' (상호 미등록)':address||'지도에 등록된 장소'),address,point,kind:p.osm_key==='shop'?p.osm_value:p.osm_key==='railway'?'station':'place',precision:'검색한 장소',source:'OpenStreetMap / Photon'}];
 });
}
export function dedupePlaces(places,query='',limit=10){
 const normalized=normalizeQuery(query);
 const ranked=places.map((p,i)=>({...p,rank:(normalizeQuery(p.label)===normalized?0:1)+(p.precision==='지역 대표 위치'?2:0),order:i})).sort((a,b)=>a.rank-b.rank||a.order-b.order);
 const results=[];
 for(const place of ranked){
  if(results.some(p=>p.id&&p.id===place.id||normalizeQuery(p.label)===normalizeQuery(place.label)&&haversineKm(p.point,place.point)<(p.kind==='station'&&place.kind==='station'?1:.06)))continue;
  const {rank,order,...clean}=place;results.push(clean);
 }
 return results.slice(0,limit);
}
export function nearbyShops(places,point,{radiusKm=3,limit=12,type='all'}={}){
 validateLocation(point);
 return dedupePlaces(places.filter(p=>SHOP_TYPES[p.kind]),'',Infinity).map(p=>({...p,distanceKm:haversineKm(point,p.point)})).filter(p=>p.distanceKm<=radiusKm&&(type==='all'||p.kind===type)).sort((a,b)=>a.distanceKm-b.distanceKm).slice(0,limit);
}

// A small shared queue and session cache keep this explicit-search widget within
// the public demo's fair-use policy. For large deployments configure a private endpoint.
export function createPhotonClient({baseUrl='https://photon.komoot.io',fetcher=globalThis.fetch}={}){
 const cache=new Map();let queue=Promise.resolve(),lastRequest=0;
 function request(path,params){
  const url=new URL(path,baseUrl);for(const [key,value]of params)url.searchParams.append(key,value);
  const key=url.href,existing=cache.get(key);if(existing&&Date.now()-existing.time<300000)return existing.promise;
  const promise=queue.catch(()=>{}).then(async()=>{
   const delay=Math.max(0,1100-(Date.now()-lastRequest));if(delay)await new Promise(resolve=>setTimeout(resolve,delay));lastRequest=Date.now();
   const response=await fetcher(url,{signal:AbortSignal.timeout(12000),credentials:'omit'});
   if(!response.ok)throw new Error(`장소 조회 실패 (${response.status})`);
   return photonPlaces(await response.json());
  }).catch(error=>{cache.delete(key);throw error;});
  cache.set(key,{time:Date.now(),promise});if(cache.size>60)cache.delete(cache.keys().next().value);queue=promise;return promise;
 }
 return {
  search:query=>request('/api/',[['q',query],['limit','12'],['countrycode','KR'],['lang','default']]),
  shops:point=>request('/reverse',[['lat',point.lat.toFixed(4)],['lon',point.lng.toFixed(4)],['radius','3'],['limit','50'],['osm_tag','shop:supermarket'],['osm_tag','shop:convenience'],['lang','default']]),
 };
}
