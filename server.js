const express = require("express");
const path = require("path");
const session = require("express-session");
const cors = require("cors");
const { v4: uuid } = require("uuid");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");

const PORT = process.env.PORT || 3000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "";
const OWNER_EMAIL = process.env.OWNER_EMAIL || "majddary965@gmail.com";
const OWNER_PASSWORD = process.env.OWNER_PASSWORD || "Mmaa3551";
const SESSION_SECRET = process.env.SESSION_SECRET || "change_this_long_random";
const DATA_DIR = path.resolve(__dirname);

const DB_PATH = path.join(DATA_DIR, "data.db");

const app = express();
if (FRONTEND_ORIGIN) app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(express.json());

const crossCookie = FRONTEND_ORIGIN ? { sameSite: "none", secure: true } : { sameSite: "lax", secure: false };
app.use(session({
  secret: SESSION_SECRET, resave: false, saveUninitialized: false,
  cookie: { ...crossCookie, httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 7 }
}));

app.use((req, res, next) => { if (!req.session.visitor_id) req.session.visitor_id = uuid(); next(); });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

db.prepare(`CREATE TABLE IF NOT EXISTS users(
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  password_hash TEXT,
  is_owner INTEGER DEFAULT 0
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS snips(
  id TEXT PRIMARY KEY,
  title TEXT,
  lang TEXT,
  description TEXT,
  code TEXT,
  owner_email TEXT,
  owner_name TEXT,
  created_at INTEGER
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS messages(
  id TEXT PRIMARY KEY,
  visitor_id TEXT,
  user_email TEXT,
  user_name TEXT,
  content TEXT,
  reply TEXT,
  from_owner INTEGER DEFAULT 0,
  created_at INTEGER
)`).run();

const hasOwner = db.prepare("SELECT 1 FROM users WHERE email=?").get(OWNER_EMAIL);
if (!hasOwner) {
  const ownerHash = bcrypt.hashSync(OWNER_PASSWORD, 10);
  db.prepare("INSERT INTO users(id,email,name,password_hash,is_owner) VALUES(?,?,?,?,1)")
    .run(uuid(), OWNER_EMAIL, "ضاري", ownerHash);
}

