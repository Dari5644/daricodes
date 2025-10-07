const $=(s,r=document)=>r.querySelector(s); const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));

// Auth
async function me(){ const r=await fetch(`/api/auth/me`,{credentials:"include"}); return r.json(); }
function authUI(user){
  const wrap=$("#authActions"); if(!wrap) return;
  if(user){
    wrap.innerHTML=`<span class="small" style="color:#9ad">${user.name||user.email}</span>
      <a class="chip" href="/admin.html">لوحة المالك</a>
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
  const m=document.createElement("div"); m.className="card"; m.style.position="fixed"; m.style.inset="0"; m.style.margin="auto"; m.style.maxWidth="360px"; m.style.zIndex="1000";
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

// Tabs + Search
$("#langTabs")?.addEventListener("click",e=>{
  if(e.target.matches(".tab")){ $$(".tab").forEach(b=>b.classList.remove("active")); e.target.classList.add("active");
    const lang=e.target.dataset.lang; loadSnips({lang});
  }
});
$("#searchInput")?.addEventListener("input",e=>{
  const active=$(".tab.active")?.dataset.lang || "all";
  loadSnips({lang:active,q:e.target.value});
});

// Snips
async function loadSnips({lang="all", q=""}={}){
  const r=await fetch(`/api/snips?lang=${lang}&q=${encodeURIComponent(q)}`);
  const snips=await r.json();
  $("#resultsMeta").textContent=`${snips.length} نتيجة`;
  const grid=$("#cards"); grid.innerHTML="";
  const t=$("#cardTemplate");
  for(const s of snips){
    const n=t.content.cloneNode(true);
    n.querySelector(".title").textContent=s.title;
    n.querySelector(".meta").textContent=`${s.lang} • ${s.owner_name||s.owner_email}`;
    n.querySelector(".tags").textContent=s.description||"";
    n.querySelector(".code").textContent=s.code;
    n.querySelector(".copy").onclick=()=>navigator.clipboard.writeText(s.code);
    n.querySelector(".view").onclick=()=>n.querySelector(".code").scrollIntoView({behavior:"smooth"});
    grid.appendChild(n);
  }
}
$("#btnAddSnippet")?.addEventListener("click", async()=>{
  const title=prompt("عنوان الكود؟"); if(!title) return;
  const lang=prompt("اللغة؟ (python/html/javascript/css/sql)"); if(!lang) return;
  const description=prompt("وصف؟")||"";
  const code=prompt("الصق الكود هنا")||"";
  const r=await fetch(`/api/snips`,{method:"POST",credentials:"include",headers:{'content-type':'application/json'},body:JSON.stringify({title,lang,description,code})});
  if(!r.ok) return alert("سجّل دخول أولاً");
  const active=$(".tab.active")?.dataset.lang||"all"; loadSnips({lang:active,q:$("#searchInput").value});
});

// Chat (خدمة العملاء)
const chatBox=$("#chatBox"), chatMsg=$("#chatMsg"), chatSend=$("#chatSend");
async function loadThread(){
  if(!chatBox) return;
  const r = await fetch(`/api/messages/thread`, { credentials:"include" });
  const data = await r.json();
  chatBox.innerHTML = data.map(m=>{
    if (m.from_owner && m.reply) return `<div class="small" style="color:#36c9a6">رد المالك: ${m.reply}</div>`;
    const head = `<div class="small" style="opacity:.8">${m.user_name||"زائر"} — ${new Date(m.created_at).toLocaleTimeString()}</div>`;
    const body = `<div style="margin:4px 0 8px 0">${m.content||""}</div>`;
    const rep  = m.reply ? `<div class="small" style="color:#36c9a6">رد المالك: ${m.reply}</div>` : "";
    return head + body + rep;
  }).join("");
  chatBox.scrollTop = chatBox.scrollHeight;
}
chatSend?.addEventListener("click", async()=>{
  const txt=chatMsg.value.trim(); if(!txt) return;
  await fetch(`/api/messages`,{method:"POST",credentials:"include",headers:{'content-type':'application/json'},body:JSON.stringify({content:txt})});
  chatMsg.value=""; await loadThread();
});
setInterval(loadThread, 3000);

// init
(async ()=>{ const m0=await me(); authUI(m0.user||null); loadSnips(); loadThread(); })();
