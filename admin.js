const $=(s,r=document)=>r.querySelector(s);

async function mustOwner(){
  const r=await fetch(`/api/auth/me`,{credentials:"include"}); const d=await r.json();
  if(!(d.user && d.user.is_owner)) location.href="/";
}

async function loadSnips(){
  const r=await fetch(`/api/snips`); const s=await r.json();
  const box=$("#adminSnips"); box.innerHTML="";
  s.forEach(x=>{
    const row=document.createElement("div");
    row.className="card"; row.style.marginBottom="8px";
    row.innerHTML=`<div class="row" style="justify-content:space-between">
      <div><b>${x.title}</b> • <span class="small">${x.lang}</span><div class="small">${x.owner_name||x.owner_email}</div></div>
      <button class="chip del">حذف</button></div>
      <pre class="code" style="margin-top:6px">${x.code}</pre>`;
    row.querySelector(".del").onclick=async()=>{
      if(!confirm("حذف الكود؟")) return;
      const rr=await fetch(`/api/snips/${x.id}`,{method:"DELETE",credentials:"include"});
      if(rr.ok) loadSnips(); else alert("فشل الحذف");
    };
    box.appendChild(row);
  });
}

async function loadMsgs(){
  const r=await fetch(`/api/messages`,{credentials:"include"}); const ms=await r.json();
  const box=$("#adminMsgs"); box.innerHTML="";
  ms.forEach(m=>{
    const d=document.createElement("div"); d.className="card"; d.style.marginBottom="8px";
    d.innerHTML=`
      <div class="small">${new Date(m.created_at).toLocaleString()} • ${m.user_name||"زائر"}</div>
      ${m.content?`<div style="margin:6px 0">${m.content}</div>`:""}
      ${m.reply?`<div class="small" style="color:#36c9a6">رد سابق: ${m.reply}</div>`:""}
      <div class="row"><input class="input reply" placeholder="رد..." value=""><button class="chip send">إرسال الرد</button></div>`;
    d.querySelector(".send").onclick=async()=>{
      const reply=d.querySelector(".reply").value.trim();
      if(!reply) return;
      await fetch(`/api/messages/${m.id}/reply`,{method:"POST",credentials:"include",headers:{'content-type':'application/json'},body:JSON.stringify({reply})});
      await loadMsgs();
    };
    box.appendChild(d);
  });
}

async function loadUsers(){
  const r=await fetch(`/api/users`,{credentials:"include"}); const users=await r.json();
  const box=$("#adminUsers"); box.innerHTML="";
  users.forEach(u=>{
    const d=document.createElement("div"); d.className="card"; d.style.marginBottom="8px";
    d.innerHTML=`<div class="row" style="justify-content:space-between">
      <div><b>${u.name||u.email}</b> • <span class="small">${u.email}</span>${u.is_owner?` <span class="chip">المالك</span>`:""}</div>
      ${u.is_owner?``:`<button class="chip del">حذف</button>`}
    </div>`;
    const del=d.querySelector(".del");
    if(del) del.onclick=async()=>{
      if(!confirm("حذف هذا المستخدم وجميع متعلقاته؟")) return;
      const rr=await fetch(`/api/users/${u.id}`,{method:"DELETE",credentials:"include"});
      if(rr.ok) loadUsers(); else alert("فشل الحذف");
    };
    box.appendChild(d);
  });
}

(async()=>{ await mustOwner(); await loadSnips(); await loadMsgs(); await loadUsers(); })();
