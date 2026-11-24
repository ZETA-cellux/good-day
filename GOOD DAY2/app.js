"use strict";
const $=s=>document.querySelector(s),esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const LOGO='<svg viewBox="0 0 64 64" fill="none" stroke="var(--acc)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M48 18a20 20 0 1 0 4 14H34"/><path d="M20 44l8-9 6 5 12-15" stroke="var(--inc)"/></svg>';
const T={en:{dash:"Dashboard",tx:"Transactions",an:"Analytics",cal:"Calendar",goals:"Goals",set:"Settings",adm:"Admin"},uz:{dash:"Bosh sahifa",tx:"Tranzaksiyalar",an:"Tahlil",cal:"Kalendar",goals:"Maqsadlar",set:"Sozlamalar",adm:"Admin"},ru:{dash:"Главная",tx:"Операции",an:"Аналитика",cal:"Календарь",goals:"Цели",set:"Настройки",adm:"Админ"}};
const IC=["Salary","Business","Trading","Freelance","Other Income"],EC=["Food","Transport","Shopping","Education","Entertainment","Health","Bills","Other Expenses"];
const QUOTES=["A budget is telling your money where to go instead of wondering where it went.","Small savings, made daily, become big freedom.","Discipline is choosing what you want most over what you want now.","Track it, and you can improve it.","Pay yourself first: save before you spend.","Progress beats perfection. One good day at a time.","Goals are dreams with a deadline and a plan.","Invest in yourself; it pays the best interest.","Do the important thing first, the rest will follow.","Wealth is built quietly, by habits nobody applauds."];
let db,user,uid,isAdmin=false,S={tx:[],goals:[],prefs:{cur:"USD",lang:"en",name:"",theme:"system"}},status="loading",tab="dash",apps=[],decs={},myApp=null,sel=null,calM=new Date(),editId=null,qf={q:"",cat:"",from:"",to:""},an={mode:"month",v:"",from:"",to:""},showN=false;
const today=()=>new Date().toISOString().slice(0,10);
const money=n=>{try{return new Intl.NumberFormat(LOC[S.prefs.lang]||undefined,{style:"currency",currency:S.prefs.cur,maximumFractionDigits:S.prefs.cur==="UZS"?0:2}).format(n)}catch{return n.toFixed(2)}};
// ===== Supabase config (public anon key is safe; RLS protects data) =====
const SB_URL="https://dzhktireydcnzjckkpgm.supabase.co",SB_KEY="sb_publishable_ynJDSh-5VACHC8B8oWgBGg_mj58JgJr";
const sb=(window.supabase&&!SB_URL.includes("YOUR-"))?supabase.createClient(SB_URL,SB_KEY):null;
let am="login",me=null,profs=[],notif=[];
function authView(){const r=am==="reg";return`<main class="gate card" style="margin-top:10vh">${topCtl()}${LOGO.replace("<svg","<svg style='width:60px'")}<h2 style="letter-spacing:.2em;color:var(--pri)">GOOD DAY</h2><p class="mut">Manage Your Money. Own Your Day.</p><p><b>${r?"Request access":"Sign in"}</b></p><input id="ae" type="email" placeholder="Email" autocomplete="email">${r?'<input id="au" placeholder="Username" maxlength="20" style="margin-top:8px">':""}<input id="ap" type="password" placeholder="Password (min 8 characters)" style="margin-top:8px" autocomplete="current-password"><p><button class="btn" onclick="auth()">${r?"Submit request":"Sign in"}</button></p><p class="mut"><a href="#" onclick="am='${r?"login":"reg"}';render();return false" style="color:var(--pri)">${r?"I have an account":"Request access"}</a></p></main>`}
async function auth(){const e=$("#ae").value.trim(),p=$("#ap").value;if(!/^\S+@\S+\.\S+$/.test(e))return alert("Enter a valid email.");if(p.length<8)return alert("Password must be at least 8 characters.");
 if(am==="login"){const{error}=await sb.auth.signInWithPassword({email:e,password:p});if(error)alert(error.message)}
 else{const u=$("#au").value.trim();if(!/^[A-Za-z0-9_]{3,20}$/.test(u))return alert("Username: 3-20 letters, digits or _.");
  const{data,error}=await sb.auth.signUp({email:e,password:p,options:{data:{username:u}}});if(error)return alert(error.message);
  if(!data.session){am="login";render();alert("Request sent. Confirm your email, then sign in.")}}}
