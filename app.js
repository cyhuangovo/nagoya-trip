const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let data,activeDay=1,notionItems=[];
const NOTION_API='https://nagoya-trip-api.lyf19950312.workers.dev';
const icons={home:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m4 11 8-7 8 7v9H4z"/><path d="M9 20v-6h6v6"/></svg>`,cal:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>`,ai:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="8"/><path d="M8.5 10h.01M15.5 10h.01M8.5 15c2.2 1.5 4.8 1.5 7 0"/></svg>`};
const pin=`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z"/><circle cx="12" cy="10" r="2"/></svg>`;
const day=()=>data.days.find(x=>x.day===activeDay);
const isIOS=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
function openMapQuery(q){if(!q)return;window.location.href=isIOS()?`comgooglemaps://?q=${encodeURIComponent(q)}`:`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`}
function openShared(u){if(!u)return;if(isIOS()&&/^https?:\/\/(www\.)?google\.[^/]+\/maps\//i.test(u))window.location.href=u.replace(/^https?:\/\//i,'comgooglemapsurl://');else window.location.href=u}
function openEventMap(u){if(!u)return;if(/^https?:\/\//i.test(u))openShared(u);else openMapQuery(u)}
function notionDay(x){const m=String(x?.day||'').match(/\d+/);return m?Number(m[0]):0}
function notionForDay(dayNum){return notionItems.filter(x=>notionDay(x)===Number(dayNum))}
function isBackup(x){return String(x?.status||'').trim()==='備選'}
function isConfirmed(x){return !isBackup(x)}
function norm(s){return String(s||'').replace(/\s+/g,'').toLowerCase()}
function timeValue(s){const m=String(s||'').match(/(\d{1,2})\s*[:：]\s*(\d{2})/);return m?Number(m[1])*60+Number(m[2]):99999}
function candidateAttractions(dayNum){return notionForDay(dayNum).filter(x=>x.type==='景點'&&isBackup(x)).map(x=>({day:dayNum,name:x.name,url:x.mapUrl||'',image:x.imageUrl||'',hints:x.hints||[],description:x.description||''}))}
async function load(){
 data=await fetch('trip.json').then(r=>r.json());
 try{
  const res=await fetch(NOTION_API,{cache:'no-store'});
  if(!res.ok)throw new Error('Notion API '+res.status);
  const json=await res.json();
  if(!json.error&&Array.isArray(json.items))notionItems=json.items;
 }catch(e){console.warn('Notion 同步失敗，改用網站內建資料',e)}
 applyNotionToTrip();render();$$('[data-icon]').forEach(e=>e.innerHTML=icons[e.dataset.icon])
}
function applyNotionToTrip(){
 data.days.forEach(d=>{
  const items=notionForDay(d.day);
  const confirmed=items.filter(isConfirmed);

  // Notion 是正式行程的唯一來源：不再把 trip.json 的舊時間軸混進來，避免重複。
  // 只要「確定 + 有時間」，就會依 Notion 建立當天時間軸。
  d.events=confirmed
   .filter(x=>x.time)
   .filter(x=>['景點','餐廳','住宿','交通','移動'].includes(x.type))
   .map(x=>({
    time:x.time,
    place:x.name,
    detail:x.description||'',
    map:x.mapUrl||null,
    hints:x.hints||[],
    type:x.type||''
   }))
   .sort((a,b)=>timeValue(a.time)-timeValue(b.time));

  // 圖集只使用「確定」景點。
  const pics=confirmed.filter(x=>x.type==='景點'&&x.imageUrl).map(x=>({url:x.imageUrl,alt:x.name}));
  if(pics.length)d.gallery=pics;

  // 住宿資訊也以 Notion 為主。
  const stay=confirmed.find(x=>x.type==='住宿');
  if(stay){
   if(stay.name){d.stay=stay.name;d.stayDisplay=stay.name}
   d.stayMap=stay.mapUrl||'';
   if(stay.imageUrl)d.stayImage=stay.imageUrl;
   d.staySub=stay.description||'';
  }
 })
}
function nav(id,b){$$('.view').forEach(v=>v.classList.remove('active'));$('#'+id).classList.add('active');$$('.nav button').forEach(x=>x.classList.remove('active'));if(b)b.classList.add('active');if(id==='itinerary')renderItinerary()}
function timelineHTML(d){
 return d.events.map(e=>{
  const moving=e.type==='移動';

  if(moving){
   const detail=e.detail?`<span class="moveInlineDetail">・${e.detail}</span>`:'';
   const nav=e.map?`<button class="moveNavBtn" onclick='openEventMap(${JSON.stringify(e.map)})'>${pin}<span>開始導航</span></button>`:'';
   return `<div class="moveLine">
    <span class="moveTime">${e.time||''}</span>
    <div class="moveSentence"><span class="moveCar">🚗</span><strong>${e.place}</strong>${detail}</div>
    ${nav}
   </div>`;
  }

  return `<div class="event">
   <div class="time">${e.time||''}</div>
   <div class="eventText">
    <div class="place">${e.place}</div>
    <div class="detail">${e.detail||''}</div>
    ${e.hints?.length?`<div class="eventHints">${e.hints.map(h=>`<span class="hintTag"># ${h}</span>`).join('')}</div>`:''}
   </div>
   ${e.map?`<button class="navBtn" onclick='openEventMap(${JSON.stringify(e.map)})'>${pin}<span>導航</span></button>`:''}
  </div>`;
 }).join('')
}
function render(){
 const d=day();$('#dayLabel').innerHTML=`<span class="dayNo">Day ${d.day}</span><span class="dayDate">${d.date}</span>`;$('#dayTitle').textContent=d.title;$('#transport').textContent=d.transport;
 $('#gallery').innerHTML=d.gallery.map(g=>`<div><img class="hero" src="${g.url}" alt="${g.alt}" loading="lazy"><div class="cap">${g.alt}</div></div>`).join('');
 $('#timeline').innerHTML=timelineHTML(d);
 renderMeals(d);
 $('#stayName').textContent=d.stayDisplay||d.stay;$('#staySub').textContent=d.staySub||'';$('#stayImage').src=d.stayImage||'';$('#stayImage').style.display=d.stayImage?'block':'none';$('#stayBtn').onclick=()=>openMapQuery(d.stayMap);
 renderItinerary();
 $('#current').textContent=localStorage.current||'旅程尚未開始';$('#next').textContent=localStorage.next||'9/26 桃園機場 T1';
 renderCandidates();
}
function renderCandidates(){
 const list=candidateAttractions(activeDay),box=$('#candidateGrid');
 box.innerHTML=list.length?list.map(x=>`<div class="candidate">${x.image?`<img src="${x.image}" alt="${x.name}">`:''}<div class="candidateBody"><div class="candidateTitle">${x.name}</div>${x.description?`<div class="mealNote">${x.description}</div>`:''}${x.hints?.length?`<div class="mealNote">${x.hints.join('、')}</div>`:''}${x.url?`<button class="tiny" onclick='openShared(${JSON.stringify(x.url)})'>Google 地圖</button>`:''}</div></div>`).join(''):`<div class="note">目前沒有備選景點。</div>`
}
const mealLabels={breakfast:'早餐',lunch:'午餐',dinner:'晚餐'};
function mergedMeals(d){
 const out={breakfast:[...(d.meals?.breakfast||[])],lunch:[...(d.meals?.lunch||[])],dinner:[...(d.meals?.dinner||[])]};
 const mealMap={'早餐':'breakfast','午餐':'lunch','晚餐':'dinner',breakfast:'breakfast',lunch:'lunch',dinner:'dinner'};
 const fromNotion={breakfast:[],lunch:[],dinner:[]};
 notionForDay(d.day).filter(x=>x.meal&&mealMap[x.meal]).forEach(x=>fromNotion[mealMap[x.meal]].push({name:x.name,url:x.mapUrl||'',image:x.imageUrl||'',note:x.description||'',hints:x.hints||[],status:x.status||'確定',time:x.time||''}));
 Object.keys(fromNotion).forEach(k=>{if(fromNotion[k].length)out[k]=fromNotion[k]});
 return out
}
function renderMeals(d){$('#food').innerHTML=mealHTML(mergedMeals(d));if($('#itFood'))$('#itFood').innerHTML=mealHTML(mergedMeals(d))}
function renderItinerary(){
 const d=day(),tabs=$('#dayTabs');if(!tabs)return;
 tabs.innerHTML=data.days.map(x=>`<button class="dayTab ${x.day===activeDay?'active':''}" onclick="activeDay=${x.day};render()"><strong>Day ${x.day}</strong><span>${x.date}</span></button>`).join('');
 $('#itDayLabel').innerHTML=`<span class="dayNo">Day ${d.day}</span><span class="dayDate">${d.date}</span>`;$('#itDayTitle').textContent=d.title;$('#itTransport').textContent=d.transport;
 $('#itGallery').innerHTML=d.gallery.map(g=>`<div><img class="hero" src="${g.url}" alt="${g.alt}" loading="lazy"><div class="cap">${g.alt}</div></div>`).join('');
 $('#itTimeline').innerHTML=timelineHTML(d);
 $('#itFood').innerHTML=mealHTML(mergedMeals(d));
 const list=candidateAttractions(activeDay);$('#itCandidates').innerHTML=list.length?list.map(x=>`<div class="candidate">${x.image?`<img src="${x.image}" alt="${x.name}">`:''}<div class="candidateBody"><div class="candidateTitle">${x.name}</div>${x.description?`<div class="mealNote">${x.description}</div>`:''}${x.hints?.length?`<div class="mealNote">${x.hints.join('、')}</div>`:''}${x.url?`<button class="tiny" onclick='openShared(${JSON.stringify(x.url)})'>Google 地圖</button>`:''}</div></div>`).join(''):`<div class="note">目前沒有備選景點。</div>`;
 $('#itStayName').textContent=d.stayDisplay||d.stay;$('#itStaySub').textContent=d.staySub||'';$('#itStayImage').src=d.stayImage||'';$('#itStayImage').style.display=d.stayImage?'block':'none';$('#itStayBtn').onclick=()=>openMapQuery(d.stayMap);
}
function mealHTML(meals){
 return ['breakfast','lunch','dinner'].map(k=>{
  const list=meals[k];

  if(!list.length){
   return `<div class="meal mealEmpty">
    <div class="mealTop">
     <div class="mealTitle">${mealLabels[k]}</div>
     <div class="mealState muted">尚未安排</div>
    </div>
   </div>`;
  }

  const confirmed=list.filter(x=>String(x.status||'確定')!=='備選');
  const backup=list.filter(x=>String(x.status||'')==='備選');

  let headerState='';
  let headerClass='';

  if(list.length===1 && backup.length===0){
   headerState='已確認';
   headerClass='confirmed';
  }else{
   headerState=`候選 ${list.length} 家`;
   headerClass='candidate';
  }

  const ordered=[...confirmed,...backup];

  return `<div class="meal mealGroup">
   <div class="mealTop">
    <div class="mealTitle">${mealLabels[k]}</div>
    <div class="mealState ${headerClass}">${headerState}</div>
   </div>
   <div class="mealChoices">
    ${ordered.map(x=>`<div class="mealPlace">
      ${x.image?`<img src="${x.image}" alt="${x.name}">`:''}
      <div class="mealInfo">
       <strong>${x.name}</strong>
       ${x.time?`<div class="mealNote">${x.time}</div>`:''}
       ${x.note?`<div class="mealNote">${x.note}</div>`:''}
       ${x.hints?.length?`<div class="eventHints">${x.hints.map(h=>`<span class="hintTag"># ${h}</span>`).join('')}</div>`:''}
       ${x.url?`<button class="tiny" onclick='openShared(${JSON.stringify(x.url)})'>${pin}<span>導航</span></button>`:''}
      </div>
    </div>`).join('')}
   </div>
  </div>`;
 }).join('')
}
function ask(){let q=$('#q').value.trim();if(!q)return;$('#chat').innerHTML+=`<div class="msg">${q}</div>`;$('#q').value='';let a='目前可回答行程、住宿、航班、目前位置。';if(q.includes('住'))a=`今晚住宿：${day().stay}`;else if(q.includes('回台')||q.includes('班機'))a='10/1 星宇 JX839，19:55 NGO T1 起飛，22:00 抵達桃園 T1。';else if(q.includes('吃')){const m=mergedMeals(day()),names=[...m.breakfast,...m.lunch,...m.dinner].filter(x=>x.status!=='備選').map(x=>x.name);a=names.length?'今天餐點：'+names.join('、'):'今天還沒有確定餐廳。';}else if(q.includes('現在')||q.includes('哪裡'))a=`目前：${$('#current').textContent}；下一站：${$('#next').textContent}`;$('#chat').innerHTML+=`<div class="msg">${a}</div>`}
load();
