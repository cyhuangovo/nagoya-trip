
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let data,activeDay=1,role=localStorage.tripRole||'family';
const icons={home:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m4 11 8-7 8 7v9H4z"/><path d="M9 20v-6h6v6"/></svg>`,cal:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>`,ai:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="8"/><path d="M8.5 10h.01M15.5 10h.01M8.5 15c2.2 1.5 4.8 1.5 7 0"/></svg>`,bag:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="5" y="7" width="14" height="14" rx="2"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/></svg>`,gear:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/></svg>`};
const pin=`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z"/><circle cx="12" cy="10" r="2"/></svg>`;
const day=()=>data.days.find(x=>x.day===activeDay);
const isIOS=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
function openMapQuery(q){window.location.href=isIOS()?`comgooglemaps://?q=${encodeURIComponent(q)}`:`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`}
function candidates(){try{return JSON.parse(localStorage.tripCandidates||'[]')}catch{return[]}}
function setCandidates(v){localStorage.tripCandidates=JSON.stringify(v)}
function restaurants(){try{return JSON.parse(localStorage.tripRestaurants||'[]')}catch{return[]}}
function setRestaurants(v){localStorage.tripRestaurants=JSON.stringify(v)}
async function load(){data=await fetch('trip.json').then(r=>r.json());applyRole();render();$$('[data-icon]').forEach(e=>e.innerHTML=icons[e.dataset.icon])}
function nav(id,b){$$('.view').forEach(v=>v.classList.remove('active'));$('#'+id).classList.add('active');$$('.nav button').forEach(x=>x.classList.remove('active'));if(b)b.classList.add('active');if(id==='admin'){renderAdminCandidates();renderAdminRestaurants()}if(id==='itinerary')renderItinerary()}
function switchRole(){role=role==='family'?'admin':'family';localStorage.tripRole=role;applyRole();nav('today',$('.nav button'))}
function applyRole(){
 const family=role==='family';$('#roleLabel').textContent=family?'切換管理者模式':'切換家人模式';
 $('#bottomNav').className='nav '+(family?'family':'admin');
 $$('.adminOnly').forEach(e=>e.style.display=family?'none':'');
 $$('.familyOnly').forEach(e=>e.style.display='');
}
function render(){
 const d=day();$('#dayLabel').innerHTML=`<span class="dayNo">Day ${d.day}</span><span class="dayDate">${d.date}</span>`;$('#dayTitle').textContent=d.title;$('#transport').textContent=d.transport;
 $('#gallery').innerHTML=d.gallery.map(g=>`<div><img class="hero" src="${g.url}" alt="${g.alt}" loading="lazy"><div class="cap">${g.alt}</div></div>`).join('');
 $('#timeline').innerHTML=d.events.map(e=>`<div class="event"><div class="time">${e.time}</div><div class="eventText"><div class="place">${e.place}</div><div class="detail">${e.detail}</div>${e.hints?.length?`<div class="eventHints">${e.hints.map(h=>`<span class="hintTag"># ${h}</span>`).join('')}</div>`:''}</div>${e.map?`<button class="navBtn" onclick='openMapQuery(${JSON.stringify(e.map)})'>${pin}<span>導航</span></button>`:''}</div>`).join('');
 renderMeals(d);
 $('#stayName').textContent=d.stayDisplay||d.stay;$('#staySub').textContent=d.staySub||'';$('#stayImage').src=d.stayImage||'';$('#stayImage').style.display=d.stayImage?'block':'none';$('#stayBtn').onclick=()=>openMapQuery(d.stayMap);
 renderItinerary();
 $('#current').textContent=localStorage.current||'旅程尚未開始';$('#next').textContent=localStorage.next||'9/26 桃園機場 T1';$('#adminCurrent').value=localStorage.current||'';$('#adminNext').value=localStorage.next||'';
 renderCandidates();
}
function renderCandidates(){const list=candidates().filter(x=>Number(x.day)===activeDay),box=$('#candidateGrid');box.innerHTML=list.length?list.map(x=>`<div class="candidate">${x.image?`<img src="${x.image}" alt="${x.name}">`:''}<div class="candidateBody"><div class="candidateTitle">${x.name}</div><button class="tiny" onclick='openShared(${JSON.stringify(x.url)})'>Google 地圖</button></div></div>`).join(''):`<div class="note">目前沒有自訂候選景點。</div>`}
function openShared(u){if(isIOS()&&/^https?:\/\/(www\.)?google\.[^/]+\/maps\//i.test(u))window.location.href=u.replace(/^https?:\/\//i,'comgooglemapsurl://');else window.location.href=u}
const mealLabels={breakfast:'早餐',lunch:'午餐',dinner:'晚餐'};
function mergedMeals(d){const out={breakfast:[...(d.meals?.breakfast||[])],lunch:[...(d.meals?.lunch||[])],dinner:[...(d.meals?.dinner||[])]};restaurants().filter(x=>Number(x.day)===activeDay).forEach(x=>out[x.meal].push(x));return out}
function renderMeals(d){$('#food').innerHTML=mealHTML(mergedMeals(d));if($('#itFood'))$('#itFood').innerHTML=mealHTML(mergedMeals(d))}
function renderItinerary(){
 const d=day(),tabs=$('#dayTabs');if(!tabs)return;
 tabs.innerHTML=data.days.map(x=>`<button class="dayTab ${x.day===activeDay?'active':''}" onclick="activeDay=${x.day};render()"><strong>Day ${x.day}</strong><span>${x.date}</span></button>`).join('');
 $('#itDayLabel').innerHTML=`<span class="dayNo">Day ${d.day}</span><span class="dayDate">${d.date}</span>`;$('#itDayTitle').textContent=d.title;$('#itTransport').textContent=d.transport;
 $('#itGallery').innerHTML=d.gallery.map(g=>`<div><img class="hero" src="${g.url}" alt="${g.alt}" loading="lazy"><div class="cap">${g.alt}</div></div>`).join('');
 $('#itTimeline').innerHTML=d.events.map(e=>`<div class="event"><div class="time">${e.time}</div><div class="eventText"><div class="place">${e.place}</div><div class="detail">${e.detail}</div>${e.hints?.length?`<div class="eventHints">${e.hints.map(h=>`<span class="hintTag"># ${h}</span>`).join('')}</div>`:''}</div>${e.map?`<button class="navBtn" onclick='openMapQuery(${JSON.stringify(e.map)})'>${pin}<span>導航</span></button>`:''}</div>`).join('');
 const meals=mergedMeals(d);$('#itFood').innerHTML=mealHTML(meals);
 const list=candidates().filter(x=>Number(x.day)===activeDay);$('#itCandidates').innerHTML=list.length?list.map(x=>`<div class="candidate">${x.image?`<img src="${x.image}" alt="${x.name}">`:''}<div class="candidateBody"><div class="candidateTitle">${x.name}</div><button class="tiny" onclick='openShared(${JSON.stringify(x.url)})'>Google 地圖</button></div></div>`).join(''):`<div class="note">目前沒有自訂候選景點。</div>`;
 $('#itStayName').textContent=d.stayDisplay||d.stay;$('#itStaySub').textContent=d.staySub||'';$('#itStayImage').src=d.stayImage||'';$('#itStayImage').style.display=d.stayImage?'block':'none';$('#itStayBtn').onclick=()=>openMapQuery(d.stayMap);
}
function mealHTML(meals){return ['breakfast','lunch','dinner'].map(k=>{const list=meals[k];if(!list.length)return `<div class="meal"><div class="mealTitle">${mealLabels[k]}</div><div class="detail">尚未安排</div></div>`;const confirmed=list.length===1;return `<div class="meal"><div class="mealTop"><div class="mealTitle">${mealLabels[k]}</div><div class="mealState ${confirmed?'confirmed':''}">${confirmed?'已確認':'候選 '+list.length+' 家'}</div></div>${list.map(x=>`<div class="mealPlace">${x.image?`<img src="${x.image}" alt="${x.name}">`:''}<div class="mealInfo"><strong>${x.name}</strong>${x.note?`<div class="mealNote">${x.note}</div>`:''}${x.url?`<button class="tiny" onclick='openShared(${JSON.stringify(x.url)})'>${pin}<span>導航</span></button>`:''}</div></div>`).join('')}</div>`}).join('')}
function addRestaurant(){const url=$('#restaurantUrl').value.trim(),dayNum=Number($('#restaurantDay').value),meal=$('#restaurantMeal').value;const name=$('#restaurantName').value.trim()||guessName(url);if(!name){alert('請填餐點或餐廳名稱');return}const image=$('#restaurantImage').value.trim();const list=restaurants();list.push({day:dayNum,meal,name,url,image});setRestaurants(list);$('#restaurantUrl').value='';$('#restaurantName').value='';$('#restaurantImage').value='';renderMeals(day());renderAdminRestaurants();alert('已加入餐廳')}
function renderAdminRestaurants(){const list=restaurants(),box=$('#adminRestaurants');if(!box)return;box.innerHTML=list.length?list.map((x,i)=>`<div class="adminCandidate"><div><strong>Day ${x.day}｜${mealLabels[x.meal]}｜${x.name}</strong><div class="detail">${x.image?'有圖片':'尚未設定圖片'}</div></div><button class="remove" onclick="removeRestaurant(${i})">刪除</button></div>`).join(''):'<div class="note">尚未新增餐廳。</div>'}
function removeRestaurant(i){let l=restaurants();l.splice(i,1);setRestaurants(l);renderAdminRestaurants();renderMeals(day())}
function save(){localStorage.current=$('#adminCurrent').value||'旅程尚未開始';localStorage.next=$('#adminNext').value||'9/26 桃園機場 T1';render();alert('已儲存在這台裝置')}
function guessName(url){try{const u=new URL(url),m=u.pathname.match(/\/place\/([^/]+)/);if(m)return decodeURIComponent(m[1]).replace(/\+/g,' ')}catch(e){}return ''}
function addCandidate(){const url=$('#candidateUrl').value.trim(),dayNum=Number($('#candidateDay').value);if(!url){alert('先貼 Google Maps 連結');return}const name=$('#candidateName').value.trim()||guessName(url)||'Google Maps 候選景點';const image=$('#candidateImage').value.trim();const list=candidates();list.push({day:dayNum,name,url,image});setCandidates(list);$('#candidateUrl').value='';$('#candidateName').value='';$('#candidateImage').value='';renderCandidates();renderAdminCandidates();alert('已加入候選')}
function renderAdminCandidates(){const list=candidates(),box=$('#adminCandidates');box.innerHTML=list.length?list.map((x,i)=>`<div class="adminCandidate"><div><strong>Day ${x.day}｜${x.name}</strong><div class="detail">${x.image?'有圖片':'尚未設定圖片'}</div></div><button class="remove" onclick="removeCandidate(${i})">刪除</button></div>`).join(''):'<div class="note">尚未新增候選。</div>'}
function removeCandidate(i){let l=candidates();l.splice(i,1);setCandidates(l);renderAdminCandidates();renderCandidates()}
function ask(){let q=$('#q').value.trim();if(!q)return;$('#chat').innerHTML+=`<div class="msg">${q}</div>`;$('#q').value='';let a='目前可回答行程、住宿、航班、目前位置。';if(q.includes('住'))a=`今晚住宿：${day().stay}`;else if(q.includes('回台')||q.includes('班機'))a='10/1 星宇 JX839，19:55 NGO T1 起飛，22:00 抵達桃園 T1。';else if(q.includes('吃')){const m=mergedMeals(day()),names=[...m.breakfast,...m.lunch,...m.dinner].map(x=>x.name);a=names.length?'今天餐點：'+names.join('、'):'今天還沒有安排餐廳。';}else if(q.includes('現在')||q.includes('哪裡'))a=`目前：${$('#current').textContent}；下一站：${$('#next').textContent}`;$('#chat').innerHTML+=`<div class="msg">${a}</div>`}
load();