async function logout(){await sb.auth.signOut();location.reload()}
async function chpw(){const n=$("#pw1").value;if(n.length<8)return alert("Password must be at least 8 characters.");const{error}=await sb.auth.updateUser({password:n});alert(error?error.message:"Password changed.")}
// ===== i18n (uz / ru / en) =====
const LOC={en:"en-US",uz:"uz-UZ",ru:"ru-RU"};
try{const l=localStorage.getItem("gd-lang");if(l&&LOC[l])S.prefs.lang=l}catch{}
document.documentElement.lang=S.prefs.lang;
const D={
"Manage Your Money. Own Your Day.":["Pulingizni boshqaring. Kuningizga ega bo‘ling.","Управляйте деньгами. Владейте своим днём."],
"Request access":["Kirishga ruxsat so‘rash","Запросить доступ"],"Sign in":["Kirish","Войти"],"Username":["Foydalanuvchi nomi","Имя пользователя"],
"Password (min 8 characters)":["Parol (kamida 8 belgi)","Пароль (минимум 8 символов)"],"Submit request":["Ariza yuborish","Отправить заявку"],
"I have an account":["Menda akkaunt bor","У меня есть аккаунт"],"Log out":["Chiqish","Выйти"],"Loading…":["Yuklanmoqda…","Загрузка…"],
"⏳ Your request is pending. You’ll be notified here once the administrator decides.":["⏳ Arizangiz ko‘rib chiqilmoqda. Administrator qaror qilgach, shu yerda xabar olasiz.","⏳ Ваша заявка на рассмотрении. Вы получите уведомление здесь, когда администратор примет решение."],
"Your registration request was rejected.":["Ro‘yxatdan o‘tish arizangiz rad etildi.","Ваша заявка на регистрацию отклонена."],
"Your account is suspended. Contact the administrator.":["Akkauntingiz to‘xtatilgan. Administrator bilan bog‘laning.","Ваш аккаунт приостановлен. Свяжитесь с администратором."],
"Theme":["Mavzu","Тема"],"Total Balance":["Umumiy balans","Общий баланс"],"Total Income":["Jami daromad","Общий доход"],"Total Expenses":["Jami xarajat","Общие расходы"],
"Remaining this month":["Shu oyda qolgan","Остаток за месяц"],"Today":["Bugun","Сегодня"],"This month":["Shu oy","Этот месяц"],
"✦ Daily Motivation":["✦ Kunlik motivatsiya","✦ Мотивация дня"],"Recent transactions":["So‘nggi tranzaksiyalar","Последние операции"],
"No transactions yet. Add your first one.":["Hozircha tranzaksiya yo‘q. Birinchisini qo‘shing.","Операций пока нет. Добавьте первую."],
"Add transaction":["Tranzaksiya qo‘shish","Добавить операцию"],"Edit transaction":["Tranzaksiyani tahrirlash","Редактировать операцию"],
"Save changes":["O‘zgarishlarni saqlash","Сохранить изменения"],"Cancel":["Bekor qilish","Отмена"],"Type":["Turi","Тип"],"Income":["Daromad","Доход"],
"Expense":["Xarajat","Расход"],"Expenses":["Xarajatlar","Расходы"],"Amount":["Summa","Сумма"],"Category":["Kategoriya","Категория"],"Date":["Sana","Дата"],
"Time":["Vaqt","Время"],"Description":["Izoh","Описание"],"Notes (optional)":["Qaydlar (ixtiyoriy)","Заметки (необязательно)"],"History":["Tarix","История"],
"Search…":["Qidirish…","Поиск…"],"All categories":["Barcha kategoriyalar","Все категории"],"items":["ta yozuv","записей"],"Balance":["Balans","Баланс"],
"Nothing found.":["Hech narsa topilmadi.","Ничего не найдено."],
"⬇ Export Excel (.csv) for these filters":["⬇ Excel (.csv) ga eksport (joriy filtr)","⬇ Экспорт в Excel (.csv) по фильтру"],
"⬇ Export this period (Excel .csv)":["⬇ Shu davrni eksport (Excel .csv)","⬇ Экспорт периода (Excel .csv)"],
"🖨 Save as PDF":["🖨 PDF sifatida saqlash","🖨 Сохранить как PDF"],
"Salary":["Oylik","Зарплата"],"Business":["Biznes","Бизнес"],"Trading":["Treyding","Трейдинг"],"Freelance":["Frilans","Фриланс"],"Other Income":["Boshqa daromad","Другой доход"],
"Food":["Oziq-ovqat","Еда"],"Transport":["Transport","Транспорт"],"Shopping":["Xaridlar","Покупки"],"Education":["Ta’lim","Образование"],
"Entertainment":["Ko‘ngilochar","Развлечения"],"Health":["Salomatlik","Здоровье"],"Bills":["To‘lovlar","Счета"],"Other Expenses":["Boshqa xarajatlar","Другие расходы"],
"Period":["Davr","Период"],"Day":["Kun","День"],"Month":["Oy","Месяц"],"Year":["Yil","Год"],"Custom":["Ixtiyoriy","Свой"],
"Income vs Expenses":["Daromad va xarajat","Доходы и расходы"],"Cumulative balance":["Jamlanma balans","Накопленный баланс"],
"Spending by category":["Kategoriya bo‘yicha xarajat","Расходы по категориям"],"Income by category":["Kategoriya bo‘yicha daromad","Доходы по категориям"],
"Highest spending days":["Eng ko‘p xarajat kunlari","Дни с наибольшими расходами"],"Highest earning days":["Eng ko‘p daromad kunlari","Дни с наибольшим доходом"],
"Net":["Sof","Итого"],"No data":["Ma’lumot yo‘q","Нет данных"],
"New savings goal":["Yangi jamg‘arma maqsadi","Новая цель накоплений"],"e.g. New phone":["masalan: yangi telefon","напр.: новый телефон"],
"Target amount":["Maqsad summasi","Целевая сумма"],"Saved so far":["Hozirgacha jamg‘arilgan","Накоплено"],"Create":["Yaratish","Создать"],
"Add savings":["Jamg‘arma qo‘shish","Добавить сумму"],"No goals yet.":["Hozircha maqsad yo‘q.","Целей пока нет."],"remaining":["qoldi","осталось"],
"Profile":["Profil","Профиль"],"Display name":["Ko‘rinadigan ism","Отображаемое имя"],"Currency":["Valyuta","Валюта"],"Language":["Til","Язык"],
"Light Mode":["Kunduzgi rejim","Светлая тема"],"Dark Mode":["Tungi rejim","Тёмная тема"],"System Default":["Tizim bo‘yicha","Как в системе"],
"Save settings":["Sozlamalarni saqlash","Сохранить настройки"],"Account":["Akkaunt","Аккаунт"],"New password":["Yangi parol","Новый пароль"],
"Change password":["Parolni o‘zgartirish","Сменить пароль"],"Delete all my financial data":["Barcha moliyaviy ma’lumotlarimni o‘chirish","Удалить все мои финансовые данные"],
"Pending requests":["Kutilayotgan arizalar","Ожидающие заявки"],"No pending requests.":["Kutilayotgan ariza yo‘q.","Нет ожидающих заявок."],
"Registered users & history":["Ro‘yxatdagi foydalanuvchilar va tarix","Пользователи и история"],"Registered":["Ro‘yxatdan o‘tgan","Зарегистрирован"],
"Approve":["Tasdiqlash","Одобрить"],"Reject":["Rad etish","Отклонить"],"Suspend":["To‘xtatish","Приостановить"],"No users yet.":["Hozircha foydalanuvchi yo‘q.","Пользователей пока нет."],
"pending":["kutilmoqda","ожидает"],"approved":["tasdiqlangan","одобрен"],"rejected":["rad etilgan","отклонён"],"suspended":["to‘xtatilgan","приостановлен"],
"Notifications":["Bildirishnomalar","Уведомления"],"Nothing new.":["Yangilik yo‘q.","Ничего нового."],
"Your registration was approved. Welcome!":["Ro‘yxatdan o‘tishingiz tasdiqlandi. Xush kelibsiz!","Ваша регистрация одобрена. Добро пожаловать!"],
"Your account has been suspended.":["Akkauntingiz to‘xtatildi.","Ваш аккаунт приостановлен."],"Your registration was rejected.":["Ro‘yxatdan o‘tishingiz rad etildi.","Ваша регистрация отклонена."],
"New registration request:":["Yangi ro‘yxatdan o‘tish arizasi:","Новая заявка на регистрацию:"],
"Enter a valid email.":["To‘g‘ri email kiriting.","Введите корректный email."],"Password must be at least 8 characters.":["Parol kamida 8 belgidan iborat bo‘lsin.","Пароль должен содержать минимум 8 символов."],
"Username: 3-20 letters, digits or _.":["Foydalanuvchi nomi: 3-20 ta harf, raqam yoki _.","Имя: 3-20 букв, цифр или _."],
"Request sent. Confirm your email, then sign in.":["Ariza yuborildi. Emailingizni tasdiqlab, keyin kiring.","Заявка отправлена. Подтвердите email и войдите."],
"Enter a positive amount and a date.":["Musbat summa va sanani kiriting.","Введите положительную сумму и дату."],
"Enter a name and a positive target.":["Nom va musbat maqsad summasini kiriting.","Введите название и положительную сумму цели."],
"Password changed.":["Parol o‘zgartirildi.","Пароль изменён."],"Save failed:":["Saqlab bo‘lmadi:","Не удалось сохранить:"],
"Delete this transaction?":["Bu tranzaksiya o‘chirilsinmi?","Удалить эту операцию?"],"Delete goal?":["Maqsad o‘chirilsinmi?","Удалить цель?"],
"Permanently delete all transactions and goals?":["Barcha tranzaksiya va maqsadlar butunlay o‘chirilsinmi?","Удалить все операции и цели навсегда?"],
"A budget is telling your money where to go instead of wondering where it went.":["Byudjet — pulingiz qayerga ketganini o‘ylab yurish emas, qayerga ketishini o‘zingiz aytishdir.","Бюджет — это когда вы говорите деньгам, куда идти, а не гадаете, куда они ушли."],
"Small savings, made daily, become big freedom.":["Har kungi kichik jamg‘arma katta erkinlikka aylanadi.","Маленькие ежедневные сбережения становятся большой свободой."],
"Discipline is choosing what you want most over what you want now.":["Intizom — hozirgi xohishdan ko‘ra eng muhim maqsadni tanlashdir.","Дисциплина — выбирать то, чего хочешь больше всего, а не то, чего хочется сейчас."],
"Track it, and you can improve it.":["Uni kuzatib borsangiz, yaxshilay olasiz.","Следите за этим — и вы сможете улучшить."],
"Pay yourself first: save before you spend.":["Avval o‘zingizga to‘lang: sarflashdan oldin jamg‘aring.","Сначала заплатите себе: откладывайте до трат."],
"Progress beats perfection. One good day at a time.":["Taraqqiyot mukammallikdan ustun. Har safar bitta yaxshi kun.","Прогресс важнее совершенства. По одному хорошему дню."],
"Goals are dreams with a deadline and a plan.":["Maqsad — muddati va rejasi bor orzudir.","Цели — это мечты со сроком и планом."],
"Invest in yourself; it pays the best interest.":["O‘zingizga sarmoya kiriting: u eng yaxshi foyda beradi.","Инвестируйте в себя: это приносит лучший доход."],
"Do the important thing first, the rest will follow.":["Avval muhim ishni qiling, qolgani ortidan keladi.","Сначала сделайте важное, остальное приложится."],
"Wealth is built quietly, by habits nobody applauds.":["Boylik jimgina, hech kim olqishlamaydigan odatlar bilan quriladi.","Богатство строится тихо — привычками, которым никто не аплодирует."],
"Mo":["Du","Пн"],"Tu":["Se","Вт"],"We":["Chor","Ср"],"Th":["Pa","Чт"],"Fr":["Ju","Пт"],"Sa":["Sh","Сб"],"Su":["Ya","Вс"]};
const DK=new RegExp("(?<![A-Za-z])(?:"+Object.keys(D).sort((a,b)=>b.length-a.length).map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|")+")(?![A-Za-z])","g");
const LI={uz:0,ru:1};
function tr(str){const i=LI[S.prefs.lang];return i===undefined?str:str.replace(DK,m=>D[m][i])}
function trDom(root){if(LI[S.prefs.lang]===undefined||!root)return;const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;
 while(n=w.nextNode()){const v=n.nodeValue;if(v.trim()){const r=tr(v);if(r!==v)n.nodeValue=r}}
 root.querySelectorAll("[placeholder],[title]").forEach(e=>["placeholder","title"].forEach(a=>{const v=e.getAttribute(a);if(v)e.setAttribute(a,tr(v))}))}
