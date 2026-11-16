# eFootball Arena

eFootball chempionatlari sayti. Unda UEFA Chempionlar ligasi, Jahon chempionati, Liga va Kubok turnirlarini o'tkazish mumkin.
Flarnix tomonidan yaratilgan · telegram: @Flarnix

## Ishga tushirish

Faqat **Python 3.9+** kerak. Qo'shimcha kutubxona o'rnatish shart emas.

- Windows: `start.bat` faylini ikki marta bosing
- Yoki terminalda: `python server.py` buyrug'ini bering, keyin brauzerda http://localhost:8000 manzilini oching

## Asosiy admin

- Admin panelga kirish: saytdagi **Admin** tugmasi (`#/admin/login`)
- Login: `admin`
- Parol: birinchi ishga tushishda tasodifiy yaratiladi va server konsolida (`Asosiy admin yaratildi: ...`) bir marta ko'rsatiladi.

Birinchi marta kirgandan keyin **Admin panel → Sozlamalar** bo'limida parolni darhol almashtiring.
O'z login va parolingiz bilan boshlash uchun birinchi ishga tushirishdan oldin `ADMIN_LOGIN` va `ADMIN_PASSWORD` muhit o'zgaruvchilarini o'rnating.
Yangi adminlar **Admin panel → Adminlar** bo'limida yaratiladi (bu bo'lim faqat asosiy admin uchun).

## Imkoniyatlar

- **O'yinchilar**: ro'yxatdan o'tadi (login, parol, nickname, telegram). Profilida nickname va uning tagida @telegram ko'rinadi.
- **Turnirlarni faqat adminlar yaratadi**. Turnir turlari:
  - **UEFA (yangi format)**: hamma bitta jadvalda o'ynaydi, har bir jamoaning o'yinlar soni sozlanadi (standart 8 ta).
    1–8-o'rindagilar to'g'ridan-to'g'ri 1/8 finalga chiqadi. 9–24-o'rindagilar pley-off o'ynaydi (9 va 24, 10 va 23, ...).
    G'oliblar 1/8 finalga chiqadi, keyin chorak final, yarim final va final o'ynaladi. Hammasi sozlanadi.
  - **Jahon chempionati**: avval guruh bosqichi, keyin pley-off.
  - **Liga**: 1 yoki 2 aylana (masalan, 20 ishtirokchi va 2 aylana bo'lsa 38 tur bo'ladi, xuddi La Liga kabi).
  - **Kubok**: faqat pley-off.
- **Jamoa tanlash**: 50 ta klub yoki 50 ta terma jamoa bor (asosan 2026 JCh qatnashchilari). Tanlangan jamoani boshqa o'yinchi tanlay olmaydi.
  Klublarning haqiqiy logotiplari `static/logos/` papkasida turadi, shuning uchun internet bo'lmasa ham ko'rinadi.
  Terma jamoalar uchun bayroqlar ishlatiladi. Admin istalgan jamoaga logotip yuklashi yoki yangi jamoa qo'shishi mumkin.
- **Natija kiritish**: o'yin sahifasining markazida hisob kiritiladi va skrinshot yuklanadi (skrinshot majburiy).
  Har bir o'yinchi natijani ko'pi bilan 3 marta tahrirlay oladi.
- **Shikoyat**: raqib "Hisob noto'g'ri kiritildi" deb adminga xabar beradi. Admin natijani tuzatadi va shikoyatni yopadi.
- **Dedlayn**: admin har bir tur uchun dedlayn belgilaydi va uni o'yinchilar ham ko'radi (orqaga sanash bilan).
  Dedlayn tugaguncha natija kiritilmasa, o'yinga avtomatik **0:0** qo'yiladi.
- **Turlar ketma-ket ochiladi**: 1-tur dedlayni tugamaguncha 2-tur natijalarini kiritib bo'lmaydi. Dedlaynlar 1-tur sanasidan boshlab
  belgilangan oraliq bilan qo'yiladi (standart 24 soat: 10.11 02:00, 11.11 02:00, ...). Dedlayn o'tgach natijani faqat admin o'zgartiradi.
- **Kartochkalar**: admin noto'g'ri hisob kiritgan o'yinchiga sariq yoki qizil kartochka beradi. 2 ta sariq qizilga aylanadi.
  Qizil olgan o'yinchining keyingi o'yini avtomatik 0:3 texnik mag'lubiyat bo'ladi, shu o'yin dedlaynidan keyin qizil o'chadi.
  Sariq kartochkalar finalgacha yoki turnir oxirigacha turadi.
- **Profil**: profil rasmi, banner (berilmasa, standart stadion rasmi qo'yiladi), login, nickname va Telegram'ni o'zgartirish mumkin
  (adminlar uchun ham). Har bir o'yinchining ommaviy profilida turnirlardagi o'rni, ochkolari, gollari va o'yinlari ko'rinadi.
- **Natijalar** sahifasi: barcha turnirlardagi o'ynalgan o'yinlar.
- Qorong'i va yorug' mavzular; telefon, planshet va katta ekranlarga moslashgan dizayn.

## Rasmlar

- Sayt logotipi: `static/img/emblem.png` (qora mavzu uchun `emblem-dark.png`)
- Stadion va futbol suratlari: `static/img/*.jpg`. Ular Openverse orqali olingan, CC0 / public domain litsenziyasida (rawpixel, StockSnap), ya'ni bepul va manba ko'rsatmasdan ishlatish mumkin.

## Ma'lumotlar

Barcha ma'lumotlar `data/` papkasida saqlanadi: `db.json` faylida va yuklangan rasmlar `uploads/` ichida. Zaxira nusxa olish uchun shu papkani nusxalang.

## Internetga joylash

Python ishlaydigan istalgan VPS yoki hosting mos keladi (masalan, Render, Railway yoki o'z serveringiz).
`PORT` muhit o'zgaruvchisi qo'llab-quvvatlanadi. `data/` papkasi doimiy diskda turishi kerak.
HTTPS uchun oldiga Nginx yoki Caddy qo'yish tavsiya etiladi.