const countSnips = db.prepare("SELECT COUNT(*) c FROM snips").get().c;
if (!countSnips) {
  const add = db.prepare("INSERT INTO snips(id,title,lang,description,code,owner_email,owner_name,created_at) VALUES(?,?,?,?,?,?,?,?)");
  const now = Date.now(), owner = OWNER_EMAIL, oname = "ضاري";
  const addS = (t,l,d,c)=>add.run(uuid(),t,l,d,c,owner,oname,now);
  // Python
  addS("حساب العاملي","python","n!","def fact(n):\n r=1\n for i in range(2,n+1): r*=i\n return r\nprint(fact(5))");
  addS("سلسلة فيبوناتشي","python","أول 10","a,b=0,1\nfor _ in range(10):\n print(a)\n a,b=b,a+b");
  addS("Palindrome","python","تناظر","s='رادار'\nprint(s==s[::-1])");
  addS("عداد كلمات","python","Counter","from collections import Counter\nprint(Counter('code code python'.split()))");
  // HTML
  addS("بطل الصفحة","html","Hero","<!doctype html><meta charset='utf-8'><section class='hero'><h1>مرحباً</h1></section><style>.hero{padding:24px;border-radius:14px;background:linear-gradient(45deg,#36c9a6,#8ab4f8);color:#041014}</style>");
  addS("شريط تنقل","html","Navbar","<!doctype html><meta charset='utf-8'><nav class='nav'><a href='#'>الرئيسية</a></nav><style>.nav{display:flex;gap:12px;background:#111;color:#fff;padding:10px}.nav a{color:#fff;text-decoration:none}</style>");
  addS("جدول متجاوب","html","Responsive","<!doctype html><meta charset='utf-8'><table class='t'><tr><th>اسم</th><th>بريد</th></tr><tr><td>ضاري</td><td>d@example.com</td></tr></table><style>.t{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px}@media(max-width:600px){.t, tr, td, th{display:block}}</style>");
  addS("نموذج تواصل","html","Form","<!doctype html><meta charset='utf-8'><form class='f'><input placeholder='اسمك'><input placeholder='بريدك'><textarea></textarea><button>إرسال</button></form><style>.f{display:grid;gap:8px;max-width:360px}input,textarea{padding:10px;border:1px solid #ccc;border-radius:8px}</style>");
  // JavaScript
  addS("جمع مصفوفة","javascript","reduce","const arr=[2,4,6,8];console.log(arr.reduce((a,b)=>a+b,0));");
  addS("نسخ للحافظة","javascript","Clipboard","async function copy(t){await navigator.clipboard.writeText(t);console.log('copied')};copy('مرحبا');");
  addS("جلب JSON","javascript","fetch","fetch('https://jsonplaceholder.typicode.com/todos/1').then(r=>r.json()).then(console.log)");
  addS("إزالة تكرارات","javascript","Set","const unique=[...new Set([1,2,2,3,4,4])];console.log(unique);");
  // CSS
  addS("زر متدرّج","css","Gradient",".btn{padding:10px 16px;border:none;border-radius:12px;background:linear-gradient(45deg,#36c9a6,#8ab4f8);color:#041014;font-weight:700}");
  addS("تمركز بطاقة","css","Center",".wrap{min-height:100vh;display:grid;place-items:center;background:#0f1115}.card{background:#1e2330;color:#edf0f7;padding:24px;border-radius:16px}");
  addS("تأثير زجاجي","css","Glass",".glass{backdrop-filter:blur(10px) saturate(1.2);background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);border-radius:16px;padding:16px}");
  addS("شبكة متجاوبة","css","Grid",".grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px}.item{background:#222;color:#fff;padding:12px;border-radius:10px}");
  // SQL
  addS("إنشاء users","sql","Create","CREATE TABLE users(id INTEGER PRIMARY KEY AUTOINCREMENT,email TEXT);");
  addS("إدخال مستخدم","sql","Insert","INSERT INTO users (email) VALUES ('majddary965@gmail.com');");
  addS("عرض المستخدمين","sql","Select","SELECT id,email FROM users;");
  addS("حذف مستخدم","sql","Delete","DELETE FROM users WHERE email='majddary965@gmail.com';");
}

const mustLogin = (req,res,next)=> req.session.user ? next() : res.status(401).json({ok:false});
const mustOwner = (req,res,next)=> (req.session.user && req.session.user.is_owner) ? next() : res.status(403).json({ok:false});

// Auth
app.post("/api/auth/login",(req,res)=>{
  const { email, password } = req.body || {};
  const u = db.prepare("SELECT * FROM users WHERE email=?").get(email);
  if(!u || !u.password_hash) return res.status(401).json({ok:false,msg:"بيانات الدخول غير صحيحة"});
  const ok = bcrypt.compareSync(password, u.password_hash);
  if(!ok) return res.status(401).json({ok:false,msg:"بيانات الدخول غير صحيحة"});
  req.session.user = { id:u.id, email:u.email, name:u.name, is_owner:!!u.is_owner };
  res.json({ ok:true, user:req.session.user });
});
app.post("/api/auth/signup",(req,res)=>{
  const { email, name, password } = req.body || {};
  try{
    const hash = bcrypt.hashSync(password || "", 10);
    db.prepare("INSERT INTO users(id,email,name,password_hash,is_owner) VALUES(?,?,?,?,0)")
      .run(uuid(), email, name||email, hash);
    res.json({ ok:true });
  }catch(e){
    res.status(400).json({ ok:false, msg:"البريد مستخدم" });
  }
});
app.post("/api/auth/logout",(req,res)=>{ req.session.destroy(()=>res.json({ok:true})) });
app.get("/api/auth/me",(req,res)=> res.json({ user:req.session.user||null, visitor_id:req.session.visitor_id }));