function render(){render0();trDom(document.querySelector("#app"))}
const _al=window.alert.bind(window),_cf=window.confirm.bind(window);window.alert=m=>_al(tr(String(m)));window.confirm=m=>_cf(tr(String(m)));
function setLang(l){S.prefs.lang=l;document.documentElement.lang=l;try{localStorage.setItem("gd-lang",l)}catch{}savePrefs();render()}
const FL={
en:'<svg viewBox="0 0 60 40" preserveAspectRatio="none"><rect width="60" height="40" fill="#012169"/><path d="M0 0L60 40M60 0L0 40" stroke="#fff" stroke-width="8"/><path d="M0 0L60 40M60 0L0 40" stroke="#C8102E" stroke-width="3"/><path d="M30 0V40M0 20H60" stroke="#fff" stroke-width="12"/><path d="M30 0V40M0 20H60" stroke="#C8102E" stroke-width="7"/></svg>',
ru:'<svg viewBox="0 0 60 40" preserveAspectRatio="none"><rect width="60" height="14" fill="#fff"/><rect y="13" width="60" height="14" fill="#0039A6"/><rect y="26" width="60" height="14" fill="#D52B1E"/></svg>',
uz:'<svg viewBox="0 0 60 40" preserveAspectRatio="none"><rect width="60" height="14" fill="#0099B5"/><rect y="13" width="60" height="1.2" fill="#CE1126"/><rect y="14" width="60" height="12" fill="#fff"/><rect y="26" width="60" height="1.2" fill="#CE1126"/><rect y="27" width="60" height="13" fill="#1EB53A"/><circle cx="9" cy="6.5" r="4" fill="#fff"/><circle cx="10.6" cy="6.5" r="3.4" fill="#0099B5"/><g fill="#fff"><circle cx="17" cy="3.5" r=".9"/><circle cx="21" cy="3.5" r=".9"/><circle cx="25" cy="3.5" r=".9"/><circle cx="19" cy="7" r=".9"/><circle cx="23" cy="7" r=".9"/><circle cx="21" cy="10.4" r=".9"/></g></svg>'};
const FN={en:"English",ru:"Русский",uz:"O‘zbek"};
const langSel=()=>`<div class="flags">${["en","ru","uz"].map(l=>`<button class="fl ${S.prefs.lang===l?"on":""}" title="${FN[l]}" aria-label="${FN[l]}" onclick="setLang('${l}')">${FL[l]}</button>`).join("")}</div>`;
const topCtl=()=>`<div style="display:flex;gap:8px;justify-content:flex-end;margin-bottom:6px">${langSel()}<button class="ib" onclick="setTheme(document.documentElement.dataset.t==='dark'?'light':'dark')">${document.documentElement.dataset.t==="dark"?"🌙":"☀️"}</button></div>`;
// theme
function applyTheme(){let t=S.prefs.theme;if(t==="system")t=matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light";document.documentElement.dataset.t=t}
try{const s=localStorage.getItem("gd-theme");if(s)S.prefs.theme=s}catch{}
applyTheme();matchMedia("(prefers-color-scheme:dark)").addEventListener("change",applyTheme);
function setTheme(t){S.prefs.theme=t;try{localStorage.setItem("gd-theme",t)}catch{}applyTheme();savePrefs();render()}
// persistence (Postgres, protected by RLS)
const put=(k,v)=>{if(!sb||!uid)return;sb.from("user_data").upsert({user_id:uid,key:k,value:v}).then(r=>{if(r.error)alert("Save failed: "+r.error.message)})};
const saveTx=()=>put("tx",{list:S.tx}),saveGoals=()=>put("goals",{list:S.goals}),savePrefs=()=>put("prefs",S.prefs);
async function load(){const{data}=await sb.from("user_data").select("key,value");(data||[]).forEach(r=>{if(r.key==="tx")S.tx=r.value.list||[];if(r.key==="goals")S.goals=r.value.list||[];if(r.key==="prefs")Object.assign(S.prefs,r.value,{theme:S.prefs.theme,lang:S.prefs.lang})});applyTheme()}
async function boot(){
 setTimeout(()=>{const s=$("#splash");s.style.opacity=0;setTimeout(()=>s.remove(),600);$("#app").hidden=false},1800);
 if(!sb){status="nosb";return render()}
 sb.auth.onAuthStateChange((ev,ses)=>{if(ses&&ses.user.id!==uid)enter(ses.user)});
 const{data}=await sb.auth.getSession();if(data.session)enter(data.session.user);else{status="auth";render()}}
async function enter(u){uid=u.id;status="loading";render();await loadProf();loadNotes();
 sb.channel("gd-"+uid).on("postgres_changes",{event:"*",schema:"public",table:"profiles"},loadProf).on("postgres_changes",{event:"*",schema:"public",table:"notifications"},loadNotes).subscribe()}
async function loadProf(){const{data}=await sb.from("profiles").select("*").order("created_at",{ascending:false});profs=data||[];me=profs.find(p=>p.id===uid);
 if(!me){status="loading";return render()}isAdmin=me.role==="admin"&&me.status==="approved";status=me.status;
 if(status==="approved"&&!S.loaded){S.loaded=1;await load()}render()}
async function loadNotes(){const{data}=await sb.from("notifications").select("*").order("created_at",{ascending:false}).limit(30);notif=data||[];render()}
function bell(){showN=!showN;if(!showN&&notif.some(n=>!n.read))sb.from("notifications").update({read:true}).eq("read",false).then(loadNotes);render()}
async function setSt(id,st){const{error}=await sb.rpc("set_status",{target:id,new_status:st});if(error)alert(error.message);loadProf()}
// calc
const tot=l=>({i:l.filter(t=>t.type==="income").reduce((a,t)=>a+t.amount,0),e:l.filter(t=>t.type==="expense").reduce((a,t)=>a+t.amount,0)});
const row=t=>`<div class="tx"><div class="d"><b>${esc(t.cat)}</b> <span class="mut">${esc(t.desc||"")}</span><div class="mut">${t.date} ${t.time||""}${t.notes?" · "+esc(t.notes):""}</div></div><b class="${t.type==="income"?"inc":"exp"}">${t.type==="income"?"+":"−"}${money(t.amount)}</b>${t.edit===0?"":`<button class="ib" style="width:32px;height:32px" onclick="edit('${t.id}')">✎</button><button class="ib" style="width:32px;height:32px" onclick="del('${t.id}')">🗑</button>`}</div>`;
// charts
function bars(data){const w=600,h=200,m=Math.max(1,...data.flatMap(d=>[d.i,d.e])),bw=Math.max(3,Math.min(24,w/data.length/2.6));
 return`<svg viewBox="0 0 ${w} ${h+20}" width="100%">${data.map((d,k)=>{const x=20+k*(w-30)/data.length,hi=d.i/m*h,he=d.e/m*h;return`<rect x="${x}" y="${h-hi}" width="${bw}" height="${hi}" rx="2" fill="var(--inc)"><title>${d.l} income ${money(d.i)}</title></rect><rect x="${x+bw+1}" y="${h-he}" width="${bw}" height="${he}" rx="2" fill="var(--exp)"><title>${d.l} expenses ${money(d.e)}</title></rect>${data.length<=16||k%Math.ceil(data.length/12)==0?`<text x="${x}" y="${h+14}">${d.l}</text>`:""}`}).join("")}</svg>`}
function line(data){const w=600,h=180;let c=0;const p=data.map(d=>c+=d.i-d.e),mx=Math.max(1,...p),mn=Math.min(0,...p),y=v=>h-(v-mn)/(mx-mn||1)*h+5;
 return`<svg viewBox="0 0 ${w} ${h+15}" width="100%"><line x1="0" x2="${w}" y1="${y(0)}" y2="${y(0)}" stroke="var(--bd)"/><polyline fill="none" stroke="var(--acc)" stroke-width="3" stroke-linejoin="round" points="${p.map((v,k)=>`${10+k*(w-20)/Math.max(1,p.length-1)},${y(v)}`).join(" ")}"/></svg>`}
function pie(map,cols){const e=Object.entries(map).filter(x=>x[1]>0),s=e.reduce((a,x)=>a+x[1],0);if(!s)return'<p class="mut">No data</p>';let a=-Math.PI/2;
 const sl=e.map(([k,v],i)=>{const b=a+v/s*2*Math.PI,f=b-a>Math.PI?1:0,c=cols[i%cols.length],P=t=>[60+54*Math.cos(t),60+54*Math.sin(t)],[x1,y1]=P(a),[x2,y2]=P(b);a=b;return{k,v,c,d:e.length===1?`<circle cx="60" cy="60" r="54" fill="${c}"/>`:`<path d="M60 60L${x1} ${y1}A54 54 0 ${f} 1 ${x2} ${y2}Z" fill="${c}"><title>${k}</title></path>`}});
 return`<div class="row" style="align-items:center"><svg viewBox="0 0 120 120" style="max-width:150px">${sl.map(x=>x.d).join("")}</svg><div style="flex:2">${sl.map(x=>`<div class="mut"><span style="color:${x.c}">●</span> ${esc(x.k)} — ${money(x.v)} (${Math.round(x.v/s*100)}%)</div>`).join("")}</div></div>`}
const COL=["#243B53","#78A88B","#D6B46A","#E88787","#8BB8E8","#9b7fb8","#5aa9a3","#b08968"];
const byCat=(l,t)=>l.filter(x=>x.type===t).reduce((m,x)=>(m[x.cat]=(m[x.cat]||0)+x.amount,m),{});
// views
function vDash(){const t=tot(S.tx),td=tot(S.tx.filter(x=>x.date===today())),mo=tot(S.tx.filter(x=>x.date.slice(0,7)===today().slice(0,7))),q=QUOTES[Math.floor(Date.now()/864e5)%QUOTES.length];
 const c=(l,v,k="")=>`<div class="card"><div class="mut">${l}</div><div class="big ${k}">${money(v)}</div></div>`;
 return`<div class="grid">${c("Total Balance",t.i-t.e)}${c("Total Income",t.i,"inc")}${c("Total Expenses",t.e,"exp")}${c("Remaining this month",mo.i-mo.e)}</div>
 <div class="grid g2" style="margin-top:14px"><div class="card"><h3>Today</h3><span class="inc">+${money(td.i)}</span> · <span class="exp">−${money(td.e)}</span><h3 style="margin-top:14px">This month</h3><span class="inc">+${money(mo.i)}</span> · <span class="exp">−${money(mo.e)}</span></div>
 <div class="card" style="border-color:var(--acc)"><h3>✦ Daily Motivation</h3><i>“${q}”</i></div></div>
 <div class="card" style="margin-top:14px"><h3>Recent transactions</h3>${S.tx.length?[...S.tx].sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time)).slice(0,6).map(row).join(""):'<p class="mut">No transactions yet. Add your first one.</p>'}</div>`}
function vTx(){const e=S.tx.find(x=>x.id===editId)||{type:"expense",date:today(),time:new Date().toTimeString().slice(0,5),cat:"Food"};
 const l=S.tx.filter(t=>(!qf.q||(t.desc+t.notes+t.cat).toLowerCase().includes(qf.q.toLowerCase()))&&(!qf.cat||t.cat===qf.cat)&&(!qf.from||t.date>=qf.from)&&(!qf.to||t.date<=qf.to)).sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time)),t=tot(l);
 return`<div class="card"><h3>${editId?"Edit":"Add"} transaction</h3><div class="row"><div><label>Type</label><select id="f_type" onchange="typeCh()"><option value="income" ${e.type==="income"?"selected":""}>Income</option><option value="expense" ${e.type==="expense"?"selected":""}>Expense</option></select></div>
 <div><label>Amount</label><input id="f_amt" type="number" min="0" step="0.01" value="${e.amount||""}"></div><div><label>Category</label><select id="f_cat">${(e.type==="income"?IC:EC).map(c=>`<option value="${c}" ${c===e.cat?"selected":""}>${c}</option>`).join("")}</select></div>
 <div><label>Date</label><input id="f_date" type="date" value="${e.date}"></div><div><label>Time</label><input id="f_time" type="time" value="${e.time}"></div></div>
 <div class="row"><div><label>Description</label><input id="f_desc" maxlength="120" value="${esc(e.desc)}"></div><div><label>Notes (optional)</label><input id="f_notes" maxlength="300" value="${esc(e.notes)}"></div></div>
 <p><button class="btn" onclick="saveTxn()">${editId?"Save changes":"Add transaction"}</button> ${editId?'<button class="btn g" onclick="editId=null;render()">Cancel</button>':""}</p></div>
 <div class="card" style="margin-top:14px"><h3>History</h3><div class="row"><input placeholder="Search…" value="${esc(qf.q)}" oninput="qf.q=this.value;rl()"><select onchange="qf.cat=this.value;rl()"><option value="">All categories</option>${[...IC,...EC].map(c=>`<option value="${c}" ${qf.cat===c?"selected":""}>${c}</option>`).join("")}</select><input type="date" value="${qf.from}" onchange="qf.from=this.value;rl()"><input type="date" value="${qf.to}" onchange="qf.to=this.value;rl()"></div>
 <p class="mut">${l.length} items · <span class="inc">+${money(t.i)}</span> · <span class="exp">−${money(t.e)}</span> · Balance ${money(t.i-t.e)}</p><div id="txl">${l.map(row).join("")||'<p class="mut">Nothing found.</p>'}</div>
 <p><button class="btn g" onclick="exportCsv()">⬇ Export Excel (.csv) for these filters</button> <button class="btn g" onclick="print()">🖨 Save as PDF</button></p></div>`}
