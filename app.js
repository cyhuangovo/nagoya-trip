
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let data,activeDay=1;
const mapIcon=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z"/><circle cx="12" cy="10" r="2"/></svg>`;
const icons={
 home:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m4 11 8-7 8 7v9H4z"/><path d="M9 20v-6h6v6"/></svg>`,
 cal:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>`,
 ai:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="8"/><path d="M8.5 10h.01M15.5 10h.01M8.5 15c2.2 1.5 4.8 1.5 7 0"/></svg>`,
 bag:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="5" y="7" width="14" height="14" rx="2"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/></svg>`,
 gear:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/></svg>`
};
const mapUrl=q=>`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
const day=()=>data.days.find(x=>x.day===activeDay);
async function load(){data=await fetch('trip.json').then(r=>r.json());render();$$('[data-icon]').forEach(e=>e.innerHTML=icons[e.dataset.icon])}
function nav(id,b){$$('.view').forEach(v=>v.classList.remove('active'));$('#'+id).classList.add('active');$$('.nav button').forEach(x=>x.classList.remove('active'));if(b)b.classList.add('active')}
function render(){
 let d=day();
 $('#dayLabel').textContent=`DAY ${d.day}｜${d.date}`;
 $('#dayTitle').textContent=d.title; $('#transport').textContent=d.transport; $('#stay').textContent=d.stay;
 $('#hero').src=d.image; $('#hero').alt=d.imageAlt; $('#photoCaption').textContent=d.imageAlt;
 $('#hero').onerror=()=>{ $('#hero').style.display='none'; $('#photoCaption').textContent='圖片暫時無法載入，可換成你指定的照片。'; };
 $('#timeline').innerHTML=d.events.map(e=>`<div class="event"><div class="time">${e.time}</div><div><div class="place">${e.place}</div><div class="detail">${e.detail}</div></div>${e.map?`<a class="navBtn" target="_blank" rel="noopener" href="${mapUrl(e.map)}">${mapIcon}<span>導航</span></a>`:''}</div>`).join('');
 $('#food').innerHTML=d.food.map(x=>`<div class="food"><div class="foodIcon">●</div><div><strong>${x}</strong><div class="detail">候選｜當天依狀況決定</div></div></div>`).join('');
 $('#days').innerHTML=data.days.map(x=>`<div class="dayRow" onclick="activeDay=${x.day};render();nav('today',$('.nav button'))"><div class="dayNo">0${x.day}</div><div><strong>${x.title}</strong><small>${x.date} · ${x.transport}</small></div><div>›</div></div>`).join('');
 $('#current').textContent=localStorage.current||'旅程尚未開始';$('#next').textContent=localStorage.next||'9/26 桃園機場 T1';
 $('#adminCurrent').value=localStorage.current||'';$('#adminNext').value=localStorage.next||'';
}
function save(){localStorage.current=$('#adminCurrent').value||'旅程尚未開始';localStorage.next=$('#adminNext').value||'9/26 桃園機場 T1';render();alert('已儲存在這台裝置')}
function ask(){let q=$('#q').value.trim();if(!q)return;$('#chat').innerHTML+=`<div class="msg">${q}</div>`;$('#q').value='';let a='目前可回答行程、住宿、航班、目前位置。';if(q.includes('住'))a=`今晚住宿：${day().stay}`;else if(q.includes('回台')||q.includes('班機'))a='10/1 星宇 JX839，19:55 NGO T1 起飛，22:00 抵達桃園 T1。';else if(q.includes('吃'))a='候選：'+day().food.join('、');else if(q.includes('現在')||q.includes('哪裡'))a=`目前：${$('#current').textContent}；下一站：${$('#next').textContent}`;$('#chat').innerHTML+=`<div class="msg">${a}</div>`}
load();
