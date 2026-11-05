import test from 'node:test';
import assert from 'node:assert/strict';
import {dedupePlaces,photonPlaces,nearbyShops,createPhotonClient,SEARCH_CENTER} from '../dist/places.mjs';
import {resolveRegion,calculateKit} from '../dist/engine.mjs';
import {readFileSync} from 'node:fs';
const feature=(id,name,lng=126.9699,lat=37.5539,key='railway',value='station')=>({type:'Feature',properties:{osm_id:id,osm_type:'N',name,osm_key:key,osm_value:value,countrycode:'KR'},geometry:{type:'Point',coordinates:[lng,lat]}});
test('Seoul station platform records become one useful place, while remote names remain distinct',()=>{
 const results=dedupePlaces(photonPlaces({features:[feature(1,'서울역'),feature(2,'서울역',126.9725,37.5554),feature(3,'서울역',129,35),feature(4,'서울역 커피')]}),'서울역');
 assert.equal(results.length,3);assert.equal(results[0].label,'서울역');assert.equal(results[1].label,'서울역');
});
test('retail branches with the same brand remain separate and are sorted within radius',()=>{
 const places=photonPlaces({features:[feature(1,'GS25',126.9799,37.5539,'shop','convenience'),feature(2,'GS25',126.9709,37.5539,'shop','convenience'),feature(3,'먼 마트',128,37,'shop','supermarket'),feature(4,'마트',126.9719,37.5539,'shop','supermarket')]});
 const results=nearbyShops(places,SEARCH_CENTER);assert.equal(results.length,3);assert.equal(results[0].id,'osm-N-2');assert.ok(results.every(p=>p.distanceKm<=3));assert.equal(nearbyShops(places,SEARCH_CENTER,{type:'supermarket'}).length,1);
});
test('filtering shops does not truncate the source before distance sorting or category selection',()=>{
 const places=photonPlaces({features:Array.from({length:20},(_,i)=>feature(i,'매장'+i,126.97+i*.001,37.554,'shop',i===19?'supermarket':'convenience'))});
 assert.equal(nearbyShops(places,SEARCH_CENTER,{type:'supermarket'}).length,1);
});
test('invalid coordinates and foreign locations are discarded; missing shop names are explicit',()=>{
 const foreign=feature(3,'외국');foreign.properties.countrycode='JP';
 const results=photonPlaces({features:[feature(1,'오류',NaN,500),foreign,feature(2,null,126.97,37.55,'shop','convenience')]});assert.equal(results.length,1);assert.match(results[0].label,/상호 미등록/);
});
test('identical searches share one request and use supported Photon language',async()=>{
 let calls=0;const client=createPhotonClient({fetcher:async url=>{calls++;assert.equal(url.searchParams.get('lang'),'default');assert.equal(url.searchParams.get('q'),'서울역');return {ok:true,json:async()=>({features:[feature(1,'서울역')]})};}});
 const [a,b]=await Promise.all([client.search('서울역'),client.search('서울역')]);assert.equal(calls,1);assert.deepEqual(a,b);
});
test('upstream failures are errors, never an empty success result',async()=>{
 const client=createPhotonClient({fetcher:async()=>({ok:false,status:503})});await assert.rejects(client.search('서울역'),/503/);
});
test('Seoul station geometry gap gets an explicit nearby city policy without moving its point',()=>{
 const regions=JSON.parse(readFileSync(new URL('../dist/data/regions.json',import.meta.url))).regions;
 const point={...SEARCH_CENTER},result=resolveRegion(point,regions);
 assert.equal(result.approximate,true);assert.ok(result.region.label.startsWith('서울 '));assert.equal(calculateKit({region:result.region}).days,3);assert.deepEqual(point,SEARCH_CENTER);
 assert.equal(resolveRegion({lat:0,lng:0},regions).region,null);
});