function rl(){const f=document.activeElement,id=f&&f.id;render();}
function typeCh(){const t=$("#f_type").value;$("#f_cat").innerHTML=(t==="income"?IC:EC).map(c=>`<option value="${c}">${c}</option>`).join("");trDom($("#f_cat"))}
function saveTxn(){const a=parseFloat($("#f_amt").value),d=$("#f_date").value;if(!(a>0)||a>1e12||!d)return alert("Enter a positive amount and a date.");
 const o={id:editId||crypto.randomUUID(),type:$("#f_type").value,amount:a,cat:$("#f_cat").value,date:d,time:$("#f_time").value,desc:$("#f_desc").value.trim(),notes:$("#f_notes").value.trim()};
 if(editId)S.tx=S.tx.map(x=>x.id===editId?o:x);else S.tx.push(o);editId=null;saveTx();render()}
function edit(id){editId=id;tab="tx";render();scrollTo(0,0)}function del(id){if(confirm("Delete this transaction?")){S.tx=S.tx.filter(x=>x.id!==id);saveTx();render()}}
function range(){const n=new Date(),y=n.getFullYear(),m=an.v||(an.mode==="day"?today():an.mode==="month"?today().slice(0,7):String(y));
 if(an.mode==="day")return[m,m];if(an.mode==="month")return[m+"-01",m+"-31"];if(an.mode==="year")return[m+"-01-01",m+"-12-31"];return[an.from||"0000",an.to||"9999"]}
