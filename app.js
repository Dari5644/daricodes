const API_BASE = ""; // نفس الأصل
const $=(s,r=document)=>r.querySelector(s); const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));

const RUNNERS=[
  {lang:"python",name:"Programiz (Python)",url:"https://www.programiz.com/python-programming/online-compiler/"},
  {lang:"python",name:"OnlineGDB (Python)",url:"https://www.onlinegdb.com/online_python_compiler"},
  {lang:"html",name:"CodePen (HTML/CSS/JS)",url:"https://codepen.io/pen/"},
  {lang:"html",name:"JSFiddle (HTML/JS/CSS)",url:"https://jsfiddle.net/"},
  {lang:"javascript",name:"JSBin (javascript)",url:"https://jsbin.com/?js,output"},
  {lang:"sql",name:"SQLite Online (sql)",url:"https://sqliteonline.com/"},
  {lang:"sql",name:"DB Fiddle (sql)",url:"https://www.db-fiddle.com/"}
];

function linkbar(lang="all"){
  const box=$("#runLinks"); box.innerHTML="";
  RUNNERS.filter(r=> lang==="all" || r.lang===lang).forEach(r=>{
    const a=document.createElement("a"); a.className="chip"; a.target="_blank"; a.href=r.url; a.textContent=r.name; box.appendChild(a);
  });
}
linkbar("all");

// auth
async function me(){ const r=await fetch(`/api/auth/me`,{credentials:"include"}); return r.json(); }
function authUI(user){
  const wrap=$("#authActions");
  if(user){
    wrap.innerHTML=`<span class="small" style="color:#9ad">${user.email}</span>
      ${user.is_owner?`<a class="chip" href="/admin.html">لوحة المالك</a>`:""}
      <button id="btnLogout" class="chip">خروج</button>`;
    $("#btnLogout").onclick=async()=>{await fetch(`/api/auth/logout`,{method:"POST",credentials:"include"}); location.reload();};
  }else{
    wrap.innerHTML=`<button class="chip" id="btnLogin">تسجيل دخول</button>
      <button class="chip" id="btnSignup">إنشاء حساب</button>`;
    $("#btnLogin").onclick=()=>openAuth("login");
    $("#btnSignup").onclick=()=>openAuth("signup");
  }
}
function openAuth(mode){
  const m=document.createElement("div"); m.className="card"; m.style.position="fixed"; m.style.inset="0"; m.style.margin="auto"; m.style.maxWidth="360px";
  m.innerHTML=`<div><h3>${mode==='login'?'تسجيل دخول':'إنشاء حساب'}</h3>
  <input id="em" class="input" placeholder="البريد">
  <input id="pw" class="input" type="password" placeholder="كلمة السر" style="margin-top:6px">
  ${mode==='signup'?'<input id="nm" class="input" placeholder="الاسم" style="margin-top:6px">':''}
  <div class="row" style="margin-top:8px">
    <button id="ok" class="primary">${mode==='login'?'دخول':'إنشاء'}</button>
    <button id="cl" class="chip">إغلاق</button>
  </div></div>`;
  document.body.appendChild(m);
  $("#cl").onclick=()=>m.remove();
  $("#ok").onclick=async()=>{
    const email=$("#em").value.trim(), password=$("#pw").value.trim(), name=$("#nm")?$("#nm").value.trim():"";
    const url=mode==='login'?"/api/auth/login":"/api/auth/signup";
    const r=await fetch(url,{method:"POST",credentials:"include",headers:{'content-type':'application/json'},body:JSON.stringify({email,password,name})});
    const d=await r.json(); if(!r.ok){ alert(d.msg||"فشل العملية"); return; } location.reload();
  };
}

// tabs
$("#langTabs").addEventListener("click",e=>{
  if(e.target.matches(".tab")){ $$(".tab").forEach(b=>b.classList.remove("active")); e.target.classList.add("active");
    const lang=e.target.dataset.lang; loadSnips({lang}); linkbar(lang);
  }
});

// load snips
async function loadSnips({lang="all", q=""}={}){
  const r=await fetch(`/api/snips?lang=${lang}&q=${encodeURIComponent(q)}`); const snips=await r.json();
  $("#resultsMeta").textContent=`${snips.length} نتيجة`;
  const grid=$("#cards"); grid.innerHTML="";
  const t=$("#cardTemplate");
  for(const s of snips){
    const n=t.content.cloneNode(true);
    n.querySelector(".title").textContent=s.title;
    n.querySelector(".meta").textContent=`${s.lang} • ${s.owner_email}`;
    n.querySelector(".tags").textContent=s.description||"";
    n.querySelector(".code").textContent=s.code;
    n.querySelector(".copy").onclick=()=>navigator.clipboard.writeText(s.code);
    n.querySelector(".view").onclick=()=>n.querySelector(".code").scrollIntoView({behavior:"smooth"});
    grid.appendChild(n);
  }
}
$("#searchInput").addEventListener("input",e=>{
  const active=$(".tab.active").dataset.lang; loadSnips({lang:active,q:e.target.value});
});

// add snippet
$("#btnAddSnippet").onclick=async()=>{
  const title=prompt("عنوان الكود؟"); if(!title) return;
  const lang=prompt("اللغة؟ (python/html/javascript/css/sql)"); if(!lang) return;
  const description=prompt("وصف؟")||"";
  const code=prompt("الصق الكود هنا")||"";
  const r=await fetch(`/api/snips`,{method:"POST",credentials:"include",headers:{'content-type':'application/json'},body:JSON.stringify({title,lang,description,code})});
  if(!r.ok) return alert("سجّل دخول أولاً");
  const active=$(".tab.active").dataset.lang; loadSnips({lang:active,q:$("#searchInput").value});
};

// chat
$("#chatSend").onclick=async()=>{
  const txt=$("#chatMsg").value.trim(); if(!txt) return;
  await fetch(`/api/messages`,{method:"POST",headers:{'content-type':'application/json'},body:JSON.stringify({content:txt,user_email:($("#authActions .small")||{}).textContent||"زائر"})});
  $("#chatBox").innerHTML+=`<div class="small">أنت: ${txt}</div>`; $("#chatMsg").value="";
};

// init
(async ()=>{ const m0=await me(); authUI(m0.user||null); loadSnips(); })();
