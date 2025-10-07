const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const session = require("express-session");
const { v4: uuid } = require("uuid");

const PORT = process.env.PORT || 3000;
const OWNER_EMAIL = process.env.OWNER_EMAIL || "majddary965@gmail.com";
const OWNER_PASSWORD = process.env.OWNER_PASSWORD || "Mmaa3551";
const SESSION_SECRET = process.env.SESSION_SECRET || "change_this_long_random";

const app = express();
app.use(cors());
app.use(express.json());
app.use(session({
  secret: SESSION_SECRET, resave:false, saveUninitialized:false,
  cookie:{ sameSite:"lax", httpOnly:true, maxAge:1000*60*60*24*7 }
}));

// تخزين بسيط في ملف JSON (بدون أي إضافات)
const DB_PATH = path.join(__dirname, "data.json");
function readDB() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({
      users: [], snips: [], messages: []
    }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
}
function writeDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// seed
(function seed(){
  const db = readDB();
  if (!db.users.find(u => u.email === OWNER_EMAIL)) {
    db.users.push({ id: uuid(), email: OWNER_EMAIL, name: "ضاري", password: OWNER_PASSWORD, is_owner: true });
  }
  if ((db.snips||[]).length === 0) {
    const now = Date.now();
    const owner = OWNER_EMAIL;
    const add = (title, lang, description, code) => db.snips.push({ id: uuid(), title, lang, description, code, owner_email: owner, created_at: now });
    // Python (4)
    add("حساب العاملي","python","n!","def fact(n):\n r=1\n for i in range(2,n+1): r*=i\n return r\nprint(fact(5))");
    add("سلسلة فيبوناتشي","python","أول 10","a,b=0,1\nfor _ in range(10):\n print(a)\n a,b=b,a+b");
    add("تحقق من Palindrome","python","تناظر","s='رادار'\nprint(s==s[::-1])");
    add("عداد كلمات","python","Counter","from collections import Counter\nprint(Counter('code code python'.split()))");
    // HTML (4)
    add("بطل الصفحة","html","Hero","<!doctype html><meta charset='utf-8'><section class='hero'><h1>مرحباً</h1></section><style>.hero{padding:24px;border-radius:14px;background:linear-gradient(45deg,#36c9a6,#8ab4f8);color:#041014}</style>");
    add("شريط تنقل","html","Navbar","<!doctype html><meta charset='utf-8'><nav class='nav'><a href='#'>الرئيسية</a></nav><style>.nav{display:flex;gap:12px;background:#111;color:#fff;padding:10px}.nav a{color:#fff;text-decoration:none}</style>");
    add("جدول متجاوب","html","Responsive","<!doctype html><meta charset='utf-8'><table class='t'><tr><th>اسم</th><th>بريد</th></tr><tr><td>ضاري</td><td>d@example.com</td></tr></table><style>.t{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px}@media(max-width:600px){.t, tr, td, th{display:block}}</style>");
    add("نموذج تواصل","html","Form","<!doctype html><meta charset='utf-8'><form class='f'><input placeholder='اسمك'><input placeholder='بريدك'><textarea></textarea><button>إرسال</button></form><style>.f{display:grid;gap:8px;max-width:360px}input,textarea{padding:10px;border:1px solid #ccc;border-radius:8px}</style>");
    // JavaScript (4)
    add("جمع مصفوفة","javascript","reduce","const arr=[2,4,6,8];console.log(arr.reduce((a,b)=>a+b,0));");
    add("نسخ إلى الحافظة","javascript","Clipboard","async function copy(t){await navigator.clipboard.writeText(t);console.log('copied')};copy('مرحبا');");
    add("جلب JSON","javascript","fetch","fetch('https://jsonplaceholder.typicode.com/todos/1').then(r=>r.json()).then(console.log)");
    add("إزالة تكرارات","javascript","Set","const unique=[...new Set([1,2,2,3,4,4])];console.log(unique);");
    // CSS (4)
    add("زر متدرّج","css","Gradient",".btn{padding:10px 16px;border:none;border-radius:12px;background:linear-gradient(45deg,#36c9a6,#8ab4f8);color:#041014;font-weight:700}");
    add("تمركز بطاقة","css","Center",".wrap{min-height:100vh;display:grid;place-items:center;background:#0f1115}.card{background:#1e2330;color:#edf0f7;padding:24px;border-radius:16px}");
    add("تأثير زجاجي","css","Glass",".glass{backdrop-filter:blur(10px) saturate(1.2);background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);border-radius:16px;padding:16px}");
    add("شبكة متجاوبة","css","Grid",".grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px}.item{background:#222;color:#fff;padding:12px;border-radius:10px}");
    // SQL (4)
    add("إنشاء جدول users","sql","Create","CREATE TABLE users(id INTEGER PRIMARY KEY AUTOINCREMENT,email TEXT);");
    add("إدخال مستخدم","sql","Insert","INSERT INTO users (email) VALUES ('majddary965@gmail.com');");
    add("عرض المستخدمين","sql","Select","SELECT id,email FROM users;");
    add("حذف مستخدم","sql","Delete","DELETE FROM users WHERE email='majddary965@gmail.com';");
    writeDB(db);
  } else writeDB(db);
})();