function vAn(){const[a,b]=range(),l=S.tx.filter(t=>t.date>=a&&t.date<=b),t=tot(l),yr=an.mode==="year"||(an.mode==="custom"&&(b.slice(0,4)!==a.slice(0,4))),g={};
 l.forEach(x=>{const k=an.mode==="day"?x.time.slice(0,2):yr?x.date.slice(0,7):x.date.slice(5),r=g[k]||(g[k]={l:k,i:0,e:0});x.type==="income"?r.i+=x.amount:r.e+=x.amount});
 const data=Object.values(g).sort((p,q)=>p.l.localeCompare(q.l)),days={};l.forEach(x=>{const r=days[x.date]||(days[x.date]={i:0,e:0});x.type==="income"?r.i+=x.amount:r.e+=x.amount});
 const top=(k)=>Object.entries(days).sort((p,q)=>q[1][k]-p[1][k]).slice(0,3).filter(x=>x[1][k]>0).map(x=>`<div>${x[0]} — ${money(x[1][k])}</div>`).join("")||'<span class="mut">—</span>';
 const inp=an.mode==="day"?`<input type="date" value="${an.v||today()}" onchange="an.v=this.value;render()">`:an.mode==="month"?`<input type="month" value="${an.v||today().slice(0,7)}" onchange="an.v=this.value;render()">`:an.mode==="year"?`<input type="number" min="2000" max="2100" value="${an.v||new Date().getFullYear()}" onchange="an.v=this.value;render()">`:`<input type="date" value="${an.from}" onchange="an.from=this.value;render()"><input type="date" value="${an.to}" onchange="an.to=this.value;render()">`;
 return`<div class="card"><div class="row"><div><label>Period</label><select onchange="an.mode=this.value;an.v='';render()">${["day","month","year","custom"].map(m=>`<option ${an.mode===m?"selected":""} value="${m}">${m[0].toUpperCase()+m.slice(1)}</option>`).join("")}</select></div>${inp}</div>
 <p>Income <b class="inc">${money(t.i)}</b> · Expenses <b class="exp">${money(t.e)}</b> · Net <b>${money(t.i-t.e)}</b></p></div>
 <div class="grid g2" style="margin-top:14px"><div class="card"><h3>Income vs Expenses</h3>${bars(data)}</div><div class="card"><h3>Cumulative balance</h3>${line(data)}</div>
 <div class="card"><h3>Spending by category</h3>${pie(byCat(l,"expense"),COL)}</div><div class="card"><h3>Income by category</h3>${pie(byCat(l,"income"),COL)}</div>
 <div class="card"><h3>Highest spending days</h3>${top("e")}</div><div class="card"><h3>Highest earning days</h3>${top("i")}</div></div>
 <p><button class="btn g" onclick="exportCsv(range())">⬇ Export this period (Excel .csv)</button> <button class="btn g" onclick="print()">🖨 Save as PDF</button></p>`}
