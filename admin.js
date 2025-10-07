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
      <div style="margin:6px 0">${m.content}</div>
      ${m.reply?`<div class="small" style="color:#36c9a6">ردك: ${m.reply}</div>`:""}
      <div class="row"><input class="input reply" placeholder="رد..." value="${m.reply||""}"><button class="chip send">إرسال الرد</button></div>`;
    d.querySelector(".send").onclick=async()=>{
      const reply=d.querySelector(".reply").value.trim();
      await fetch(`/api/messages/${m.id}/reply`,{method:"POST",credentials:"include",headers:{'content-type':'application/json'},body:JSON.stringify({reply})});
      await loadMsgs();
    };
    box.appendChild(d);
  });
}

(async()=>{ await mustOwner(); await loadSnips(); await loadMsgs(); })();
