
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let data,activeDay=1;
const icons={home:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m4 11 8-7 8 7v9H4z"/><path d="M9 20v-6h6v6"/></svg>`,cal:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>`,ai:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="8"/><path d="M8.5 10h.01M15.5 10h.01M8.5 15c2.2 1.5 4.8 1.5 7 0"/></svg>`,bag:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="5" y="7" width="14" height="14" rx="2"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/></svg>`,gear:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/></svg>`};
const pin=`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z"/><circle cx="12" cy="10" r="2"/></svg>`;
const day=()=>data.days.find(x=>x.day===activeDay);
const isIOS=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)|| (navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
function directMapQuery(q){if(isIOS()) return `comgooglemaps://?q=${encodeURIComponent(q)}`; return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`}
function openMapQuery(q){window.location.href=directMapQuery(q)}
function googleAppUrlFromShared(u){
  if(!u)return null;
  if(isIOS()){
    if(/^https?:\/\/(www\.)?google\.[^/]+\/maps\//i.test(u)||/^https?:\/\/maps\.google\./i.test(u)||/^https?:\/\/goo\.gl\/maps\//i.test(u))
      return u.replace(/^https?:\/\//i,'comgooglemapsurl://');
  }
  return u;
}
function openSharedMap(u){window.location.href=googleAppUrlFromShared(u)}
function candidates(){try{return JSON.parse(localStorage.tripCandidates||'[]')}catch{return[]}}
function setCandidates(v){localStorage.tripCandidates=JSON.stringify(v)}
async function load(){data=await fetch('trip.json').then(r=>r.json());render();$$('[data-icon]').forEach(e=>e.innerHTML=icons[e.dataset.icon]);$('#candidateDay').value=activeDay}
function nav(id,b){$$('.view').forEach(v=>v.classList.remove('active'));$('#'+id).classList.add('active');$$('.nav button').forEach(x=>x.classList.remove('active'));if(b)b.classList.add('active');if(id==='admin')renderAdminCandidates()}
function render(){
 const d=day();$('#dayLabel').textContent=`DAY ${d.day}｜${d.date}`;$('#dayTitle').textContent=d.title;$('#transport').textContent=d.transport;
 $('#gallery').innerHTML=d.gallery.map(g=>`<div><img class="hero" src="${g.url}" alt="${g.alt}" loading="lazy"><div class="cap">${g.alt}</div></div>`).join('');
 $('#timeline').innerHTML=d.events.map(e=>`<div class="event"><div class="time">${e.time}</div><div><div class="place">${e.place}</div><div class="detail">${e.detail}</div></div>${e.map?`<button class="navBtn" onclick='openMapQuery(${JSON.stringify(e.map)})'>${pin}<span>導航</span></button>`:''}</div>`).join('');
 $('#food').innerHTML=d.food.map(x=>`<div class="food"><strong>${x}</strong><div class="detail">候選｜當天依狀況決定</div></div>`).join('');
 $('#stayName').textContent=d.stay;$('#stayBtn').onclick=()=>openMapQuery(d.stayMap);
 $('#days').innerHTML=data.days.map(x=>`<div class="dayRow" onclick="activeDay=${x.day};render();nav('today',$('.nav button'))"><div class="dayNo">0${x.day}</div><div><strong>${x.title}</strong><small>${x.date} · ${x.transport}</small></div><div>›</div></div>`).join('');
 $('#current').textContent=localStorage.current||'旅程尚未開始';$('#next').textContent=localStorage.next||'9/26 桃園機場 T1';$('#adminCurrent').value=localStorage.current||'';$('#adminNext').value=localStorage.next||'';
 renderCandidates();
}
function renderCandidates(){
 const list=candidates().filter(x=>Number(x.day)===activeDay);const box=$('#candidateGrid');
 if(!list.length){box.innerHTML=`<div class="note">目前沒有自訂候選景點。</div>`;return}
 box.innerHTML=list.map((x,i)=>`<div class="candidate">${x.image?`<img src="${x.image}" alt="${x.name}" onerror="this.style.display='none'">`:`<div style="height:90px;background:var(--earth);display:grid;place-items:center;color:var(--green)">MAP</div>`}<div class="candidateBody"><div class="candidateTitle">${x.name}</div><div class="candidateActions"><button class="tiny" onclick='openSharedMap(${JSON.stringify(x.url)})'>地圖</button></div></div></div>`).join('')
}
function save(){localStorage.current=$('#adminCurrent').value||'旅程尚未開始';localStorage.next=$('#adminNext').value||'9/26 桃園機場 T1';render();alert('已儲存在這台裝置')}
function guessName(url){
 try{const u=new URL(url);const m=u.pathname.match(/\/place\/([^/]+)/);if(m)return decodeURIComponent(m[1]).replace(/\+/g,' ')}catch(e){}
 return ''
}
function addCandidate(){
 const url=$('#candidateUrl').value.trim(),dayNum=Number($('#candidateDay').value);if(!url){alert('先貼 Google Maps 連結');return}
 const name=$('#candidateName').value.trim()||guessName(url)||'Google Maps 候選景點';
 const image=$('#candidateImage').value.trim();
 const list=candidates();list.push({day:dayNum,name,url,image});setCandidates(list);
 $('#candidateUrl').value='';$('#candidateName').value='';$('#candidateImage').value='';
 if(activeDay===dayNum)renderCandidates();renderAdminCandidates();alert('已加入候選')
}
function renderAdminCandidates(){
 const list=candidates(),box=$('#adminCandidates');if(!list.length){box.innerHTML='<div class="note">尚未新增候選。</div>';return}
 box.innerHTML=list.map((x,i)=>`<div class="adminCandidate"><div><strong>Day ${x.day}｜${x.name}</strong><div class="detail">${x.image?'有圖片':'尚未設定圖片'}</div></div><button class="remove" onclick="removeCandidate(${i})">刪除</button></div>`).join('')
}
function removeCandidate(i){let l=candidates();l.splice(i,1);setCandidates(l);renderAdminCandidates();renderCandidates()}
function ask(){let q=$('#q').value.trim();if(!q)return;$('#chat').innerHTML+=`<div class="msg">${q}</div>`;$('#q').value='';let a='目前可回答行程、住宿、航班、目前位置。';if(q.includes('住'))a=`今晚住宿：${day().stay}`;else if(q.includes('回台')||q.includes('班機'))a='10/1 星宇 JX839，19:55 NGO T1 起飛，22:00 抵達桃園 T1。';else if(q.includes('吃'))a='候選：'+day().food.join('、');else if(q.includes('現在')||q.includes('哪裡'))a=`目前：${$('#current').textContent}；下一站：${$('#next').textContent}`;$('#chat').innerHTML+=`<div class="msg">${a}</div>`}
load();