function vCal(){const y=calM.getFullYear(),m=calM.getMonth(),first=new Date(y,m,1).getDay(),n=new Date(y,m+1,0).getDate(),off=(first+6)%7,cells=[];
 for(let i=0;i<off;i++)cells.push("<div></div>");
 for(let d=1;d<=n;d++){const k=`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`,l=S.tx.filter(t=>t.date===k),t=tot(l);cells.push(`<div class="c ${l.length?(t.i>=t.e?"p":"n"):""} ${sel===k?"s":""}" onclick="sel='${k}';render()"><b>${d}</b>${l.length?`<div class="inc">+${Math.round(t.i)}</div><div class="exp">−${Math.round(t.e)}</div><div>${Math.round(t.i-t.e)}</div>`:""}</div>`)}
 return`<div class="card"><div class="row" style="align-items:center"><button class="btn g" style="flex:0" onclick="calM=new Date(${y},${m-1},1);render()">‹</button><b style="text-align:center">${calM.toLocaleString(LOC[S.prefs.lang],{month:"long",year:"numeric"})}</b><button class="btn g" style="flex:0" onclick="calM=new Date(${y},${m+1},1);render()">›</button><input type="month" value="${y}-${String(m+1).padStart(2,"0")}" onchange="if(this.value){calM=new Date(this.value+'-01T12:00');render()}"></div>
 <div class="cal" style="margin-top:10px">${["Mo","Tu","We","Th","Fr","Sa","Su"].map(d=>`<div class="mut" style="text-align:center">${d}</div>`).join("")}${cells.join("")}</div></div>
 ${sel?`<div class="card" style="margin-top:14px"><h3>${sel}</h3>${S.tx.filter(t=>t.date===sel).map(row).join("")||'<p class="mut">No transactions.</p>'}</div>`:""}`}
