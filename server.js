// server.js
const express = require("express");
const path = require("path");
const fs = require("fs");
const session = require("express-session");
const cors = require("cors");
const { v4: uuid } = require("uuid");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");

/* ================== إعدادات أساسية ================== */
const PORT = process.env.PORT || 3000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || ""; // ضع دومين الواجهة لو منفصل (Netlify/Vercel)
const SESSION_SECRET = process.env.SESSION_SECRET || "change_this_long_random";

/* ================== قاعدة البيانات (ملف جاهز) ================== */
// نتوقع وجود ملف data.db في نفس مجلد المشروع
const DB_PATH = path.join(__dirname, "data.db");
if (!fs.existsSync(DB_PATH)) {
  console.error("❌ لم يتم العثور على قاعدة البيانات data.db بجانب server.js — رجاءً ارفع الملف أولاً.");
  process.exit(1);
}
console.log("📦 DB path:", DB_PATH);

// افتح القاعدة
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

/* ================== تطبيق Express ================== */
const app = express();
if (FRONTEND_ORIGIN) app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
else app.use(cors());
app.use(express.json({ limit: "1mb" }));

// جلسات
const crossCookie = FRONTEND_ORIGIN ? { sameSite: "none", secure: true } : { sameSite: "lax", secure: false };
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { ...crossCookie, httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 7 }
}));

// اربط كل زائر بمعرّف ثابت (لخيط المحادثة)
app.use((req, res, next) => {
  if (!req.session.visitor_id) req.session.visitor_id = uuid();
  next();
});

/* ================== Helpers ================== */
const mustLogin = (req,res,next)=> req.session.user ? next() : res.status(401).json({ok:false});
const mustOwner = (req,res,next)=> (req.session.user && req.session.user.is_owner) ? next() : res.status(403).json({ok:false});

/* ================== حماية admin.html ================== */
// السماح بعرض الصفحة فقط للمالك
app.get("/admin.html", (req, res, next) => {
  if (!req.session.user || !req.session.user.is_owner) {
    return res
      .status(403)
      .send("<h2 style='text-align:center;margin-top:100px;'>🚫 غير مصرح لك بدخول لوحة المالك</h2>");
  }
  next();
});

/* ================== AUTH ================== */
// تسجيل دخول
app.post("/api/auth/login",(req,res)=>{
  const { email, password } = req.body || {};
  const u = db.prepare("SELECT * FROM users WHERE email=?").get(email);
  if(!u || !u.password_hash) return res.status(401).json({ok:false,msg:"بيانات الدخول غير صحيحة"});
  const ok = bcrypt.compareSync(password, u.password_hash);
  if(!ok) return res.status(401).json({ok:false,msg:"بيانات الدخول غير صحيحة"});
  req.session.user = { id:u.id, email:u.email, name:u.name, is_owner:!!u.is_owner };
  res.json({ ok:true, user:req.session.user });
});

// إنشاء حساب
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

// خروج + الحالة
app.post("/api/auth/logout",(req,res)=>{ req.session.destroy(()=>res.json({ok:true})) });
app.get("/api/auth/me",(req,res)=> res.json({ user:req.session.user||null, visitor_id:req.session.visitor_id }));

/* ================== USERS (Admin) ================== */
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

/* ================== SNIPS ================== */
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
  if (!title || !lang || !code) return res.status(400).json({ ok:false, msg:"بيانات ناقصة" });
  db.prepare(
    "INSERT INTO snips(id,title,lang,description,code,owner_email,owner_name,created_at) VALUES(?,?,?,?,?,?,?,?)"
  ).run(uuid(), title, lang, description||"", code, me.email, me.name||me.email, Date.now());
  res.json({ ok:true });
});
app.delete("/api/snips/:id", mustOwner, (req,res)=>{
  db.prepare("DELETE FROM snips WHERE id=?").run(req.params.id);
  res.json({ ok:true });
});

/* ================== MESSAGES (خدمة العملاء) ================== */
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
  if (!content.trim()) return res.status(400).json({ ok: false, msg: "الرسالة فارغة" });
  const me = req.session.user;
  db.prepare(
    "INSERT INTO messages(id,visitor_id,user_email,user_name,content,reply,from_owner,created_at) VALUES(?,?,?,?,?,?,?,?)"
  ).run(uuid(), req.session.visitor_id, me?me.email:"", me?me.name||me.email:"زائر", content, "", 0, Date.now());
  res.json({ ok: true });
});
app.post("/api/messages/:id/reply", mustOwner, (req,res)=>{
  const { reply="" } = req.body || {};
  const m = db.prepare("SELECT * FROM messages WHERE id=?").get(req.params.id);
  if(!m) return res.status(404).json({ok:false});
  db.prepare("UPDATE messages SET reply=? WHERE id=?").run(reply, m.id);
  db.prepare(
    "INSERT INTO messages(id,visitor_id,user_email,user_name,content,reply,from_owner,created_at) VALUES(?,?,?,?,?,?,?,?)"
  ).run(uuid(), m.visitor_id, "", "المالك", "", reply, 1, Date.now());
  res.json({ ok: true });
});

/* ================== STATIC ================== */
app.use(express.static(__dirname, { index: "index.html" }));
app.get("/", (_, res) => res.sendFile(path.join(__dirname, "index.html")));

/* ================== START ================== */
app.listen(PORT, () => console.log("✅ Server on", PORT, "DB:", DB_PATH));
