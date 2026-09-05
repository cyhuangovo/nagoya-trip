
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const icons={
 map:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z"/><circle cx="12" cy="10" r="2"/></svg>`,
 home:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m4 11 8-7 8 7v9H4z"/><path d="M9 20v-6h6v6"/></svg>`,
 cal:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>`,
 ai:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="8"/><path d="M8.5 10h.01M15.5 10h.01M8.5 15c2.2 1.5 4.8 1.5 7 0"/></svg>`,
 bag:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="5" y="7" width="14" height="14" rx="2"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/></svg>`,
 gear:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/></svg>`,
 food:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M7 3v7M4 3v5c0 2 1 3 3 3s3-1 3-3V3M7 11v10M16 3v18M16 3c3 2 4 6 0 9"/></svg>`
};
let data,activeDay=3;
const mapUrl=q=>q?`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`:null;
async function load(){data=await fetch('trip.json').then(r=>r.json());restore();render();$$('[data-icon]').forEach(e=>e.innerHTML=icons[e.dataset.icon])}
function nav(id,btn){$$('.view').forEach(v=>v.classList.remove('active'));$('#'+id).classList.add('active');$$('.nav button').forEach(b=>b.classList.remove('active'));btn?.classList.add('active')}
function d(){return data.days.find(x=>x.day===activeDay)}
function render(){
 const x=d(); $('#current').textContent=localStorage.current||'白川鄉 合掌村';$('#next').textContent=localStorage.next||'15:30 返回高山';
 $('#daydate').textContent=`DAY ${x.day} · ${x.date}`;$('#daytitle').textContent=x.title;$('#transport').textContent=x.transport;$('#stay').textContent=x.stay;
 $('#timeline').innerHTML=x.events.map(e=>`<div class="event"><div class="time">${e[0]}</div><div><div class="place">${e[1]}</div><div class="detail">${e[2]}</div></div>${e[3]?`<a class="map" href="${mapUrl(e[3])}" target="_blank" aria-label="Google 地圖">${icons.map}</a>`:''}</div>`).join('');
 $('#food').innerHTML=x.food.map(f=>`<div class="food">${icons.food}<div><strong>${f}</strong><div class="detail">當天依體力與現場狀況決定</div></div></div>`).join('');
 $('#days').innerHTML=data.days.map(x=>`<div class="day" onclick="activeDay=${x.day};render();nav('today',$('.nav button'))"><div class="n">0${x.day}</div><div><strong>${x.title}</strong><small>${x.date} · ${x.transport}</small></div><div>›</div></div>`).join('');
 $('#adminCurrent').value=localStorage.current||'白川鄉 合掌村';$('#adminNext').value=localStorage.next||'15:30 返回高山';
}
function save(){localStorage.current=$('#adminCurrent').value;localStorage.next=$('#adminNext').value;render();alert('已儲存在這台裝置')}
function ask(){let q=$('#q').value.trim();if(!q)return;$('#chat').innerHTML+=`<div class="msg user">${q}</div>`;$('#q').value='';let a='可以問我今天行程、住宿、航班或目前位置。';if(q.includes('住'))a=`今晚住 ${d().stay}。`;else if(q.includes('回台')||q.includes('班機'))a='10/1 星宇 JX839，19:55 名古屋起飛，22:00 抵達桃園 T1。';else if(q.includes('現在')||q.includes('哪'))a=`目前位置：${$('#current').textContent}；下一站：${$('#next').textContent}。`;else if(q.includes('吃'))a='今天可考慮：'+d().food.join('、')+'。';$('#chat').innerHTML+=`<div class="msg">${a}</div>`}
function restore(){}
load();
