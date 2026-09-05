
const $=(s)=>document.querySelector(s); const $$=(s)=>[...document.querySelectorAll(s)];
let data, activeDay=3;
async function load(){data=await fetch('trip.json').then(r=>r.json()); render(); restoreAdmin();}
function nav(id,btn){$$('.view').forEach(v=>v.classList.remove('active')); $('#'+id).classList.add('active'); $$('.nav button').forEach(b=>b.classList.remove('active')); if(btn)btn.classList.add('active');}
function dayObj(n){return data.days.find(d=>d.day===n)}
function render(){
 $('#title').textContent=data.title; $('#dates').textContent=data.dates;
 $('#currentPlace').textContent=data.current.place; $('#currentStatus').textContent=data.current.status; $('#nextStop').textContent=data.current.next;
 $('#group').textContent=data.group.join('・');
 renderToday(); renderDays(); renderBookings(); renderAdmin();
}
function imgFor(d){return 'assets/'+d.image}
function renderToday(){
 const d=dayObj(activeDay);
 $('#todayTitle').textContent=`Day ${d.day}｜${d.date} ${d.title}`;
 $('#todayImage').src=imgFor(d);
 $('#todayTransport').textContent=d.transport;
 $('#todayTimeline').innerHTML=d.events.map(e=>`<div class="event"><time>${e.time}</time><strong>${e.title}</strong><div class="muted">${e.detail||''}</div></div>`).join('');
 $('#todayRestaurants').innerHTML=d.restaurants.map((r,i)=>`<div class="restaurant"><span class="badge orange">${i+1}</span> <b>${r}</b><div class="muted">候選餐廳｜之後可由管理頁更新</div></div>`).join('');
 $('#todayStay').textContent=d.stay;
}
function renderDays(){
 $('#days').innerHTML=data.days.map(d=>`<div class="card day-card" onclick="activeDay=${d.day};renderToday();nav('today',$('.nav button'))"><img src="${imgFor(d)}"><div class="grow"><div class="muted">Day ${d.day}｜${d.date}</div><div class="section-title" style="margin:2px 0">${d.title}</div><span class="badge">${d.transport}</span></div><div>›</div></div>`).join('');
}
function renderBookings(){
 $('#bookings').innerHTML=data.bookings.map(b=>`<div class="card booking"><img src="assets/${b.attachment}"><div class="grow"><b>${b.title}</b><div class="muted">${b.detail}</div><button class="btn" style="margin-top:8px" onclick="openAttachment('${b.attachment}')">查看附件</button></div></div>`).join('');
}
function openAttachment(a){window.open('assets/'+a,'_blank')}
function renderAdmin(){
 const d=dayObj(activeDay); $('#adminDay').textContent=`Day ${d.day}｜${d.date}`;
 $('#adminTitle').value=d.title; $('#adminTransport').value=d.transport; $('#adminRestaurants').value=d.restaurants.join('\n');
 $('#adminCurrent').value=data.current.place; $('#adminStatus').value=data.current.status; $('#adminNext').value=data.current.next;
}
function saveAdmin(){
 const d=dayObj(activeDay); d.title=$('#adminTitle').value; d.transport=$('#adminTransport').value; d.restaurants=$('#adminRestaurants').value.split('\n').filter(Boolean).slice(0,3);
 data.current.place=$('#adminCurrent').value; data.current.status=$('#adminStatus').value; data.current.next=$('#adminNext').value;
 localStorage.setItem('tripOverrides',JSON.stringify(data)); alert('已儲存在這支手機的瀏覽器中（示範版）'); render();
}
function restoreAdmin(){const s=localStorage.getItem('tripOverrides'); if(s){try{data=JSON.parse(s);render()}catch{}}}
function adminPrev(){activeDay=Math.max(1,activeDay-1);renderAdmin()}
function adminNext(){activeDay=Math.min(6,activeDay+1);renderAdmin()}
function askAI(){
 const q=$('#aiInput').value.trim(); if(!q)return; $('#chat').innerHTML+=`<div class="ai-msg user">${q}</div>`; $('#aiInput').value='';
 const text=q.toLowerCase(); let ans='';
 if(text.includes('住')||text.includes('飯店')) ans=`今晚住宿是 ${dayObj(activeDay).stay}。`;
 else if(text.includes('回台')||text.includes('回家')||text.includes('班機')) ans='10/1 搭星宇航空 JX839，19:55 從名古屋中部國際機場 T1 起飛，22:00 抵達桃園 T1。';
 else if(text.includes('吃')||text.includes('餐廳')) ans='目前餐廳尚未完全決定。今天有三個候選：'+dayObj(activeDay).restaurants.join('、')+'。';
 else if(text.includes('哪')||text.includes('現在')) ans=`目前示範狀態：${data.current.place}，${data.current.status}；下一站是 ${data.current.next}。`;
 else if(text.includes('明天')) {let d=dayObj(Math.min(6,activeDay+1)); ans=`明天是 Day ${d.day}：${d.title}。交通方式是 ${d.transport}。`;}
 else ans='我目前可以回答這趟旅行的行程、住宿、交通、航班與餐廳候選。這個原型使用本機資料；正式版接上 AI 後可以直接搜尋你上傳的訂單與截圖。';
 setTimeout(()=>$('#chat').innerHTML+=`<div class="ai-msg ai">${ans}</div>`,150);
}
load();