// Users (admin)
app.get("/api/users", mustOwner, (req,res)=>{
  const rows = db.prepare("SELECT id,email,name,is_owner FROM users ORDER BY is_owner DESC, rowid DESC").all();
  res.json(rows);
});
app.delete("/api/users/:id", mustOwner, (req,res)=>{
  const id = req.params.id;
  const u = db.prepare("SELECT * FROM users WHERE id=?").get(id);
  if(!u) return res.status(404).json({ok:false});
  if(u.is_owner) return res.status(400).json({ok:false, msg:"لا يمكن حذف المالك"});
  db.prepare("DELETE FROM users WHERE id=?").run(id);
  db.prepare("DELETE FROM snips WHERE owner_email=?").run(u.email);
  db.prepare("DELETE FROM messages WHERE user_email=?").run(u.email);
  res.json({ok:true});
});

// Snips
app.get("/api/snips",(req,res)=>{
  const { q:kw = "", lang="all" } = req.query;
  const all = db.prepare("SELECT * FROM snips ORDER BY created_at DESC").all();
  const k = (kw||"").toLowerCase().trim();
  const list = all.filter(s =>
    (lang==="all" || s.lang===lang) &&
    (!k || (s.title+s.description+s.code).toLowerCase().includes(k))
  );
  res.json(list);
});
app.post("/api/snips", mustLogin, (req,res)=>{
  const { title, lang, description, code } = req.body || {};
  const me = req.session.user;
  db.prepare("INSERT INTO snips(id,title,lang,description,code,owner_email,owner_name,created_at) VALUES(?,?,?,?,?,?,?,?)")
    .run(uuid(), title, lang, description, code, me.email, (me.name||me.email), Date.now());
  res.json({ ok:true });
});
app.delete("/api/snips/:id", mustOwner, (req,res)=>{
  db.prepare("DELETE FROM snips WHERE id=?").run(req.params.id);
  res.json({ ok:true });
});

// Messages
app.get("/api/messages", mustOwner, (req,res)=>{
  const rows = db.prepare("SELECT * FROM messages ORDER BY created_at ASC").all();
  res.json(rows);
});
app.get("/api/messages/thread",(req,res)=>{
  const me = req.session.user, vid = req.session.visitor_id;
  const rows = db.prepare("SELECT * FROM messages ORDER BY created_at ASC").all();
  const thread = rows.filter(m => me ? (m.user_email===me.email || m.visitor_id===vid) : (m.visitor_id===vid));
  res.json(thread);
});
app.post("/api/messages",(req,res)=>{
  const { content="" } = req.body || {};
  const me = req.session.user;
  db.prepare("INSERT INTO messages(id,visitor_id,user_email,user_name,content,reply,from_owner,created_at) VALUES(?,?,?,?,?,?,?,?)")
    .run(uuid(), req.session.visitor_id, me?me.email:"", me?(me.name||me.email):"زائر", content, "", 0, Date.now());
  res.json({ ok:true });
});
app.post("/api/messages/:id/reply", mustOwner, (req,res)=>{
  const { reply="" } = req.body || {};
  const m = db.prepare("SELECT * FROM messages WHERE id=?").get(req.params.id);
  if(!m) return res.status(404).json({ok:false});
  db.prepare("UPDATE messages SET reply=? WHERE id=?").run(reply, m.id);
  db.prepare("INSERT INTO messages(id,visitor_id,user_email,user_name,content,reply,from_owner,created_at) VALUES(?,?,?,?,?,?,?,?)")
    .run(uuid(), m.visitor_id, "", "المالك", "", reply, 1, Date.now());
  res.json({ ok:true });
});

app.use(express.static(__dirname, { index: "index.html" }));
app.listen(PORT, ()=>console.log("✅ Server on", PORT, "DB:", DB_PATH));