function vGoals(){return`<div class="card"><h3>New savings goal</h3><div class="row"><input id="g_n" placeholder="e.g. New phone" maxlength="60"><input id="g_t" type="number" min="1" placeholder="Target amount"><input id="g_s" type="number" min="0" placeholder="Saved so far"><button class="btn" style="flex:0" onclick="addGoal()">Create</button></div></div>
 <div class="grid g2" style="margin-top:14px">${S.goals.map(g=>{const p=Math.min(100,Math.round(g.saved/g.target*100));return`<div class="card"><h3>${esc(g.name)}</h3><div class="bar"><i style="width:${p}%"></i></div><p class="mut">${money(g.saved)} / ${money(g.target)} · <b>${p}%</b> · remaining ${money(Math.max(0,g.target-g.saved))}</p><div class="row"><input id="ad_${g.id}" type="number" placeholder="Add savings"><button class="btn a" style="flex:0" onclick="addSv('${g.id}')">+</button><button class="btn g" style="flex:0" onclick="delGoal('${g.id}')">🗑</button></div></div>`}).join("")||'<p class="mut">No goals yet.</p>'}</div>`}
function addGoal(){const n=$("#g_n").value.trim(),t=parseFloat($("#g_t").value),s=parseFloat($("#g_s").value)||0;if(!n||!(t>0)||s<0)return alert("Enter a name and a positive target.");S.goals.push({id:crypto.randomUUID(),name:n,target:t,saved:s});saveGoals();render()}
function addSv(id){const v=parseFloat($("#ad_"+id).value);if(!(v>0))return;const g=S.goals.find(x=>x.id===id);g.saved+=v;saveGoals();render()}
function delGoal(id){if(confirm("Delete goal?")){S.goals=S.goals.filter(g=>g.id!==id);saveGoals();render()}}
function vSet(){const p=S.prefs;return`<div class="card"><h3>Profile</h3><label>Display name</label><input id="s_n" maxlength="50" value="${esc(p.name)}"><div class="row"><div><label>Currency</label><select id="s_c">${["UZS","USD","EUR"].map(c=>`<option ${p.cur===c?"selected":""}>${c}</option>`).join("")}</select></div><div><label>Language</label><select id="s_l"><option value="uz" ${p.lang==="uz"?"selected":""}>O‘zbek</option><option value="en" ${p.lang==="en"?"selected":""}>English</option><option value="ru" ${p.lang==="ru"?"selected":""}>Русский</option></select></div><div><label>Theme</label><select onchange="setTheme(this.value)">${[["light","Light Mode"],["dark","Dark Mode"],["system","System Default"]].map(([v,n])=>`<option value="${v}" ${p.theme===v?"selected":""}>${n}</option>`).join("")}</select></div></div>
 <p><button class="btn" onclick="S.prefs.name=$('#s_n').value.trim();S.prefs.cur=$('#s_c').value;setLang($('#s_l').value);savePrefs();render()">Save settings</button></p></div>
 <div class="card" style="margin-top:14px"><h3>Account</h3><label>New password</label><input id="pw1" type="password"><p><button class="btn" onclick="chpw()">Change password</button> <button class="btn g" onclick="logout()">Log out</button></p><button class="btn r" onclick="wipe()">Delete all my financial data</button></div>`}
