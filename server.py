#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""eFootball Arena — eFootball chempionatlari sayti.

Faqat Python standart kutubxonasi ishlatiladi (qo'shimcha o'rnatish shart emas).
Ishga tushirish:  python server.py      ->  http://localhost:8000

Created by Flarnix (telegram: @Flarnix)
"""
import base64
import hashlib
import hmac
import json
import os
import random
import re
import secrets
import threading
import time
import traceback
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

from teams import CLUBS, NATIONS

BASE = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.environ.get("DATA_DIR") or os.path.join(BASE, "data")
UPLOAD_DIR = os.path.join(DATA_DIR, "uploads")
STATIC_DIR = os.path.join(BASE, "static")
DB_FILE = os.path.join(DATA_DIR, "db.json")
HOST = os.environ.get("HOST", "0.0.0.0")
PORT = int(os.environ.get("PORT", "8000"))
ADMIN_LOGIN = os.environ.get("ADMIN_LOGIN", "admin")
# Parol berilmasa, birinchi ishga tushishda tasodifiy parol yaratiladi va konsolga chiqariladi
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD") or secrets.token_urlsafe(12)
MAX_EDITS = 3
SESSION_MS = 30 * 24 * 3600 * 1000
MAX_BODY = 14 * 1024 * 1024
MAX_IMAGE = 8 * 1024 * 1024

TYPES = {
    "ucl": "UEFA Chempionlar ligasi",
    "wc": "Jahon chempionati",
    "league": "Liga",
    "cup": "Kubok (pley-off)",
}

LOCK = threading.RLock()
DB = {}
FAILS = {}


class ApiError(Exception):
    def __init__(self, status, msg):
        super().__init__(msg)
        self.status = status
        self.msg = msg


def now_ms():
    return int(time.time() * 1000)


def new_id():
    return secrets.token_hex(6)


# ---------------------------------------------------------------- parollar
def hash_pw(pw, salt=None):
    salt = salt or secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac("sha256", pw.encode("utf-8"), bytes.fromhex(salt), 120000)
    return salt + "$" + dk.hex()


def check_pw(pw, stored):
    try:
        salt, h = stored.split("$", 1)
        return hmac.compare_digest(hash_pw(pw, salt).split("$", 1)[1], h)
    except (ValueError, AttributeError):
        return False


# ---------------------------------------------------------------- baza
VERSION = 0          # har o'zgarishda oshadi (keshlar uchun)
DIRTY = False
SAVE_LOCK = threading.Lock()


def save_db():
    """O'zgarishni belgilaydi. Diskka yozish fonda (flush_db) — katta turnirlarda tez ishlash uchun."""
    global DIRTY, VERSION
    DIRTY = True
    VERSION += 1


def flush_db():
    """Bazani diskka atomik yozish (fon oqimi, server to'xtashida ham chaqiriladi)."""
    global DIRTY
    with SAVE_LOCK:
        with LOCK:
            if not DIRTY and os.path.exists(DB_FILE):
                return
            data = json.dumps(DB, ensure_ascii=False)
            DIRTY = False
        tmp = DB_FILE + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            f.write(data)
        os.replace(tmp, DB_FILE)


def load_db():
    global DB
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    if os.path.exists(DB_FILE):
        with open(DB_FILE, encoding="utf-8") as f:
            DB = json.load(f)
    for k in ("users", "admins", "sessions", "tournaments", "matches", "reports", "teamOverrides"):
        DB.setdefault(k, {})
    DB.setdefault("extraTeams", [])
    if not DB["admins"]:
        aid = new_id()
        DB["admins"][aid] = {
            "id": aid, "username": ADMIN_LOGIN, "pw": hash_pw(ADMIN_PASSWORD),
            "super": True, "created": now_ms(), "defaultPw": True,
        }
        print(f"[i] Asosiy admin yaratildi:  login={ADMIN_LOGIN}  parol={ADMIN_PASSWORD}")
        print("    Kirgandan so'ng parolni Admin panel -> Sozlamalar bo'limida almashtiring!")
    # eski ma'lumotlarni yangi huquqlar tizimiga moslash
    for a in DB["admins"].values():
        if not a.get("super") and "perms" not in a:
            a["perms"] = parse_perms(DEFAULT_PERMS)
    by_name = {a["username"].lower(): a["id"] for a in DB["admins"].values()}
    super_id = next((a["id"] for a in DB["admins"].values() if a.get("super")), None)
    for tr in DB["tournaments"].values():
        if not tr.get("createdById"):
            # topilmasa (masalan admin loginini o'zgartirgan bo'lsa) — asosiy adminga biriktiriladi
            tr["createdById"] = by_name.get(str(tr.get("createdBy", "")).lower()) or super_id
    t = now_ms()
    DB["sessions"] = {k: v for k, v in DB["sessions"].items() if v.get("exp", 0) > t}
    save_db()
    flush_db()


# ---------------------------------------------------------------- jamoalar
def all_teams():
    res = {}
    for kind, lst in (("club", CLUBS), ("nation", NATIONS)):
        for t in lst:
            d = dict(t)
            d["kind"] = kind
            d["extra"] = False
            res[d["id"]] = d
    for t in DB["extraTeams"]:
        d = dict(t)
        d["extra"] = True
        res[d["id"]] = d
    for tid, ov in DB["teamOverrides"].items():
        if tid in res:
            res[tid].update(ov)
            if ov.get("logo"):
                res[tid]["customLogo"] = True
    return res


# ---------------------------------------------------------------- yordamchilar
USER_RE = re.compile(r"^[A-Za-z0-9_.]{3,32}$")
TG_RE = re.compile(r"^@[A-Za-z0-9_]{4,32}$")
DATAURL_RE = re.compile(r"^data:image/(jpeg|jpg|png|webp);base64,(.+)$", re.S)


def v_str(val, lo, hi, label):
    s = str(val or "").strip()
    if not (lo <= len(s) <= hi):
        raise ApiError(400, f"{label} {lo}–{hi} belgidan iborat bo'lishi kerak")
    return s


def v_tg(val):
    s = str(val or "").strip()
    for p in ("https://t.me/", "http://t.me/", "t.me/"):
        if s.startswith(p):
            s = s[len(p):]
    if not s.startswith("@"):
        s = "@" + s
    if not TG_RE.match(s):
        raise ApiError(400, "Telegram username noto'g'ri (masalan: @Flarnix)")
    return s


def v_int(val, lo, hi, label):
    if isinstance(val, bool):
        raise ApiError(400, f"{label} butun son bo'lishi kerak")
    try:
        n = int(val)
    except (TypeError, ValueError):
        raise ApiError(400, f"{label} butun son bo'lishi kerak")
    if not lo <= n <= hi:
        raise ApiError(400, f"{label} {lo} va {hi} oralig'ida bo'lishi kerak")
    return n


def v_pw(val):
    pw = str(val or "")
    if len(pw) < 6 or len(pw) > 100:
        raise ApiError(400, "Parol kamida 6 belgidan iborat bo'lishi kerak")
    return pw


def is_pow2(n):
    return n >= 2 and (n & (n - 1)) == 0


def save_image(data_url, prefix):
    mo = DATAURL_RE.match(str(data_url or ""))
    if not mo:
        raise ApiError(400, "Rasm formati noto'g'ri (JPG, PNG yoki WEBP yuklang)")
    try:
        raw = base64.b64decode(mo.group(2), validate=False)
    except Exception:
        raise ApiError(400, "Rasmni o'qib bo'lmadi")
    if len(raw) > MAX_IMAGE:
        raise ApiError(400, "Rasm hajmi juda katta (maks. 8 MB)")
    if raw[:3] == b"\xff\xd8\xff":
        ext = "jpg"
    elif raw[:8] == b"\x89PNG\r\n\x1a\n":
        ext = "png"
    elif raw[:4] == b"RIFF" and raw[8:12] == b"WEBP":
        ext = "webp"
    else:
        raise ApiError(400, "Fayl rasm emas")
    name = f"{prefix}_{secrets.token_hex(8)}.{ext}"
    with open(os.path.join(UPLOAD_DIR, name), "wb") as f:
        f.write(raw)
    return "/uploads/" + name


def remove_upload(url):
    if url and url.startswith("/uploads/"):
        try:
            os.remove(os.path.join(UPLOAD_DIR, os.path.basename(url)))
        except OSError:
            pass


def user_pub(uid):
    u = DB["users"].get(uid)
    if not u:
        return {"id": uid, "nickname": "O'chirilgan o'yinchi", "telegram": "", "avatar": None}
    return {"id": u["id"], "nickname": u["nickname"], "telegram": u["telegram"], "avatar": u.get("avatar")}


def get_t(tid):
    t = DB["tournaments"].get(tid)
    if not t:
        raise ApiError(404, "Turnir topilmadi")
    return t


def get_m(mid):
    m = DB["matches"].get(mid)
    if not m:
        raise ApiError(404, "O'yin topilmadi")
    return m


def match_index():
    """{turnir_id: [o'yinlar]} — barcha turnirlar uchun bitta o'tishda, keshlanadi."""
    def compute():
        idx = {}
        for m in DB["matches"].values():
            idx.setdefault(m["tid"], []).append(m)
        for tid, ms in idx.items():
            t = DB["tournaments"].get(tid)
            order = {r["key"]: i for i, r in enumerate(t.get("rounds", []))} if t else {}
            ms.sort(key=lambda m: order.get(m["round"], 999))
        return idx
    return cached("mi", "all", compute)


def t_matches(t):
    return match_index().get(t["id"], [])


def round_of(t, key):
    for r in t.get("rounds", []):
        if r["key"] == key:
            return r
    return {}


def part_map(t):
    return cached("pm", t["id"], lambda: {p["userId"]: p for p in t["participants"]})


def check_rate(ip):
    t = time.time()
    lst = [x for x in FAILS.get(ip, []) if t - x < 600]
    FAILS[ip] = lst
    if len(lst) >= 10:
        raise ApiError(429, "Juda ko'p noto'g'ri urinish. 10 daqiqadan so'ng qayta urinib ko'ring")


def add_fail(ip):
    FAILS.setdefault(ip, []).append(time.time())