// auth
app.post("/api/auth/login",(req,res)=>{
  const { email, password } = req.body||{};
  const db = readDB();
  const u = db.users.find(x=>x.email===email && x.password===password);
  if(!u) return res.status(401).json({ok:false,msg:"بيانات الدخول غير صحيحة"});
  req.session.user = { id:u.id, email:u.email, name:u.name, is_owner:!!u.is_owner };
  res.json({ok:true, user:req.session.user});
});
app.post("/api/auth/signup",(req,res)=>{
  const { email, name, password } = req.body||{};
  const db = readDB();
  if(db.users.find(u=>u.email===email)) return res.status(400).json({ok:false,msg:"البريد مستخدم"});
  db.users.push({ id: uuid(), email, name:name||email, password:password||"", is_owner:false });
  writeDB(db); res.json({ok:true});
});
app.post("/api/auth/logout",(req,res)=>{ req.session.destroy(()=>res.json({ok:true})) });
app.get("/api/auth/me",(req,res)=> res.json({user:req.session.user||null}));

function mustLogin(req,res,next){ if(!req.session.user) return res.status(401).json({ok:false}); next(); }
function mustOwner(req,res,next){ if(!(req.session.user&&req.session.user.is_owner)) return res.status(403).json({ok:false}); next(); }

// snips
app.get("/api/snips",(req,res)=>{
  const { q="", lang="all" } = req.query;
  const db = readDB();
  const k = q.trim().toLowerCase();
  const list = db.snips.filter(s=>
    (lang==="all"||s.lang===lang) &&
    (!k || (s.title+s.description+s.code).toLowerCase().includes(k))
  ).sort((a,b)=>b.created_at-a.created_at);
  res.json(list);
});
app.post("/api/snips", mustLogin,(req,res)=>{
  const { title,lang,description,code } = req.body||{};
  const db = readDB(); const id=uuid();
  db.snips.push({ id,title,lang,description,code,owner_email:req.session.user.email,created_at:Date.now() });
  writeDB(db); res.json({ok:true,id});
});
app.delete("/api/snips/:id", mustOwner,(req,res)=>{
  const db = readDB(); const before = db.snips.length;
  db.snips = db.snips.filter(s=>s.id!==req.params.id);
  writeDB(db); res.json({ok:true, deleted: before - db.snips.length});
});

// messages
app.get("/api/messages", mustOwner,(req,res)=>{
  const db = readDB(); res.json(db.messages.sort((a,b)=>b.created_at-a.created_at));
});
app.post("/api/messages",(req,res)=>{
  const { user_email="", content="" } = req.body||{};
  const db = readDB();
  db.messages.push({ id:uuid(), user_email, content, reply:"", created_at:Date.now() });
  writeDB(db); res.json({ok:true});
});
app.post("/api/messages/:id/reply", mustOwner,(req,res)=>{
  const { reply="" } = req.body||{}; const db=readDB();
  const m=db.messages.find(x=>x.id===req.params.id); if(m) m.reply=reply;
  writeDB(db); res.json({ok:true});
});

// static
app.use(express.static(__dirname, { index:"index.html" }));

app.listen(PORT, ()=>console.log("✅ Server on", PORT));