function wipe(){if(confirm("Permanently delete all transactions and goals?")){S.tx=[];S.goals=[];saveTx();saveGoals();render()}}
function vAdm(){const us=profs.filter(p=>p.role==="user"),pend=us.filter(p=>p.status==="pending"),rest=us.filter(p=>p.status!=="pending");
 const r=(a,b)=>`<div class="tx"><div class="d"><b>${esc(a.username)}</b> <span class="mut">${esc(a.email)}</span><div class="mut">Registered ${new Date(a.created_at).toLocaleString()}</div></div>${b}</div>`,B=(id,st,c,t)=>`<button class="btn ${c}" onclick="setSt('${id}','${st}')">${t}</button>`;
 return`<div class="card"><h3>Pending requests (${pend.length})</h3>${pend.map(a=>r(a,B(a.id,"approved","a","Approve")+B(a.id,"rejected","r","Reject"))).join("")||'<p class="mut">No pending requests.</p>'}</div>
 <div class="card" style="margin-top:14px"><h3>Registered users &amp; history</h3>${rest.map(a=>r(a,`<span class="mut">${a.status}</span>`+(a.status==="approved"?B(a.id,"suspended","g","Suspend"):B(a.id,"approved","a","Approve")))).join("")||'<p class="mut">No users yet.</p>'}</div>`}
function exportCsv(r){const[a,b]=r||[qf.from||"0000",qf.to||"9999"],l=(r?S.tx:S.tx.filter(t=>(!qf.q||(t.desc+t.notes+t.cat).toLowerCase().includes(qf.q.toLowerCase()))&&(!qf.cat||t.cat===qf.cat))).filter(t=>t.date>=a&&t.date<=b),q=v=>'"'+String(v??"").replace(/"/g,'""')+'"';
 const csv="\ufeffDate,Time,Type,Category,Amount,Description,Notes\n"+l.map(t=>[t.date,t.time,t.type,t.cat,t.amount,t.desc,t.notes].map(q).join(",")).join("\n");
 const k=document.createElement("a");k.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));k.download="GOOD-DAY-report.csv";k.click()}
// shell
function notes(){return notif.map(n=>`${n.read?"":"● "}${esc(n.text)} <span class="mut">${new Date(n.created_at).toLocaleDateString()}</span>`)}
function render0(){const A=$("#app");if(!A)return;const L=T[S.prefs.lang]||T.en,keep=document.activeElement;
 const gate=h=>A.innerHTML=`<main class="gate card" style="margin-top:12vh">${topCtl()}${LOGO.replace("<svg","<svg style='width:60px'")}<h2 style="letter-spacing:.2em;color:var(--pri)">GOOD DAY</h2>${h}<p><button class="btn g" onclick="logout()">Log out</button></p></main>`;
 if(status==="auth")return A.innerHTML=authView();
 if(status==="loading")return gate('<p class="mut">Loading…</p>');
 if(status==="nosb")return gate('<p>Set <b>SB_URL</b> and <b>SB_KEY</b> at the top of the script (see instructions).</p>');
 if(status==="new")return gate(`<p class="mut">Manage Your Money. Own Your Day.<br>Request access — the administrator will review it.</p><input id="an" placeholder="Username" maxlength="40"><input id="am" type="email" placeholder="Email" style="margin-top:8px"><p><button class="btn" onclick="apply()">Submit registration request</button></p>`);
 if(status==="pending")return gate("<p>⏳ Your request is pending. You’ll be notified here once the administrator decides.</p>");
 if(status==="rejected")return gate("<p>Your registration request was rejected.</p>");
 if(status==="suspended")return gate("<p>Your account is suspended. Contact the administrator.</p>");
 const tabs=[["dash",L.dash],["tx",L.tx],["an",L.an],["cal",L.cal],["goals",L.goals],["set",L.set]];if(isAdmin)tabs.push(["adm",L.adm]);
 const V={dash:vDash,tx:vTx,an:vAn,cal:vCal,goals:vGoals,set:vSet,adm:vAdm}[tab]||vDash,N=notes(),dark=document.documentElement.dataset.t==="dark";
 A.innerHTML=`<header><span></span><div class="logo">${LOGO}GOOD DAY</div><div class="ctl"><span class="mut" style="display:none">${esc(S.prefs.name)}</span><button class="ib" style="width:auto;padding:0 12px" title="Log out" onclick="logout()">Log out</button>${langSel()}<button class="ib" title="Theme" onclick="setTheme('${dark?"light":"dark"}')">${dark?"🌙":"☀️"}</button><button class="ib" onclick="bell()">🔔${notif.some(n=>!n.read)?`<span class="badge">${notif.filter(n=>!n.read).length}</span>`:""}</button></div></header>
 ${showN?`<div class="card pop"><h3>Notifications</h3>${N.map(n=>`<div class="tx">${n}</div>`).join("")||'<p class="mut">Nothing new.</p>'}</div>`:""}
 <nav>${tabs.map(([k,n])=>`<button class="${tab===k?"on":""}" onclick="tab='${k}';showN=false;render()">${n}</button>`).join("")}</nav><main>${V()}</main>`;
 if(keep&&keep.tagName==="INPUT"&&keep.getAttribute("oninput")){const i=[...document.querySelectorAll("input")].find(x=>x.getAttribute("oninput"));if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length)}}}
boot();
