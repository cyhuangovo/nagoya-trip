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
function candidateAttractions(dayNum){return notionForDay(dayNum).filter(x=>x.type==='景點'&&isBackup(x)).map(x=>({day:dayNum,name:x.name,url:x.mapUrl||'',image:x.imageUrl||'',hints:x.hints||[]}))}
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

  // 既有時間軸：同名資料由 Notion 覆蓋時間、導航與提示。
  d.events.forEach(e=>{
   const n=confirmed.find(x=>norm(x.name)===norm(e.place));
   if(!n)return;
   if(n.time)e.time=n.time;
   if(n.mapUrl)e.map=n.mapUrl;
   if(n.hints?.length)e.hints=n.hints;
   if(n.type)e.type=n.type;
  });

  // Notion 新增且有「時間」的確定景點／交通／移動，可直接加入時間軸。
  confirmed
   .filter(x=>x.time&&['景點','交通','移動'].includes(x.type))
   .filter(x=>!d.events.some(e=>norm(e.place)===norm(x.name)))
   .forEach(x=>d.events.push({time:x.time,place:x.name,detail:(x.hints||[]).join('、'),map:x.mapUrl||null,hints:x.hints||[],type:x.type||''}));

  d.events.sort((a,b)=>timeValue(a.time)-timeValue(b.time));

  // 圖集只使用「確定」景點；備選景點不會跑到主行程圖片。
  const pics=confirmed.filter(x=>x.type==='景點'&&x.imageUrl).map(x=>({url:x.imageUrl,alt:x.name}));
  if(pics.length)d.gallery=pics;

  // 住宿由 Notion 更新名稱、地圖、圖片；若住宿有時間，也同步既有同名時間軸。
  const stay=confirmed.find(x=>x.type==='住宿');
  if(stay){
   if(stay.name){d.stay=stay.name;d.stayDisplay=stay.name}
   if(stay.mapUrl)d.stayMap=stay.mapUrl;
   if(stay.imageUrl)d.stayImage=stay.imageUrl;
  }
 })
}
function nav(id,b){$$('.view').forEach(v=>v.classList.remove('active'));$('#'+id).classList.add('active');$$('.nav button').forEach(x=>x.classList.remove('active'));if(b)b.classList.add('active');if(id==='itinerary')renderItinerary()}
function timelineHTML(d){return d.events.map(e=>{const moving=e.type==='移動';return `<div class="event ${moving?'moveEvent':''}"><div class="time">${e.time||''}</div><div class="eventText">${moving?'<div class="moveLabel">🚗 移動</div>':''}<div class="place">${e.place}</div><div class="detail">${e.detail||''}</div>${e.hints?.length?`<div class="eventHints">${e.hints.map(h=>`<span class="hintTag"># ${h}</span>`).join('')}</div>`:''}</div>${e.map?`<button class="navBtn ${moving?'routeBtn':''}" onclick='openEventMap(${JSON.stringify(e.map)})'>${pin}<span>${moving?'開始導航':'導航'}</span></button>`:''}</div>`}).join('')}
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
 box.innerHTML=list.length?list.map(x=>`<div class="candidate">${x.image?`<img src="${x.image}" alt="${x.name}">`:''}<div class="candidateBody"><div class="candidateTitle">${x.name}</div>${x.hints?.length?`<div class="mealNote">${x.hints.join('、')}</div>`:''}${x.url?`<button class="tiny" onclick='openShared(${JSON.stringify(x.url)})'>Google 地圖</button>`:''}</div></div>`).join(''):`<div class="note">目前沒有備選景點。</div>`
}
const mealLabels={breakfast:'早餐',lunch:'午餐',dinner:'晚餐'};
function mergedMeals(d){
 const out={breakfast:[...(d.meals?.breakfast||[])],lunch:[...(d.meals?.lunch||[])],dinner:[...(d.meals?.dinner||[])]};
 const mealMap={'早餐':'breakfast','午餐':'lunch','晚餐':'dinner',breakfast:'breakfast',lunch:'lunch',dinner:'dinner'};
 const fromNotion={breakfast:[],lunch:[],dinner:[]};
 notionForDay(d.day).filter(x=>x.meal&&mealMap[x.meal]).forEach(x=>fromNotion[mealMap[x.meal]].push({name:x.name,url:x.mapUrl||'',image:x.imageUrl||'',note:(x.hints||[]).join('、'),status:x.status||'確定',time:x.time||''}));
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
 const list=candidateAttractions(activeDay);$('#itCandidates').innerHTML=list.length?list.map(x=>`<div class="candidate">${x.image?`<img src="${x.image}" alt="${x.name}">`:''}<div class="candidateBody"><div class="candidateTitle">${x.name}</div>${x.hints?.length?`<div class="mealNote">${x.hints.join('、')}</div>`:''}${x.url?`<button class="tiny" onclick='openShared(${JSON.stringify(x.url)})'>Google 地圖</button>`:''}</div></div>`).join(''):`<div class="note">目前沒有備選景點。</div>`;
 $('#itStayName').textContent=d.stayDisplay||d.stay;$('#itStaySub').textContent=d.staySub||'';$('#itStayImage').src=d.stayImage||'';$('#itStayImage').style.display=d.stayImage?'block':'none';$('#itStayBtn').onclick=()=>openMapQuery(d.stayMap);
}
function mealHTML(meals){
 return ['breakfast','lunch','dinner'].map(k=>{
  const list=meals[k];
  if(!list.length)return `<div class="meal"><div class="mealTitle">${mealLabels[k]}</div><div class="detail">尚未安排</div></div>`;
  const confirmed=list.filter(x=>String(x.status||'確定')!=='備選'),backup=list.filter(x=>String(x.status||'')==='備選');
  return `<div class="meal"><div class="mealTop"><div class="mealTitle">${mealLabels[k]}</div><div class="mealState ${confirmed.length===1&&backup.length===0?'confirmed':''}">${confirmed.length===1&&backup.length===0?'已確認':backup.length?`候選 ${backup.length} 家`:confirmed.length?`已安排 ${confirmed.length} 家`:'候選'}</div></div>${[...confirmed,...backup].map(x=>`<div class="mealPlace">${x.image?`<img src="${x.image}" alt="${x.name}">`:''}<div class="mealInfo"><strong>${x.name}</strong>${x.status==='備選'?`<div class="mealNote">備選${x.time?`・${x.time}`:''}</div>`:x.time?`<div class="mealNote">${x.time}</div>`:''}${x.note?`<div class="mealNote">${x.note}</div>`:''}${x.url?`<button class="tiny" onclick='openShared(${JSON.stringify(x.url)})'>${pin}<span>導航</span></button>`:''}</div></div>`).join('')}</div>`
 }).join('')
}
function ask(){let q=$('#q').value.trim();if(!q)return;$('#chat').innerHTML+=`<div class="msg">${q}</div>`;$('#q').value='';let a='目前可回答行程、住宿、航班、目前位置。';if(q.includes('住'))a=`今晚住宿：${day().stay}`;else if(q.includes('回台')||q.includes('班機'))a='10/1 星宇 JX839，19:55 NGO T1 起飛，22:00 抵達桃園 T1。';else if(q.includes('吃')){const m=mergedMeals(day()),names=[...m.breakfast,...m.lunch,...m.dinner].filter(x=>x.status!=='備選').map(x=>x.name);a=names.length?'今天餐點：'+names.join('、'):'今天還沒有確定餐廳。';}else if(q.includes('現在')||q.includes('哪裡'))a=`目前：${$('#current').textContent}；下一站：${$('#next').textContent}`;$('#chat').innerHTML+=`<div class="msg">${a}</div>`}
load();