# ---------------------------------------------------------------- turnir mantiqi
def round_robin(players, legs=1, max_rounds=None):
    """Aylanma jadval. max_rounds — faqat kerakli turlar (katta UEFA liga bosqichi uchun)."""
    p = list(players)
    if len(p) % 2:
        p.append(None)
    n = len(p)
    rounds = []
    for r in range(n - 1):
        if max_rounds and legs == 1 and len(rounds) >= max_rounds:
            break
        pairs = []
        for i in range(n // 2):
            a, b = p[i], p[n - 1 - i]
            if a is None or b is None:
                continue
            if i == 0 and r % 2 == 1:
                a, b = b, a
            elif i > 0 and (r + i) % 2 == 1:
                a, b = b, a
            pairs.append((a, b))
        rounds.append(pairs)
        p = [p[0]] + [p[-1]] + p[1:-1]
    base = list(rounds)
    for leg in range(1, legs):
        for rd in base:
            rounds.append([(b, a) if leg % 2 else (a, b) for a, b in rd])
    return rounds


def bracket_order(size):
    order = [1, 2]
    while len(order) < size:
        m = len(order) * 2
        order = [x for s in order for x in (s, m + 1 - s)]
    return order


def seed_pairs(seeds):
    """seeds: kuchlilik tartibidagi ro'yxat (None = bo'sh joy). Klassik setka juftliklari."""
    size = 2
    while size < len(seeds):
        size *= 2
    seeds = list(seeds) + [None] * (size - len(seeds))
    order = bracket_order(size)
    pairs = []
    for i in range(0, size, 2):
        a, b = seeds[order[i] - 1], seeds[order[i + 1] - 1]
        if a is None:
            a, b = b, a
        pairs.append((a, b))
    return pairs


def make_match(t, rkey, home, away, stage, group=None, tie=None, leg=None):
    mid = new_id()
    m = {
        "id": mid, "tid": t["id"], "round": rkey, "stage": stage, "group": group,
        "tie": tie, "leg": leg, "home": home, "away": away,
        "hs": None, "as": None, "hp": None, "ap": None, "status": "pending",
        "image": None, "submittedBy": None, "submittedAt": None, "edits": {}, "history": [],
    }
    DB["matches"][mid] = m
    save_db()   # keshlarni yangilash (yangi o'yin qo'shildi)
    return m


def ko_name(n_ties, kind):
    if kind == "playoff":
        return "Pley-off bosqichi"
    return {1: "Final", 2: "Yarim final", 4: "Chorak final"}.get(n_ties, f"1/{n_ties} final")


def add_ko_round(t, pairs, kind, deadline, interval_ms):
    idx = len(t["ko"])
    legs = 1 if len(pairs) == 1 else t["settings"].get("koLegs", 1)
    name = ko_name(len(pairs), kind)
    keys = []
    for leg in range(legs):
        key = f"K{idx + 1}L{leg + 1}"
        t["rounds"].append({
            "key": key, "stage": "ko",
            "name": name if legs == 1 else f"{name} — {leg + 1}-o'yin",
            "deadline": deadline + leg * interval_ms if deadline else None,
        })
        keys.append(key)
    ties = []
    for a, b in pairs:
        tie = {"id": new_id(), "a": a, "b": b, "matches": [], "forced": None}
        if b is not None:
            for leg in range(legs):
                h, w = (a, b) if leg % 2 == 0 else (b, a)
                tie["matches"].append(make_match(t, keys[leg], h, w, "ko", tie=tie["id"], leg=leg + 1)["id"])
        ties.append(tie)
    t["ko"].append({"name": name, "kind": kind, "legs": legs, "rounds": keys, "ties": ties})
    if name == "Final":
        # finalga chiqqanda sariq kartochkalar o'chadi
        for c in t.get("cards", {}).values():
            c["y"] = 0
    apply_all_reds(t)
    # chetlatilgan o'yinchilarning yangi o'yinlari ham 0:3
    for p in t["participants"]:
        if p.get("dq"):
            for tie in t["ko"][-1]["ties"]:
                if p["userId"] in (tie["a"], tie["b"]):
                    for mid in tie["matches"]:
                        m = DB["matches"][mid]
                        if m["status"] == "pending":
                            forfeit_match(m, p["userId"], "Chetlatilgan o'yinchi — 0:3")


def find_tie(t, tie_id):
    for k in t.get("ko", []):
        for tie in k["ties"]:
            if tie["id"] == tie_id:
                return tie
    return None


def tie_agg(tie):
    ga = gb = 0
    any_done = False
    for mid in tie["matches"]:
        m = DB["matches"].get(mid)
        if not m or m["status"] == "pending":
            continue
        any_done = True
        if m["home"] == tie["a"]:
            ga += m["hs"]
            gb += m["as"]
        else:
            ga += m["as"]
            gb += m["hs"]
    return [ga, gb] if any_done else None


def tie_both_out(tie):
    """Ikkala o'yinchi ham chiqib ketgan juftlik: hech kim o'ynamagan (barcha o'yinlar dedlayn bo'yicha 0:0)
    yoki oldingi bosqichdan ikkala o'rin ham bo'sh keldi. Admin g'olibni qo'lda belgilasa — bu qoida ishlamaydi."""
    if tie.get("forced"):
        return False
    if tie["a"] is None and tie["b"] is None:
        return True
    if tie["b"] is None:
        return False
    ms = [DB["matches"].get(mid) for mid in tie["matches"]]
    return bool(ms) and all(m is not None and m["status"] == "auto" for m in ms)


def tie_winner(tie):
    if tie.get("forced"):
        return tie["forced"]
    if tie["b"] is None:
        return tie["a"]
    ms = [DB["matches"].get(mid) for mid in tie["matches"]]
    if not ms or any(m is None or m["status"] == "pending" for m in ms):
        return None
    ga, gb = tie_agg(tie)
    if ga != gb:
        return tie["a"] if ga > gb else tie["b"]
    last = ms[-1]
    if last["hp"] is not None and last["ap"] is not None and last["hp"] != last["ap"]:
        return last["home"] if last["hp"] > last["ap"] else last["away"]
    return None


def needs_penalties(t, m, hs, as_):
    if m["stage"] != "ko" or not m.get("tie"):
        return False
    tie = find_tie(t, m["tie"])
    if not tie or tie["matches"][-1] != m["id"]:
        return False
    ga = gb = 0
    for mid in tie["matches"]:
        mm = DB["matches"][mid]
        if mid == m["id"]:
            h, a = hs, as_
        else:
            if mm["status"] == "pending":
                return False
            h, a = mm["hs"], mm["as"]
        if mm["home"] == tie["a"]:
            ga += h
            gb += a
        else:
            ga += a
            gb += h
    return ga == gb


def standings(uids, matches):
    rows = {u: {"userId": u, "p": 0, "w": 0, "d": 0, "l": 0, "gf": 0, "ga": 0, "pts": 0, "form": []} for u in uids}
    for m in matches:
        if m["status"] == "pending":
            continue
        h, a = rows.get(m["home"]), rows.get(m["away"])
        if not h or not a:
            continue
        hs, as_ = m["hs"], m["as"]
        for r, f, ag in ((h, hs, as_), (a, as_, hs)):
            r["p"] += 1
            r["gf"] += f
            r["ga"] += ag
            if f > ag:
                r["w"] += 1
                r["pts"] += 3
                r["form"].append("W")
            elif f == ag:
                r["d"] += 1
                r["pts"] += 1
                r["form"].append("D")
            else:
                r["l"] += 1
                r["form"].append("L")
    out = list(rows.values())
    for r in out:
        r["gd"] = r["gf"] - r["ga"]
        r["form"] = r["form"][-5:]
    out.sort(key=lambda r: (-r["pts"], -r["gd"], -r["gf"], -r["w"], user_pub(r["userId"])["nickname"].lower()))
    return out


def phase_matches(t):
    return [m for m in t_matches(t) if m["stage"] in ("league", "group")]


# ---------------------------------------------------------------- kartochkalar (sariq / qizil)
def card_rec(t, uid):
    return t.setdefault("cards", {}).setdefault(uid, {"y": 0, "red": None, "log": []})


def forfeit_match(m, loser, note):
    """Qizil kartochka: loser texnik mag'lub (0:3)."""
    if m["home"] == loser:
        m["hs"], m["as"] = 0, 3
    else:
        m["hs"], m["as"] = 3, 0
    m["hp"] = m["ap"] = None
    m["status"] = "played"
    m["forfeit"] = loser
    m["submittedBy"] = "system"
    m["submittedAt"] = now_ms()
    m["history"].append({"at": now_ms(), "action": "forfeit", "byName": note, "hs": m["hs"], "as": m["as"]})


def apply_red(t, uid):
    c = card_rec(t, uid)
    if not c["red"] or c["red"].get("match"):
        return
    order = {r["key"]: i for i, r in enumerate(t.get("rounds", []))}
    t0 = now_ms()
    cands = []
    for m in DB["matches"].values():
        if m["tid"] != t["id"] or m["status"] != "pending" or uid not in (m["home"], m["away"]):
            continue
        dl = round_of(t, m["round"]).get("deadline")
        if dl and dl < t0:
            continue
        cands.append((order.get(m["round"], 999), m))
    if not cands:
        return  # keyingi bosqich yaratilganda qo'llanadi
    cands.sort(key=lambda x: x[0])
    m = cands[0][1]
    forfeit_match(m, uid, "Qizil kartochka — texnik mag'lubiyat 0:3")
    c["red"]["match"] = m["id"]


def apply_all_reds(t):
    for uid in list(t.get("cards", {}).keys()):
        apply_red(t, uid)


def give_card(t, uid, kind, who, note="", match_id=None):
    c = card_rec(t, uid)
    entry = {"type": kind, "at": now_ms(), "by": who, "note": note, "match": match_id}
    c["log"].append(entry)
    if kind == "yellow":
        c["y"] += 1
        if c["y"] >= 2:
            c["y"] = 0
            c["log"].append({"type": "red", "at": now_ms(), "by": who, "note": "2 ta sariq = qizil", "match": match_id})
            kind = "red"
    if kind == "red":
        c["red"] = {"at": now_ms(), "match": None}
        apply_red(t, uid)


def cards_view(t, uid):
    c = t.get("cards", {}).get(uid)
    if not c or t["status"] == "finished":
        return {"y": 0, "red": False}
    return {"y": c["y"], "red": bool(c["red"]), "redMatch": (c["red"] or {}).get("match")}


def expire_reds(t, t0):
    changed = False
    for uid, c in t.get("cards", {}).items():
        r = c.get("red")
        if r and r.get("match"):
            m = DB["matches"].get(r["match"])
            dl = round_of(t, m["round"]).get("deadline") if m else None
            if not m or (dl and dl < t0):
                c["red"] = None
                changed = True
    return changed


def prev_round_deadline(t, key):
    rounds = t.get("rounds", [])
    for i, r in enumerate(rounds):
        if r["key"] == key:
            return rounds[i - 1].get("deadline") if i > 0 else None
    return None


def player_stat(t, uid):
    """O'yinchining turnirdagi o'rni, ochkolari va gollari."""
    if t["status"] == "registration":
        return None
    p = part_map(t).get(uid, {})
    out = None
    tables, index = tables_cached(t)
    if uid in index:
        ti, pos = index[uid]
        rows = tables[ti]["rows"]
        out = {**rows[pos], "pos": pos + 1, "of": len(rows), "group": p.get("group")}
    # pley-off: qaysi bosqichgacha yetdi
    stage = None
    for k in t.get("ko", []):
        for tie in k["ties"]:
            if uid in (tie["a"], tie["b"]):
                stage = k["name"]
    if out is None:
        allm = [m for m in t_matches(t) if uid in (m["home"], m["away"]) and m["status"] != "pending"]
        gf = sum(m["hs"] if m["home"] == uid else m["as"] for m in allm)
        ga = sum(m["as"] if m["home"] == uid else m["hs"] for m in allm)
        out = {"p": len(allm), "gf": gf, "ga": ga, "gd": gf - ga, "pos": None}
    out["stage"] = stage
    return out


def parse_settings(typ, s):
    s = s if isinstance(s, dict) else {}
    out = {}
    tk = s.get("teamKind")
    # "none" = jamoasiz (logosiz) turnir: o'yinchi profili (rasm, nik, telegram) ko'rinadi
    out["teamKind"] = tk if tk in ("club", "nation", "none") else ("nation" if typ == "wc" else "club")
    if typ == "league":
        out["legs"] = v_int(s.get("legs", 2), 1, 4, "Aylanalar soni")
    elif typ == "ucl":
        out["leagueGames"] = v_int(s.get("leagueGames", 8), 1, 60, "Liga bosqichidagi o'yinlar soni")
        out["direct"] = v_int(s.get("direct", 8), 1, 512, "To'g'ridan-to'g'ri chiquvchilar soni")
        out["playoff"] = v_int(s.get("playoff", 16), 0, 1024, "Pley-off o'ynovchilar soni")
        if out["playoff"] % 2:
            raise ApiError(400, "Pley-off o'ynovchilar soni juft bo'lishi kerak")
        if not is_pow2(out["direct"] + out["playoff"] // 2):
            raise ApiError(400, "To'g'ridan-to'g'ri chiquvchilar + pley-off g'oliblari soni 2, 4, 8, 16, 32... bo'lishi kerak "
                                "(masalan: 8 + 16/2 = 16 jamoa → 1/8 final)")
        out["koLegs"] = v_int(s.get("koLegs", 2), 1, 2, "Pley-off o'yinlari soni")
    elif typ == "wc":
        out["groups"] = v_int(s.get("groups", 8), 1, 256, "Guruhlar soni")
        out["advance"] = v_int(s.get("advance", 2), 1, 4, "Guruhdan chiquvchilar soni")
        if not is_pow2(out["groups"] * out["advance"]):
            raise ApiError(400, "Guruhlar soni × guruhdan chiquvchilar 2, 4, 8, 16, 32, 64... bo'lishi kerak")
        out["groupLegs"] = v_int(s.get("groupLegs", 1), 1, 2, "Guruh o'yinlari aylanasi")
        out["koLegs"] = v_int(s.get("koLegs", 1), 1, 2, "Pley-off o'yinlari soni")
    elif typ == "cup":
        out["koLegs"] = v_int(s.get("koLegs", 1), 1, 2, "Pley-off o'yinlari soni")
    return out


def start_tournament(t, first_dl, interval_ms):
    ps = [p["userId"] for p in t["participants"]]
    n = len(ps)
    s = t["settings"]
    if n < 2:
        raise ApiError(400, "Kamida 2 ta ishtirokchi kerak")
    random.shuffle(ps)
    t["rounds"], t["ko"] = [], []

    def add_rr(rounds, prefix, label):
        for i, pairs in enumerate(rounds):
            key = f"{prefix}{i + 1}"
            t["rounds"].append({"key": key, "stage": "league", "name": label.format(i + 1), "deadline": None})
            for a, b in pairs:
                make_match(t, key, a, b, "league")

    if t["type"] == "league":
        add_rr(round_robin(ps, s["legs"]), "L", "{}-tur")
    elif t["type"] == "ucl":
        need = s["direct"] + s["playoff"]
        if n < need:
            raise ApiError(400, f"Bu sozlamalar uchun kamida {need} ta ishtirokchi kerak (hozir {n} ta). "
                                f"Sozlamalarni o'zgartiring.")
        rounds = round_robin(ps, 1, max_rounds=s["leagueGames"])
        k = min(s["leagueGames"], len(rounds))
        add_rr(rounds[:k], "L", "Liga bosqichi — {}-tur")
    elif t["type"] == "wc":
        g = s["groups"]
        if n // g < max(2, s["advance"]):
            raise ApiError(400, f"{g} ta guruh uchun ishtirokchilar yetarli emas (har guruhda kamida "
                                f"{max(2, s['advance'])} ta bo'lishi kerak)")
        abc = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        letters = [abc[i] if g <= 26 else str(i + 1) for i in range(g)]   # 26 dan ko'p guruh -> raqamlar
        groups = {letters[i]: [] for i in range(g)}
        pm = part_map(t)
        for i, uid in enumerate(ps):
            L = letters[i % g]
            groups[L].append(uid)
            pm[uid]["group"] = L
        rr = {L: round_robin(mem, s["groupLegs"]) for L, mem in groups.items()}
        total = max(len(x) for x in rr.values())
        for i in range(total):
            key = f"G{i + 1}"
            t["rounds"].append({"key": key, "stage": "group", "name": f"Guruh bosqichi — {i + 1}-tur", "deadline": None})
            for L, rounds in rr.items():
                if i < len(rounds):
                    for a, b in rounds[i]:
                        make_match(t, key, a, b, "group", group=L)
    elif t["type"] == "cup":
        add_ko_round(t, seed_pairs(ps), "bracket", first_dl, interval_ms)

    if t["type"] != "cup":
        for i, r in enumerate(t["rounds"]):
            r["deadline"] = first_dl + i * interval_ms
    t["status"] = "active"
    t["started"] = now_ms()


def next_stage(t, dl, interval_ms):
    if t["status"] != "active":
        raise ApiError(400, "Turnir faol emas")
    if t["type"] == "league":
        raise ApiError(400, "Ligada pley-off yo'q. Barcha o'yinlar tugagach turnirni yakunlang.")
    s = t["settings"]
    if not t["ko"]:
        pending = [m for m in phase_matches(t) if m["status"] == "pending"]
        if pending:
            raise ApiError(400, f"Hali {len(pending)} ta o'yin yakunlanmagan")
        if t["type"] == "ucl":
            order = [r["userId"] for r in standings([p["userId"] for p in t["participants"]], phase_matches(t))]
            t["seedOrder"] = order
            D, P = s["direct"], s["playoff"]
            if P > 0:
                # D+1 ... D+P o'rinlar tasodifiy juftlikka bo'linadi
                pool = order[D:D + P]
                random.shuffle(pool)
                pairs = [(pool[2 * i], pool[2 * i + 1]) for i in range(P // 2)]
                rank = {u: i for i, u in enumerate(order)}
                # yuqoriroq o'rindagi jamoa birinchi o'yinni uyda o'ynamaydi (javob o'yini uyda)
                pairs = [(b, a) if rank[a] < rank[b] else (a, b) for a, b in pairs]
                # keyingi bosqich setkasi uchun juftliklarni eng yuqori o'rin bo'yicha tartiblash
                pairs.sort(key=lambda p: min(rank[p[0]], rank[p[1]]))
                add_ko_round(t, pairs, "playoff", dl, interval_ms)
            else:
                add_ko_round(t, seed_pairs(order[:D]), "bracket", dl, interval_ms)
        elif t["type"] == "wc":
            tl, _ = tables_cached(t)
            groups = [x["group"] for x in tl]
            tables = {x["group"]: x["rows"] for x in tl}
            seeds = []
            for place in range(s["advance"]):
                for L in groups:
                    seeds.append(tables[L][place]["userId"] if place < len(tables[L]) else None)
            add_ko_round(t, seed_pairs(seeds), "bracket", dl, interval_ms)
        return
    last = t["ko"][-1]
    winners = [tie_winner(x) for x in last["ties"]]   # None = ikkalasi ham chiqib ketdi (bo'sh o'rin)
    undecided = [x for x, w in zip(last["ties"], winners) if w is None and not tie_both_out(x)]
    if undecided:
        raise ApiError(400, f"{len(undecided)} ta juftlikda g'olib aniqlanmagan. O'yinlar natijasini kiriting yoki "
                            "g'olibni qo'lda belgilang.")
    if len(winners) == 1:
        t["champion"] = winners[0]          # final ham o'ynalmasa — chempion yo'q
        t["status"] = "finished"
        t["finished"] = now_ms()
        return
    if last["kind"] == "playoff":
        seeds = t["seedOrder"][: s["direct"]] + winners
        add_ko_round(t, seed_pairs(seeds), "bracket", dl, interval_ms)
    else:
        pairs = []
        for i in range(len(winners) // 2):
            a, b = winners[2 * i], winners[2 * i + 1]
            if a is None:          # bo'sh o'rin — raqibi o'yinsiz o'tadi
                a, b = b, a
            pairs.append((a, b))
        add_ko_round(t, pairs, "bracket", dl, interval_ms)


def apply_deadlines():
    """Dedlayni o'tgan turlardagi natijasiz o'yinlarga 0:0. Har bir tur bir marta qayta ishlanadi (autoDone)."""
    t0 = now_ms()
    changed = False
    for t in DB["tournaments"].values():
        if t["status"] != "active":
            continue
        if expire_reds(t, t0):
            changed = True
        due = [r for r in t["rounds"] if r.get("deadline") and r["deadline"] < t0 and not r.get("autoDone")]
        if not due:
            continue
        keys = {r["key"] for r in due}
        for m in t_matches(t):
            if m["status"] == "pending" and m["round"] in keys:
                m["hs"], m["as"], m["hp"], m["ap"] = 0, 0, None, None
                m["status"] = "auto"
                m["history"].append({"at": t0, "action": "auto", "byName": "Tizim (dedlayn)", "hs": 0, "as": 0})
        for r in due:
            r["autoDone"] = True
        changed = True
    if changed:
        save_db()


# ---------------------------------------------------------------- ko'rinishlar (JSON)
def t_summary(t):
    champ = None
    if t.get("champion"):
        p = part_map(t).get(t["champion"], {})
        champ = {**user_pub(t["champion"]), "teamId": p.get("teamId")}
    return {
        "id": t["id"], "name": t["name"], "type": t["type"], "typeName": TYPES[t["type"]],
        "status": t["status"], "settings": t["settings"], "maxPlayers": t["maxPlayers"],
        "description": t.get("description", ""), "regOpen": t.get("regOpen", True),
        "created": t["created"], "count": len(t["participants"]), "champion": champ,
        "createdById": t.get("createdById"), "createdBy": t.get("createdBy"),
    }


def p_info(pm, uid, t=None):
    p = pm.get(uid, {})
    out = {**user_pub(uid), "teamId": p.get("teamId"), "group": p.get("group")}
    if t is not None:
        out["cards"] = cards_view(t, uid)
    return out


def match_view(m, t=None, pm=None):
    t = t or DB["tournaments"][m["tid"]]
    pm = pm if pm is not None else part_map(t)
    r = round_of(t, m["round"])
    keys = ("id", "tid", "round", "stage", "group", "tie", "leg", "home", "away", "hs", "as", "hp", "ap",
            "status", "image", "submittedBy", "submittedAt", "edits", "forfeit")
    out = {k: m.get(k) for k in keys}
    opens = prev_round_deadline(t, m["round"])
    out.update(roundName=r.get("name", ""), deadline=r.get("deadline"),
               opensAt=opens if opens and opens > now_ms() else None,
               homeP=p_info(pm, m["home"], t), awayP=p_info(pm, m["away"], t),
               tname=t["name"], ttype=t["type"])
    return out


def ko_view(t):
    out = []
    for k in t.get("ko", []):
        out.append({
            "name": k["name"], "kind": k["kind"], "legs": k["legs"], "rounds": k["rounds"],
            "ties": [{"id": x["id"], "a": x["a"], "b": x["b"], "matches": x["matches"], "forced": x.get("forced"),
                      "winner": tie_winner(x), "agg": tie_agg(x), "bothOut": tie_both_out(x)} for x in k["ties"]],
        })
    return out


def gkey(L):
    return (len(L), L)   # "2" < "10" to'g'ri tartib


def t_tables(t):
    tables, _ = tables_cached(t)
    return tables


def tables_cached(t):
    """Jadval(lar) + {userId: (jadval_indeksi, o'rni)} — o'zgarish bo'lmaguncha keshlanadi."""
    def compute():
        if t["status"] == "registration":
            return [], {}
        ms = phase_matches(t)
        if t["type"] in ("league", "ucl"):
            tables = [{"name": "Jadval", "group": None, "rows": standings([p["userId"] for p in t["participants"]], ms)}]
        elif t["type"] == "wc":
            mem, gm = {}, {}
            for p in t["participants"]:
                if p.get("group"):
                    mem.setdefault(p["group"], []).append(p["userId"])
            for m in ms:
                gm.setdefault(m["group"], []).append(m)
            tables = [{"name": f"{L} guruh", "group": L, "rows": standings(mem[L], gm.get(L, []))}
                      for L in sorted(mem, key=gkey)]
        else:
            tables = []
        index = {}
        for ti, tb in enumerate(tables):
            for pos, r in enumerate(tb["rows"]):
                index[r["userId"]] = (ti, pos)
        return tables, index
    return cached("tables", t["id"], compute)


CACHE = {}


def cached(kind, key, fn):
    v = CACHE.get((kind, key))
    if v and v[0] == VERSION:
        return v[1]
    val = fn()
    CACHE[(kind, key)] = (VERSION, val)
    return val


def report_view(r, full=False):
    out = {**r, "byP": user_pub(r["by"])}
    if full:
        m = DB["matches"].get(r["matchId"])
        t = DB["tournaments"].get(r["tid"])
        out["match"] = match_view(m, t) if m and t else None
        out["tname"] = t["name"] if t else "—"
    return out


# ---------------------------------------------------------------- marshrutlash
ROUTES = []


def route(method, pattern, auth=None):
    def deco(fn):
        ROUTES.append((method, re.compile("^" + pattern + "$"), fn, auth))
        return fn
    return deco


class Ctx:
    def __init__(self, h, body):
        self.h = h
        self.q = {k: v[0] for k, v in parse_qs(urlparse(h.path).query).items()}
        self.body = body
        self.cookie = None
        self.token = None
        self.user = None
        self.admin = None
        fwd = h.headers.get("X-Forwarded-For")
        self.ip = fwd.split(",")[0].strip() if fwd else h.client_address[0]
        try:
            c = SimpleCookie(h.headers.get("Cookie", ""))
            tok = c["sid"].value if "sid" in c else None
        except Exception:
            tok = None
        s = DB["sessions"].get(tok) if tok else None
        if s and s["exp"] > now_ms():
            self.token = tok
            if s["kind"] == "user":
                self.user = DB["users"].get(s["id"])
            else:
                self.admin = DB["admins"].get(s["id"])

    def login(self, kind, oid):
        if self.token:
            DB["sessions"].pop(self.token, None)
        tok = secrets.token_urlsafe(32)
        DB["sessions"][tok] = {"kind": kind, "id": oid, "exp": now_ms() + SESSION_MS}
        secure = "; Secure" if self.h.headers.get("X-Forwarded-Proto") == "https" else ""
        self.cookie = f"sid={tok}; Path=/; HttpOnly; SameSite=Lax; Max-Age={SESSION_MS // 1000}{secure}"


def dispatch(method, path, body, h):
    for m, rx, fn, auth in ROUTES:
        if m != method:
            continue
        mo = rx.match(path)
        if not mo:
            continue
        ctx = Ctx(h, body)
        if auth == "user" and not ctx.user:
            raise ApiError(401, "Avval o'yinchi sifatida tizimga kiring")
        if auth in ("admin", "super") and not ctx.admin:
            raise ApiError(401, "Admin sifatida tizimga kiring")
        if auth == "super" and not ctx.admin.get("super"):
            raise ApiError(403, "Bu amal faqat asosiy admin uchun")
        return fn(ctx, *mo.groups()), ctx
    raise ApiError(404, "Topilmadi")


ID = r"([A-Za-z0-9_-]+)"


# ---------------------------------------------------------------- auth
@route("POST", "/api/register")
def r_register(ctx):
    b = ctx.body
    username = str(b.get("username") or "").strip()
    if not USER_RE.match(username):
        raise ApiError(400, "Login 3–32 belgi: lotin harflari, raqamlar, _ yoki . bo'lishi mumkin")
    if any(u["username"].lower() == username.lower() for u in DB["users"].values()):
        raise ApiError(409, "Bu login band, boshqasini tanlang")
    pw = v_pw(b.get("password"))
    nick = v_str(b.get("nickname"), 2, 30, "Nickname")
    tg = v_tg(b.get("telegram"))
    uid = new_id()
    DB["users"][uid] = {"id": uid, "username": username, "pw": hash_pw(pw), "nickname": nick,
                        "telegram": tg, "created": now_ms()}
    ctx.login("user", uid)
    save_db()
    return {"ok": True}


@route("POST", "/api/login")
def r_login(ctx):
    check_rate(ctx.ip)
    username = str(ctx.body.get("username") or "").strip().lower()
    u = next((u for u in DB["users"].values() if u["username"].lower() == username), None)
    if not u or not check_pw(str(ctx.body.get("password") or ""), u["pw"]):
        add_fail(ctx.ip)
        raise ApiError(401, "Login yoki parol noto'g'ri")
    ctx.login("user", u["id"])
    save_db()
    return {"ok": True}


@route("POST", "/api/admin/login")
def r_admin_login(ctx):
    check_rate(ctx.ip)
    username = str(ctx.body.get("username") or "").strip().lower()
    a = next((a for a in DB["admins"].values() if a["username"].lower() == username), None)
    if not a or not check_pw(str(ctx.body.get("password") or ""), a["pw"]):
        add_fail(ctx.ip)
        raise ApiError(401, "Login yoki parol noto'g'ri")
    ctx.login("admin", a["id"])
    save_db()
    return {"ok": True}


@route("POST", "/api/logout")
def r_logout(ctx):
    if ctx.token:
        DB["sessions"].pop(ctx.token, None)
        save_db()
    ctx.cookie = "sid=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"
    return {"ok": True}


@route("GET", "/api/me")
def r_me(ctx):
    user = admin = None
    if ctx.user:
        u = ctx.user
        user = {"id": u["id"], "username": u["username"], "nickname": u["nickname"], "telegram": u["telegram"],
                "created": u["created"], "avatar": u.get("avatar"), "banner": u.get("banner")}
    if ctx.admin:
        a = ctx.admin
        admin = {"id": a["id"], "username": a["username"], "super": a.get("super", False),
                 "defaultPw": a.get("defaultPw", False), "nickname": a.get("nickname") or a["username"],
                 "telegram": a.get("telegram", ""), "avatar": a.get("avatar"), "banner": a.get("banner"),
                 "perms": admin_pub(a)["perms"],
                 "openReports": sum(1 for r in DB["reports"].values() if r["status"] == "open" and report_in_scope(ctx, r))
                 if has_perm(ctx, "reports") else 0}
    return {"user": user, "admin": admin, "now": now_ms(), "maxEdits": MAX_EDITS}


def update_media(rec, b, prefix):
    """Avatar va banner rasmlarini yangilash ('' = o'chirish)."""
    for key in ("avatar", "banner"):
        if key in b:
            remove_upload(rec.get(key))
            rec[key] = save_image(b[key], f"{key}_{prefix}") if b[key] else None


def update_username(rec, b, pool, label):
    if "username" in b and str(b["username"]).strip() != rec["username"]:
        username = str(b["username"]).strip()
        if not USER_RE.match(username):
            raise ApiError(400, "Login 3–32 belgi: lotin harflari, raqamlar, _ yoki .")
        if any(x["username"].lower() == username.lower() and x["id"] != rec["id"] for x in pool):
            raise ApiError(409, f"Bu {label} login band, boshqasini tanlang")
        rec["username"] = username


@route("PUT", "/api/me", "user")
def r_me_update(ctx):
    u, b = ctx.user, ctx.body
    update_username(u, b, DB["users"].values(), "")
    if "nickname" in b:
        u["nickname"] = v_str(b.get("nickname"), 2, 30, "Nickname")
    if "telegram" in b:
        u["telegram"] = v_tg(b.get("telegram"))
    if b.get("newPassword"):
        if not check_pw(str(b.get("oldPassword") or ""), u["pw"]):
            raise ApiError(400, "Joriy parol noto'g'ri")
        u["pw"] = hash_pw(v_pw(b.get("newPassword")))
    update_media(u, b, u["id"])
    save_db()
    return {"ok": True}


@route("PUT", "/api/admin/me", "admin")
def r_admin_me_update(ctx):
    a, b = ctx.admin, ctx.body
    update_username(a, b, DB["admins"].values(), "admin")
    if "nickname" in b:
        a["nickname"] = v_str(b.get("nickname"), 2, 30, "Nickname")
    if "telegram" in b:
        a["telegram"] = v_tg(b["telegram"]) if str(b.get("telegram") or "").strip() else ""
    update_media(a, b, "a" + a["id"])
    save_db()
    return {"ok": True}


# ---------------------------------------------------------------- ochiq profillar va natijalar
def match_time(m):
    if m.get("submittedAt"):
        return m["submittedAt"]
    return m["history"][-1]["at"] if m.get("history") else 0


@route("GET", "/api/users/" + ID)
def r_user_profile(ctx, uid):
    u = DB["users"].get(uid)
    if not u:
        raise ApiError(404, "O'yinchi topilmadi")
    tours = []
    for t in sorted(DB["tournaments"].values(), key=lambda t: -t["created"]):
        p = next((p for p in t["participants"] if p["userId"] == uid), None)
        if p:
            tours.append({**t_summary(t), "myTeam": p["teamId"], "stat": player_stat(t, uid),
                          "cards": cards_view(t, uid)})
    ms = []
    for m in DB["matches"].values():
        if uid in (m["home"], m["away"]) and m["status"] != "pending" and m["tid"] in DB["tournaments"]:
            ms.append(m)
    ms.sort(key=match_time, reverse=True)
    w = sum(1 for m in ms if (m["hs"] > m["as"]) == (m["home"] == uid) and m["hs"] != m["as"])
    d = sum(1 for m in ms if m["hs"] == m["as"])
    return {
        "user": {**user_pub(uid), "banner": u.get("banner"), "created": u["created"]},
        "tournaments": tours,
        "totals": {"p": len(ms), "w": w, "d": d, "l": len(ms) - w - d,
                   "titles": sum(1 for t in DB["tournaments"].values() if t.get("champion") == uid)},
        "matches": [match_view(m) for m in ms[:40]],
    }


@route("GET", "/api/results")
def r_results(ctx):
    ms = [m for m in DB["matches"].values() if m["status"] != "pending" and m["tid"] in DB["tournaments"]]
    ms.sort(key=match_time, reverse=True)
    return {"matches": [match_view(m) for m in ms[:300]]}


# ---------------------------------------------------------------- admin: kartochkalar
@route("POST", "/api/admin/tournaments/" + ID + "/cards/" + ID, "admin")
def r_card(ctx, tid, uid):
    t = get_t(tid)
    need_t(ctx, t, "cards")
    if t["status"] != "active":
        raise ApiError(400, "Kartochka faqat davom etayotgan turnirda beriladi")
    if uid not in part_map(t):
        raise ApiError(404, "O'yinchi bu turnirda qatnashmaydi")
    action = ctx.body.get("action")
    who = "Admin " + ctx.admin["username"]
    note = str(ctx.body.get("note") or "").strip()[:300]
    if action in ("yellow", "red"):
        give_card(t, uid, action, who, note, ctx.body.get("match"))
    elif action == "remove_yellow":
        c = card_rec(t, uid)
        c["y"] = max(0, c["y"] - 1)
        c["log"].append({"type": "remove_yellow", "at": now_ms(), "by": who, "note": note})
    elif action == "remove_red":
        c = card_rec(t, uid)
        r = c.get("red")
        if r and r.get("match"):
            m = DB["matches"].get(r["match"])
            if m and m.get("forfeit") == uid:
                m.update(hs=None, hp=None, ap=None, status="pending", submittedBy=None, forfeit=None)
                m["as"] = None
                m["history"].append({"at": now_ms(), "action": "reset", "byName": who + " (qizil bekor)"})
        c["red"] = None
        c["log"].append({"type": "remove_red", "at": now_ms(), "by": who, "note": note})
    else:
        raise ApiError(400, "Noma'lum amal")
    save_db()
    return {"ok": True, "cards": cards_view(t, uid)}


# ---------------------------------------------------------------- ochiq ma'lumotlar
@route("GET", "/api/teams")
def r_teams(ctx):
    return {"teams": list(all_teams().values())}


@route("GET", "/api/tournaments")
def r_tournaments(ctx):
    ts = sorted(DB["tournaments"].values(), key=lambda t: -t["created"])
    return {"tournaments": [t_summary(t) for t in ts]}


@route("GET", "/api/tournaments/" + ID)
def r_tournament(ctx, tid):
    t = get_t(tid)
    pm = part_map(t)
    part = lambda p: {**user_pub(p["userId"]), "userId": p["userId"], "teamId": p["teamId"],
                      "group": p.get("group"), "cards": cards_view(t, p["userId"]), "dq": bool(p.get("dq"))}
    base = {"tournament": {**t_summary(t), "rounds": t.get("rounds", [])}, "roundStats": round_stats(t)}
    if len(t["participants"]) <= BIG:
        # kichik turnir: hammasi bir yo'la
        tables = [{**tb, "rows": [{**r, "pos": i + 1} for i, r in enumerate(tb["rows"])], "total": len(tb["rows"])}
                  for tb in t_tables(t)]
        return {**base, "big": False, "participants": [part(p) for p in t["participants"]],
                "matches": [match_view(m, t, pm) for m in t_matches(t)], "tables": tables, "ko": ko_view(t)}
    return {**base, "big": True, **big_view(ctx, t, pm, part)}


BIG = 64          # shundan ko'p ishtirokchi bo'lsa — sahifalangan ko'rinish
PAGE = 100


def round_stats(t):
    st = {r["key"]: {"pending": 0, "played": 0, "auto": 0, "total": 0} for r in t.get("rounds", [])}
    for m in t_matches(t):
        s = st.setdefault(m["round"], {"pending": 0, "played": 0, "auto": 0, "total": 0})
        s[m["status"]] = s.get(m["status"], 0) + 1
        s["total"] += 1
    return st


def qint(q, k, default=0, lo=0, hi=10 ** 6):
    try:
        return max(lo, min(hi, int(q.get(k, default))))
    except (TypeError, ValueError):
        return default


def big_view(ctx, t, pm, part):
    """Katta turnir: jadval, o'yinlar va ishtirokchilar sahifalab qaytariladi."""
    q = ctx.q
    me = ctx.user["id"] if ctx.user else None
    t0 = now_ms()
    match_ok = lambda m, s: s in user_pub(m["home"])["nickname"].lower() or s in user_pub(m["away"])["nickname"].lower()
    nick_ok = lambda uid, s: s in user_pub(uid)["nickname"].lower() or s in (user_pub(uid)["telegram"] or "").lower()
    out = {}

    # ---- o'yinlar
    ms = t_matches(t)
    rkeys = [r["key"] for r in t.get("rounds", [])]
    used = {m["round"] for m in ms}
    rkeys = [k for k in rkeys if k in used]
    mine = q.get("mine") == "1" and me
    sel = q.get("round")
    if not mine and sel not in rkeys:
        sel = next((r["key"] for r in t.get("rounds", []) if r["key"] in used and (r.get("deadline") or 0) >= t0),
                   rkeys[-1] if rkeys else None)
    lst = [m for m in ms if me in (m["home"], m["away"])] if mine else [m for m in ms if m["round"] == sel]
    s = (q.get("mq") or "").strip().lower()
    if s:
        lst = [m for m in lst if match_ok(m, s)]
    mp = qint(q, "mp")
    out.update(matches=[match_view(m, t, pm) for m in lst[mp * PAGE:(mp + 1) * PAGE]],
               matchTotal=len(lst), matchRound=None if mine else sel, matchMine=bool(mine))

    # ---- jadval(lar)
    tables, index = tables_cached(t)
    pinfo = lambda uid: {**p_info(pm, uid, t), "userId": uid}
    myt = index.get(me)
    if t["type"] == "wc":
        groups = [tb["group"] for tb in tables]
        g = q.get("group") or (tables[myt[0]]["group"] if myt else (groups[0] if groups else None))
        tb = next((x for x in tables if x["group"] == g), None)
        out["groups"] = groups
        out["tables"] = [{**tb, "rows": [{**r, "pos": i + 1, "pi": pinfo(r["userId"])} for i, r in enumerate(tb["rows"])],
                          "total": len(tb["rows"])}] if tb else []
    elif tables:
        rows = tables[0]["rows"]
        s = (q.get("tq") or "").strip().lower()
        sel_rows = [(i, r) for i, r in enumerate(rows) if not s or nick_ok(r["userId"], s)]
        tp = qint(q, "tp")
        out["tables"] = [{"name": tables[0]["name"], "group": None, "total": len(sel_rows),
                          "rows": [{**r, "pos": i + 1, "pi": pinfo(r["userId"])} for i, r in sel_rows[tp * PAGE:(tp + 1) * PAGE]]}]
    else:
        out["tables"] = []
    out["myPos"] = {"group": tables[myt[0]]["group"], "pos": myt[1] + 1} if myt else None

    # ---- ishtirokchilar
    ps = t["participants"]
    s = (q.get("pq") or "").strip().lower()
    if s:
        ps = [p for p in ps if nick_ok(p["userId"], s)]
    pp = qint(q, "pp")
    out["participants"] = [part(p) for p in ps[pp * PAGE:(pp + 1) * PAGE]]
    out["participantTotal"] = len(ps)
    out["mePart"] = part(pm[me]) if me in pm else None

    # ---- pley-off: katta bosqichlarda faqat mening va hal qilinmagan juftliklar
    kos = []
    for k in ko_view(t):
        n = len(k["ties"])
        for x in k["ties"]:
            x["ap"] = pinfo(x["a"]) if x["a"] else None
            x["bp"] = pinfo(x["b"]) if x["b"] else None
        if n > BIG:
            undecided = [x for x in k["ties"] if not x["winner"] and not x["bothOut"] and x["b"] and all(
                DB["matches"][mid]["status"] != "pending" for mid in x["matches"])]
            mine_t = [x for x in k["ties"] if me in (x["a"], x["b"])]
            k = {**k, "ties": mine_t, "undecided": undecided[:200], "undecidedTotal": len(undecided), "collapsed": True}
        k["tieCount"] = n
        kos.append(k)
    out["ko"] = kos
    return out


@route("GET", "/api/matches/" + ID)
def r_match(ctx, mid):
    m = get_m(mid)
    t = DB["tournaments"][m["tid"]]
    is_part = ctx.user and ctx.user["id"] in (m["home"], m["away"])
    reps = [report_view(r) for r in DB["reports"].values() if r["matchId"] == mid] if (is_part or ctx.admin) else []
    tie = None
    if m.get("tie"):
        x = find_tie(t, m["tie"])
        if x:
            tie = {"id": x["id"], "a": x["a"], "b": x["b"], "matches": x["matches"], "agg": tie_agg(x),
                   "winner": tie_winner(x), "forced": x.get("forced")}
    mv = match_view(m, t)
    mv["history"] = m["history"]
    return {"match": mv, "tournament": t_summary(t), "reports": reps, "tie": tie, "maxEdits": MAX_EDITS}


# ---------------------------------------------------------------- o'yinchi amallari
@route("GET", "/api/my/matches", "user")
def r_my_matches(ctx):
    uid = ctx.user["id"]
    res, mine = [], []
    for t in DB["tournaments"].values():
        p = next((p for p in t["participants"] if p["userId"] == uid), None)
        if p:
            mine.append({**t_summary(t), "myTeam": p["teamId"], "stat": player_stat(t, uid),
                         "cards": cards_view(t, uid)})
    for m in DB["matches"].values():
        if uid in (m["home"], m["away"]):
            t = DB["tournaments"].get(m["tid"])
            if not t:
                continue
            mv = match_view(m, t)
            mv["tname"] = t["name"]
            mv["tstatus"] = t["status"]
            res.append(mv)
    res.sort(key=lambda m: (m["status"] != "pending", m["deadline"] or 0))
    mine.sort(key=lambda t: -t["created"])
    return {"matches": res, "tournaments": mine}


@route("POST", "/api/tournaments/" + ID + "/join", "user")
def r_join(ctx, tid):
    t = get_t(tid)
    uid = ctx.user["id"]
    if t["status"] != "registration":
        raise ApiError(400, "Ro'yxatga olish yakunlangan")
    if not t.get("regOpen", True):
        raise ApiError(400, "Ro'yxatga olish vaqtincha yopilgan")
    me = next((p for p in t["participants"] if p["userId"] == uid), None)
    if t["settings"]["teamKind"] == "none":
        # jamoasiz turnir: jamoa tanlanmaydi
        if me:
            return {"ok": True}
        team_id = None
    else:
        team_id = str(ctx.body.get("teamId") or "")
        team = all_teams().get(team_id)
        if not team or team["kind"] != t["settings"]["teamKind"]:
            raise ApiError(400, "Bu turnir uchun jamoa noto'g'ri tanlangan")
        for p in t["participants"]:
            if p["teamId"] == team_id and p["userId"] != uid:
                raise ApiError(409, f"{team['name']} jamoasini boshqa o'yinchi tanlagan")
    if me:
        me["teamId"] = team_id
    else:
        if t["maxPlayers"] and len(t["participants"]) >= t["maxPlayers"]:
            raise ApiError(400, "Turnirda bo'sh joy qolmagan")
        t["participants"].append({"userId": uid, "teamId": team_id, "joined": now_ms()})
    save_db()
    return {"ok": True}


@route("POST", "/api/tournaments/" + ID + "/leave", "user")
def r_leave(ctx, tid):
    t = get_t(tid)
    if t["status"] != "registration":
        raise ApiError(400, "Turnir boshlangan, endi chiqib bo'lmaydi")
    t["participants"] = [p for p in t["participants"] if p["userId"] != ctx.user["id"]]
    save_db()
    return {"ok": True}


@route("POST", "/api/matches/" + ID + "/score", "user")
def r_score(ctx, mid):
    m = get_m(mid)
    t = DB["tournaments"][m["tid"]]
    uid = ctx.user["id"]
    if uid not in (m["home"], m["away"]):
        raise ApiError(403, "Siz bu o'yin ishtirokchisi emassiz")
    if t["status"] != "active":
        raise ApiError(400, "Turnir faol emas")
    dl = round_of(t, m["round"]).get("deadline")
    if m["status"] == "auto" or (dl and now_ms() > dl):
        raise ApiError(400, "Dedlayn tugagan. Endi natijani faqat admin o'zgartira oladi")
    if m.get("forfeit"):
        raise ApiError(400, "Bu o'yin qizil kartochka sababli texnik natija bilan yakunlangan")
    opens = prev_round_deadline(t, m["round"])
    if opens and opens > now_ms():
        raise ApiError(400, "Bu tur hali ochilmagan. Oldingi tur dedlayni tugagach natija kiritish mumkin")
    is_edit = m["status"] == "played"
    used = m["edits"].get(uid, 0)
    if is_edit and used >= MAX_EDITS:
        raise ApiError(400, f"Siz hisobni {MAX_EDITS} martadan ortiq tahrirlay olmaysiz. Muammo bo'lsa adminga xabar bering")
    hs = v_int(ctx.body.get("hs"), 0, 99, "Hisob")
    as_ = v_int(ctx.body.get("as"), 0, 99, "Hisob")
    hp = ap = None
    if needs_penalties(t, m, hs, as_):
        hp = v_int(ctx.body.get("hp"), 0, 99, "Penalti hisobi")
        ap = v_int(ctx.body.get("ap"), 0, 99, "Penalti hisobi")
        if hp == ap:
            raise ApiError(400, "Penaltilar seriyasida g'olib bo'lishi kerak")
    img = ctx.body.get("image")
    if img:
        img = save_image(img, "m" + mid)
    elif not m["image"]:
        raise ApiError(400, "O'yin natijasi rasmini (skrinshot) yuklang")
    if is_edit:
        m["edits"][uid] = used + 1
    m["history"].append({"at": now_ms(), "action": "edit" if is_edit else "submit", "by": uid,
                         "byName": ctx.user["nickname"], "hs": hs, "as": as_, "hp": hp, "ap": ap})
    m.update(hs=hs, hp=hp, ap=ap, status="played", submittedBy=uid, submittedAt=now_ms())
    m["as"] = as_
    if img:
        m["image"] = img
    save_db()
    return {"ok": True}


@route("POST", "/api/matches/" + ID + "/report", "user")
def r_report(ctx, mid):
    m = get_m(mid)
    uid = ctx.user["id"]
    if uid not in (m["home"], m["away"]):
        raise ApiError(403, "Siz bu o'yin ishtirokchisi emassiz")
    if m["status"] == "pending":
        raise ApiError(400, "Hali hisob kiritilmagan")
    if any(r["matchId"] == mid and r["by"] == uid and r["status"] == "open" for r in DB["reports"].values()):
        raise ApiError(400, "Sizning shikoyatingiz allaqachon ko'rib chiqilmoqda")
    reason = v_str(ctx.body.get("reason"), 3, 600, "Izoh")
    rid = new_id()
    DB["reports"][rid] = {"id": rid, "matchId": mid, "tid": m["tid"], "by": uid, "reason": reason,
                          "score": [m["hs"], m["as"]], "status": "open", "created": now_ms(),
                          "note": "", "resolvedBy": None, "resolvedAt": None}
    save_db()
    return {"ok": True}


# ---------------------------------------------------------------- admin huquqlari
# Asosiy admin hamma narsani qila oladi. Boshqa adminlarga quyidagi huquqlar alohida beriladi.
# Saytdan o'yinchini o'chirish va boshqa adminlarning turnirini o'chirish — FAQAT asosiy admin.
PERMS = [
    ("create_tournament", "Turnir yaratish va o'z turnirlarini boshqarish"),
    ("delete_own", "O'zi yaratgan turnirni o'chirish"),
    ("manage_all", "Boshqa adminlar turnirlarini boshqarish (o'chirishdan tashqari)"),
    ("participants", "O'z turniridan o'yinchini chetlatish"),
    ("results", "O'yin natijasini o'zgartirish va qayta ochish"),
    ("deadlines", "Dedlaynlarni o'zgartirish"),
    ("cards", "Sariq va qizil kartochka berish"),
    ("reports", "Shikoyatlarni ko'rish va hal qilish"),
    ("users_view", "O'yinchilar ro'yxatini ko'rish"),
    ("users_password", "O'yinchi parolini tiklash"),
    ("teams", "Jamoalar va logotiplarni boshqarish"),
]
PERM_LABEL = dict(PERMS)
DEFAULT_PERMS = {"create_tournament": True, "delete_own": True, "participants": True, "results": True,
                 "deadlines": True, "cards": True, "reports": True, "users_view": True}


def is_super(ctx):
    return bool(ctx.admin and ctx.admin.get("super"))


def has_perm(ctx, perm):
    return is_super(ctx) or bool((ctx.admin or {}).get("perms", {}).get(perm))


def need(ctx, perm):
    if not has_perm(ctx, perm):
        raise ApiError(403, f"Sizda bu amal uchun ruxsat yo'q: «{PERM_LABEL[perm]}». Asosiy adminga murojaat qiling")


def owns(ctx, t):
    return t.get("createdById") == ctx.admin["id"]


def need_t(ctx, t, perm):
    """Turnirga oid amal: huquq + (o'zi yaratgan turnir yoki 'manage_all')."""
    need(ctx, perm)
    if not is_super(ctx) and not owns(ctx, t) and not has_perm(ctx, "manage_all"):
        raise ApiError(403, "Bu turnirni boshqa admin yaratgan — siz faqat o'zingiz yaratgan turnirlarni boshqara olasiz")


def report_in_scope(ctx, r):
    t = DB["tournaments"].get(r["tid"])
    return bool(t) and (is_super(ctx) or owns(ctx, t) or has_perm(ctx, "manage_all"))


def parse_perms(raw):
    raw = raw if isinstance(raw, dict) else {}
    return {k: bool(raw.get(k)) for k, _ in PERMS}


def admin_pub(a):
    return {"id": a["id"], "username": a["username"], "super": a.get("super", False), "created": a["created"],
            "nickname": a.get("nickname") or a["username"], "avatar": a.get("avatar"),
            "perms": {k: True for k, _ in PERMS} if a.get("super") else parse_perms(a.get("perms"))}


# ---------------------------------------------------------------- admin: adminlar
@route("GET", "/api/admin/admins", "super")
def r_admins(ctx):
    return {"admins": [admin_pub(a) for a in DB["admins"].values()], "permList": PERMS, "defaults": DEFAULT_PERMS}


@route("POST", "/api/admin/admins", "super")
def r_admin_create(ctx):
    username = str(ctx.body.get("username") or "").strip()
    if not USER_RE.match(username):
        raise ApiError(400, "Login 3–32 belgi: lotin harflari, raqamlar, _ yoki .")
    if any(a["username"].lower() == username.lower() for a in DB["admins"].values()):
        raise ApiError(409, "Bu login band")
    aid = new_id()
    perms = parse_perms(ctx.body.get("perms")) if "perms" in ctx.body else dict(parse_perms(DEFAULT_PERMS))
    DB["admins"][aid] = {"id": aid, "username": username, "pw": hash_pw(v_pw(ctx.body.get("password"))),
                         "super": False, "created": now_ms(), "createdBy": ctx.admin["id"], "perms": perms}
    save_db()
    return {"ok": True}


@route("PUT", "/api/admin/admins/" + ID + "/perms", "super")
def r_admin_perms(ctx, aid):
    a = DB["admins"].get(aid)
    if not a:
        raise ApiError(404, "Admin topilmadi")
    if a.get("super"):
        raise ApiError(400, "Asosiy adminning huquqlari cheklanmaydi")
    a["perms"] = parse_perms(ctx.body.get("perms"))
    save_db()
    return {"ok": True, "perms": a["perms"]}


@route("DELETE", "/api/admin/admins/" + ID, "super")
def r_admin_delete(ctx, aid):
    a = DB["admins"].get(aid)
    if not a:
        raise ApiError(404, "Admin topilmadi")
    if a.get("super"):
        raise ApiError(400, "Asosiy adminni o'chirib bo'lmaydi")
    del DB["admins"][aid]
    DB["sessions"] = {k: v for k, v in DB["sessions"].items() if not (v["kind"] == "admin" and v["id"] == aid)}
    save_db()
    return {"ok": True}


@route("POST", "/api/admin/admins/" + ID + "/password", "super")
def r_admin_reset(ctx, aid):
    a = DB["admins"].get(aid)
    if not a:
        raise ApiError(404, "Admin topilmadi")
    a["pw"] = hash_pw(v_pw(ctx.body.get("password")))
    save_db()
    return {"ok": True}


@route("PUT", "/api/admin/me/password", "admin")
def r_admin_pw(ctx):
    a = ctx.admin
    if not check_pw(str(ctx.body.get("oldPassword") or ""), a["pw"]):
        raise ApiError(400, "Joriy parol noto'g'ri")
    a["pw"] = hash_pw(v_pw(ctx.body.get("newPassword")))
    a["defaultPw"] = False
    save_db()
    return {"ok": True}


# ---------------------------------------------------------------- admin: o'yinchilar
@route("GET", "/api/admin/users", "admin")
def r_users(ctx):
    need(ctx, "users_view")
    cnt = {}
    for t in DB["tournaments"].values():
        for p in t["participants"]:
            cnt[p["userId"]] = cnt.get(p["userId"], 0) + 1
    us = sorted(DB["users"].values(), key=lambda u: -u["created"])
    s = (ctx.q.get("q") or "").strip().lower()
    if s:
        us = [u for u in us if s in u["nickname"].lower() or s in u["username"].lower() or s in u["telegram"].lower()]
    page = qint(ctx.q, "p")
    return {"total": len(us), "page": page,
            "users": [{"id": u["id"], "username": u["username"], "nickname": u["nickname"], "avatar": u.get("avatar"),
                       "telegram": u["telegram"], "created": u["created"], "tournaments": cnt.get(u["id"], 0)}
                      for u in us[page * PAGE:(page + 1) * PAGE]]}


@route("POST", "/api/admin/users/" + ID + "/password", "admin")
def r_user_reset(ctx, uid):
    need(ctx, "users_password")
    u = DB["users"].get(uid)
    if not u:
        raise ApiError(404, "O'yinchi topilmadi")
    u["pw"] = hash_pw(v_pw(ctx.body.get("password")))
    save_db()
    return {"ok": True}


@route("DELETE", "/api/admin/users/" + ID, "super")   # saytdan o'chirish — faqat asosiy admin
def r_user_delete(ctx, uid):
    if uid not in DB["users"]:
        raise ApiError(404, "O'yinchi topilmadi")
    for t in DB["tournaments"].values():
        if t["status"] == "registration":
            t["participants"] = [p for p in t["participants"] if p["userId"] != uid]
    del DB["users"][uid]
    DB["sessions"] = {k: v for k, v in DB["sessions"].items() if not (v["kind"] == "user" and v["id"] == uid)}
    save_db()
    return {"ok": True}


# ---------------------------------------------------------------- admin: jamoalar
@route("POST", "/api/admin/teams", "admin")
def r_team_add(ctx):
    need(ctx, "teams")
    b = ctx.body
    kind = b.get("kind") if b.get("kind") in ("club", "nation") else "club"
    name = v_str(b.get("name"), 2, 40, "Jamoa nomi")
    short = v_str(b.get("short"), 2, 4, "Qisqa nom").upper()
    col = re.compile(r"^#[0-9a-fA-F]{6}$")
    c1 = b.get("c1") if col.match(str(b.get("c1") or "")) else "#1f6feb"
    c2 = b.get("c2") if col.match(str(b.get("c2") or "")) else "#ffffff"
    if any(t["name"].lower() == name.lower() for t in all_teams().values()):
        raise ApiError(409, "Bunday nomli jamoa mavjud")
    tid = "x-" + new_id()
    team = {"id": tid, "name": name, "short": short, "colors": [c1, c2], "kind": kind}
    if b.get("logo"):
        team["logo"] = save_image(b["logo"], "team")
    DB["extraTeams"].append(team)
    save_db()
    return {"ok": True}


@route("PUT", "/api/admin/teams/" + ID, "admin")
def r_team_edit(ctx, tid):
    need(ctx, "teams")
    teams = all_teams()
    if tid not in teams:
        raise ApiError(404, "Jamoa topilmadi")
    ov = DB["teamOverrides"].setdefault(tid, {})
    b = ctx.body
    if b.get("name"):
        ov["name"] = v_str(b["name"], 2, 40, "Jamoa nomi")
    if "logo" in b:
        remove_upload(ov.get("logo"))
        if b["logo"]:
            ov["logo"] = save_image(b["logo"], "team")
        else:
            ov.pop("logo", None)
    save_db()
    return {"ok": True}


@route("DELETE", "/api/admin/teams/" + ID, "admin")
def r_team_delete(ctx, tid):
    need(ctx, "teams")
    team = next((t for t in DB["extraTeams"] if t["id"] == tid), None)
    if not team:
        raise ApiError(400, "Faqat qo'shilgan jamoalarni o'chirish mumkin")
    for t in DB["tournaments"].values():
        if any(p["teamId"] == tid for p in t["participants"]):
            raise ApiError(400, "Bu jamoa turnirda ishlatilmoqda")
    DB["extraTeams"] = [t for t in DB["extraTeams"] if t["id"] != tid]
    remove_upload(team.get("logo"))
    remove_upload(DB["teamOverrides"].pop(tid, {}).get("logo"))
    save_db()
    return {"ok": True}


# ---------------------------------------------------------------- admin: turnirlar
@route("POST", "/api/admin/tournaments", "admin")
def r_t_create(ctx):
    need(ctx, "create_tournament")
    b = ctx.body
    typ = b.get("type")
    if typ not in TYPES:
        raise ApiError(400, "Turnir turi noto'g'ri")
    tid = new_id()
    DB["tournaments"][tid] = {
        "id": tid, "name": v_str(b.get("name"), 3, 60, "Turnir nomi"), "type": typ,
        "description": str(b.get("description") or "").strip()[:500],
        "settings": parse_settings(typ, b.get("settings")),
        "maxPlayers": v_int(b.get("maxPlayers") or 0, 0, 100000, "Maksimal ishtirokchilar"),
        "status": "registration", "regOpen": True, "participants": [], "rounds": [], "ko": [],
        "champion": None, "created": now_ms(), "createdBy": ctx.admin["username"], "createdById": ctx.admin["id"],
    }
    save_db()
    return {"ok": True, "id": tid}


@route("PUT", "/api/admin/tournaments/" + ID, "admin")
def r_t_update(ctx, tid):
    t = get_t(tid)
    need_t(ctx, t, "create_tournament")
    b = ctx.body
    if "name" in b:
        t["name"] = v_str(b.get("name"), 3, 60, "Turnir nomi")
    if "description" in b:
        t["description"] = str(b.get("description") or "").strip()[:500]
    if "regOpen" in b:
        t["regOpen"] = bool(b["regOpen"])
    if t["status"] == "registration":
        if "maxPlayers" in b:
            t["maxPlayers"] = v_int(b.get("maxPlayers") or 0, 0, 100000, "Maksimal ishtirokchilar")
        if "settings" in b:
            new = parse_settings(t["type"], b["settings"])
            if new["teamKind"] != t["settings"]["teamKind"] and t["participants"]:
                raise ApiError(400, "Ishtirokchilar bor paytda jamoalar turini o'zgartirib bo'lmaydi")
            t["settings"] = new
    save_db()
    return {"ok": True}


@route("DELETE", "/api/admin/tournaments/" + ID, "admin")
def r_t_delete(ctx, tid):
    t = get_t(tid)
    # boshqa adminlar faqat o'zi yaratgan turnirni o'chira oladi (va faqat 'delete_own' huquqi bilan)
    if not is_super(ctx):
        if not owns(ctx, t):
            raise ApiError(403, "Siz faqat o'zingiz yaratgan turnirni o'chira olasiz")
        need(ctx, "delete_own")
    for mid in [m["id"] for m in DB["matches"].values() if m["tid"] == tid]:
        remove_upload(DB["matches"][mid].get("image"))
        del DB["matches"][mid]
    DB["reports"] = {k: r for k, r in DB["reports"].items() if r["tid"] != tid}
    del DB["tournaments"][tid]
    save_db()
    return {"ok": True}


@route("POST", "/api/admin/tournaments/" + ID + "/remove/" + ID, "admin")
def r_t_remove_player(ctx, tid, uid):
    """Turnirdan chetlatish. Ro'yxat bosqichida — ro'yxatdan chiqariladi;
    turnir davomida — diskvalifikatsiya: qolgan barcha o'yinlari 0:3 texnik mag'lubiyat."""
    t = get_t(tid)
    if not is_super(ctx) and not owns(ctx, t):
        raise ApiError(403, "Siz faqat o'zingiz yaratgan turnirdan o'yinchini chetlata olasiz")
    need(ctx, "participants")
    p = part_map(t).get(uid)
    if not p:
        raise ApiError(404, "O'yinchi bu turnirda qatnashmaydi")
    if t["status"] == "registration":
        t["participants"] = [x for x in t["participants"] if x["userId"] != uid]
    elif t["status"] == "active":
        p["dq"] = True
        p["dqBy"] = ctx.admin["username"]
        p["dqAt"] = now_ms()
        for m in t_matches(t):
            if m["status"] == "pending" and uid in (m["home"], m["away"]):
                forfeit_match(m, uid, "Chetlatildi (admin " + ctx.admin["username"] + ") — 0:3")
    else:
        raise ApiError(400, "Yakunlangan turnirdan chetlatib bo'lmaydi")
    save_db()
    return {"ok": True}


def parse_dl(b, key="deadline"):
    v = b.get(key)
    if v in (None, ""):
        raise ApiError(400, "Dedlayn sanasini kiriting")
    return v_int(v, 0, 10 ** 14, "Dedlayn")


@route("POST", "/api/admin/tournaments/" + ID + "/start", "admin")
def r_t_start(ctx, tid):
    t = get_t(tid)
    need_t(ctx, t, "create_tournament")
    if t["status"] != "registration":
        raise ApiError(400, "Turnir allaqachon boshlangan")
    dl = parse_dl(ctx.body)
    if dl < now_ms():
        raise ApiError(400, "Birinchi dedlayn kelajakdagi vaqt bo'lishi kerak")
    hours = v_int(ctx.body.get("intervalHours", 24), 1, 24 * 60, "Turlar orasidagi vaqt (soat)")
    start_tournament(t, dl, hours * 3600 * 1000)
    save_db()
    return {"ok": True}


@route("POST", "/api/admin/tournaments/" + ID + "/next", "admin")
def r_t_next(ctx, tid):
    t = get_t(tid)
    need_t(ctx, t, "create_tournament")
    last = t["ko"][-1] if t.get("ko") else None
    final_ready = last and len(last["ties"]) == 1
    dl = None if final_ready else parse_dl(ctx.body)
    hours = v_int(ctx.body.get("intervalHours", 24), 1, 24 * 60, "Oraliq (soat)")
    next_stage(t, dl, hours * 3600 * 1000)
    save_db()
    return {"ok": True}


@route("POST", "/api/admin/tournaments/" + ID + "/finish", "admin")
def r_t_finish(ctx, tid):
    t = get_t(tid)
    need_t(ctx, t, "create_tournament")
    if t["status"] != "active":
        raise ApiError(400, "Turnir faol emas")
    if t["type"] == "league":
        rows = standings([p["userId"] for p in t["participants"]], phase_matches(t))
        t["champion"] = rows[0]["userId"] if rows else None
    elif t.get("ko") and len(t["ko"][-1]["ties"]) == 1:
        t["champion"] = tie_winner(t["ko"][-1]["ties"][0])
    t["status"] = "finished"
    t["finished"] = now_ms()
    save_db()
    return {"ok": True}


@route("PUT", "/api/admin/tournaments/" + ID + "/rounds/" + ID, "admin")
def r_round_dl(ctx, tid, key):
    t = get_t(tid)
    need_t(ctx, t, "deadlines")
    r = round_of(t, key)
    if not r:
        raise ApiError(404, "Tur topilmadi")
    r["deadline"] = parse_dl(ctx.body)
    r["autoDone"] = False   # yangi dedlayn bo'yicha qayta tekshiriladi
    reopened = 0
    if ctx.body.get("reopenAuto") and r["deadline"] > now_ms():
        for m in DB["matches"].values():
            if m["tid"] == tid and m["round"] == key and m["status"] == "auto":
                m.update(hs=None, hp=None, ap=None, status="pending")
                m["as"] = None
                m["history"].append({"at": now_ms(), "action": "reset", "byName": "Admin " + ctx.admin["username"]})
                reopened += 1
    save_db()
    return {"ok": True, "reopened": reopened}


@route("POST", "/api/admin/tournaments/" + ID + "/ties/" + ID, "admin")
def r_tie_winner(ctx, tid, tie_id):
    t = get_t(tid)
    need_t(ctx, t, "results")
    tie = find_tie(t, tie_id)
    if not tie:
        raise ApiError(404, "Juftlik topilmadi")
    w = ctx.body.get("winner")
    if w not in (None, "", tie["a"], tie["b"]):
        raise ApiError(400, "G'olib noto'g'ri")
    tie["forced"] = w or None
    save_db()
    return {"ok": True}


@route("PUT", "/api/admin/matches/" + ID, "admin")
def r_admin_match(ctx, mid):
    m = get_m(mid)
    need_t(ctx, DB["tournaments"][m["tid"]], "results")
    b = ctx.body
    who = "Admin " + ctx.admin["username"]
    m["forfeit"] = None
    if b.get("reset"):
        m.update(hs=None, hp=None, ap=None, status="pending", submittedBy=None)
        m["as"] = None
        m["history"].append({"at": now_ms(), "action": "reset", "byName": who})
    else:
        hs = v_int(b.get("hs"), 0, 99, "Hisob")
        as_ = v_int(b.get("as"), 0, 99, "Hisob")
        hp = ap = None
        if b.get("hp") not in (None, "") and b.get("ap") not in (None, ""):
            hp = v_int(b.get("hp"), 0, 99, "Penalti")
            ap = v_int(b.get("ap"), 0, 99, "Penalti")
        m.update(hs=hs, hp=hp, ap=ap, status="played", submittedBy="admin", submittedAt=now_ms())
        m["as"] = as_
        if b.get("image"):
            m["image"] = save_image(b["image"], "m" + mid)
        m["history"].append({"at": now_ms(), "action": "admin", "byName": who, "hs": hs, "as": as_, "hp": hp, "ap": ap})
    if b.get("resetEdits"):
        m["edits"] = {}
    save_db()
    return {"ok": True}


# ---------------------------------------------------------------- admin: shikoyatlar
@route("GET", "/api/admin/reports", "admin")
def r_reports(ctx):
    need(ctx, "reports")
    rs = [r for r in DB["reports"].values() if report_in_scope(ctx, r)]
    rs.sort(key=lambda r: (r["status"] != "open", -r["created"]))
    return {"reports": [report_view(r, True) for r in rs[:500]]}


@route("POST", "/api/admin/reports/" + ID + "/resolve", "admin")
def r_report_resolve(ctx, rid):
    r = DB["reports"].get(rid)
    if not r:
        raise ApiError(404, "Shikoyat topilmadi")
    need(ctx, "reports")
    if not report_in_scope(ctx, r):
        raise ApiError(403, "Bu shikoyat boshqa admin turniriga tegishli")
    r["status"] = "resolved"
    r["note"] = str(ctx.body.get("note") or "").strip()[:500]
    r["resolvedBy"] = ctx.admin["username"]
    r["resolvedAt"] = now_ms()
    save_db()
    return {"ok": True}


# ---------------------------------------------------------------- HTTP
MIME = {".html": "text/html; charset=utf-8", ".js": "application/javascript; charset=utf-8",
        ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png",
        ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon",
        ".json": "application/json", ".txt": "text/plain; charset=utf-8"}


class Handler(BaseHTTPRequestHandler):
    server_version = "eFootballArena/1.0"
    protocol_version = "HTTP/1.1"

    def log_message(self, fmt, *args):
        pass

    def do_GET(self):
        self.handle_req("GET")

    def do_POST(self):
        self.handle_req("POST")

    def do_PUT(self):
        self.handle_req("PUT")

    def do_DELETE(self):
        self.handle_req("DELETE")

    def send_body(self, status, data, ctype, extra=None):
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("X-Content-Type-Options", "nosniff")
        for k, v in (extra or {}).items():
            self.send_header(k, v)
        if status >= 400:
            # so'rov tanasi o'qilmagan bo'lishi mumkin — ulanishni yopamiz (keep-alive buzilmasin)
            self.send_header("Connection", "close")
            self.close_connection = True
        self.end_headers()
        self.wfile.write(data)

    def send_json(self, status, obj, cookie=None):
        extra = {"Cache-Control": "no-store"}
        if cookie:
            extra["Set-Cookie"] = cookie
        self.send_body(status, json.dumps(obj, ensure_ascii=False).encode("utf-8"),
                       "application/json; charset=utf-8", extra)

    def read_body(self, method):
        if method == "GET":
            return {}
        n = int(self.headers.get("Content-Length") or 0)
        if n > MAX_BODY:
            raise ApiError(413, "So'rov hajmi juda katta")
        raw = self.rfile.read(n) if n else b""
        if not raw:
            return {}
        if "application/json" not in (self.headers.get("Content-Type") or ""):
            raise ApiError(415, "Faqat JSON qabul qilinadi")
        try:
            data = json.loads(raw.decode("utf-8"))
        except Exception:
            raise ApiError(400, "JSON noto'g'ri")
        return data if isinstance(data, dict) else {}

    def handle_req(self, method):
        path = urlparse(self.path).path
        if path.startswith("/api/"):
            try:
                body = self.read_body(method)
                with LOCK:
                    apply_deadlines()
                    result, ctx = dispatch(method, path, body, self)
                    # JSON qulf ichida tuziladi (boshqa so'rovlar ma'lumotni o'zgartirayotganda xato bo'lmasin)
                    payload = json.dumps(result, ensure_ascii=False).encode("utf-8")
                extra = {"Cache-Control": "no-store"}
                if ctx.cookie:
                    extra["Set-Cookie"] = ctx.cookie
                self.send_body(200, payload, "application/json; charset=utf-8", extra)
            except ApiError as e:
                self.send_json(e.status, {"error": e.msg})
            except Exception:
                traceback.print_exc()
                self.send_json(500, {"error": "Server xatosi"})
            return
        if method != "GET":
            return self.send_body(405, b"Method not allowed", "text/plain")
        if path.startswith("/uploads/"):
            name = path[len("/uploads/"):]
            if not re.match(r"^[\w.-]+$", name):
                return self.send_body(404, b"Not found", "text/plain")
            return self.serve_file(os.path.join(UPLOAD_DIR, name), cache=True)
        rel = path.lstrip("/") or "index.html"
        full = os.path.realpath(os.path.join(STATIC_DIR, rel))
        if not full.startswith(os.path.realpath(STATIC_DIR)) or not os.path.isfile(full):
            full = os.path.join(STATIC_DIR, "index.html")
        self.serve_file(full)

    def serve_file(self, fpath, cache=False):
        if not os.path.isfile(fpath):
            return self.send_body(404, b"Not found", "text/plain")
        ext = os.path.splitext(fpath)[1].lower()
        with open(fpath, "rb") as f:
            data = f.read()
        self.send_body(200, data, MIME.get(ext, "application/octet-stream"),
                       {"Cache-Control": "public, max-age=604800" if cache else "no-cache"})


def deadline_worker():
    while True:
        time.sleep(30)
        try:
            with LOCK:
                apply_deadlines()
        except Exception:
            traceback.print_exc()


def flush_worker():
    # baza katta bo'lsa (masalan 10 000 o'yinchi) yozish oralig'i avtomatik uzayadi — so'rovlar kutib qolmasin
    wait = 2.0
    while True:
        time.sleep(wait)
        try:
            t0 = time.time()
            flush_db()
            wait = min(15.0, max(2.0, (time.time() - t0) * 6))
        except Exception:
            traceback.print_exc()


def main():
    import signal
    load_db()
    threading.Thread(target=deadline_worker, daemon=True).start()
    threading.Thread(target=flush_worker, daemon=True).start()

    def on_stop(sig, frame):
        # server to'xtatilganda (systemctl stop/restart) oxirgi o'zgarishlarni saqlash
        flush_db()
        os._exit(0)
    signal.signal(signal.SIGTERM, on_stop)
    srv = None
    if HOST in ("::", "0.0.0.0"):
        # IPv4 + IPv6 (localhost tez ishlashi uchun)
        try:
            import socket

            class DualStack(ThreadingHTTPServer):
                address_family = socket.AF_INET6

                def server_bind(self):
                    self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
                    super().server_bind()

            srv = DualStack(("::", PORT), Handler)
        except Exception:
            srv = None
    if srv is None:
        srv = ThreadingHTTPServer((HOST, PORT), Handler)
    srv.daemon_threads = True
    print(f"[OK] eFootball Arena ishga tushdi:  http://localhost:{PORT}")
    print("    To'xtatish uchun: Ctrl+C")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        flush_db()
        print("\nTo'xtatildi.")


if __name__ == "__main__":
    main()
