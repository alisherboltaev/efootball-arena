# efootballarena.uz — saytni internetga joylash

Kerak bo'ladi:
1. **Domen**: `efootballarena.uz`
2. **VPS server**: internetda 24/7 ishlaydigan kichik kompyuter (Ubuntu)
3. Taxminan 30–60 daqiqa vaqt

> Nega VPS? Sayt ma'lumotlarni `data/` papkasida saqlaydi. Bepul "hosting"larning ko'pchiligi (Render free, Vercel, Netlify)
> diskni har safar o'chirib yuboradi va ma'lumotlar yo'qoladi. VPS'da esa hammasi saqlanib qoladi.

---

## 1-qadam. Domen sotib olish (.uz)

1. https://cctld.uz saytida `efootballarena.uz` bo'shligini tekshiring.
2. Shu saytdagi akkreditatsiyalangan registratorlardan biridan sotib oling (ro'yxat cctld.uz da bor).
   `.uz` domenlarini faqat ular sotadi.
3. Hozircha DNS sozlamalariga tegmang, 4-qadamda kerak bo'ladi.

## 2-qadam. VPS server olish

Eng kichik tarif yetadi: **1 CPU, 1 GB RAM, 10–20 GB disk, Ubuntu 22.04 yoki 24.04**.

- O'zbekistondagi hosting kompaniyalarida (O'zbekistondan tez ochiladi, so'mda to'lanadi)
- yoki xorijda: Hetzner, DigitalOcean, Contabo va boshqalar (oyiga taxminan 4–6 $)

Sotib olgandan keyin sizga **IP manzil** (masalan `185.10.20.30`) va **root parol** beriladi.

## 3-qadam. Fayllarni serverga yuklash

Kompyuteringizda PowerShell oching va `Efootball chempionat` papkasining ichiga kiring. Keyin quyidagi buyruqlarni bering
(`IP` o'rniga serveringiz IP manzilini yozing, root parolini so'raydi):

```
ssh root@IP "mkdir -p /opt/efootballarena"
scp -r server.py teams.py static deploy root@IP:/opt/efootballarena/
```

Hozirgi o'yinchilar va turnirlarni ham ko'chirmoqchi bo'lsangiz, `data` papkasini ham qo'shing:

```
scp -r data root@IP:/opt/efootballarena/
```

## 4-qadam. Serverni sozlash

Serverga ulaning:

```
ssh root@IP
```

Keyin quyidagi buyruqlarni ketma-ket bering:

```bash
# kerakli dasturlar
apt update && apt install -y python3 caddy

# sayt uchun alohida foydalanuvchi va papka
useradd --system --home /opt/efootballarena efootball
mkdir -p /opt/efootballarena
chown -R efootball:efootball /opt/efootballarena

# saytni xizmat sifatida yoqish (server qayta yonsa ham avtomatik ishga tushadi)
cp /opt/efootballarena/deploy/efootballarena.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now efootballarena
systemctl status efootballarena      # "active (running)" bo'lishi kerak

# HTTPS (Caddy SSL sertifikatni o'zi oladi)
cp /opt/efootballarena/deploy/Caddyfile /etc/caddy/Caddyfile
systemctl restart caddy
```

> Agar `apt install caddy` "topilmadi" desa, Caddy'ni rasmiy yo'riqnoma bo'yicha o'rnating:
> https://caddyserver.com/docs/install#debian-ubuntu-raspbian

## 5-qadam. Domenni serverga ulash (DNS)

Domen sotib olgan registrator panelida domeningizning DNS yozuvlariga quyidagilarni qo'shing:

| Turi | Nomi | Qiymati |
|------|------|---------|
| A    | `@`  | serveringiz IP manzili |
| A    | `www`| serveringiz IP manzili |

DNS 10 daqiqadan bir necha soatgacha yangilanadi. Keyin **https://efootballarena.uz** ochiladi.
Qulf belgisi (HTTPS) avtomatik paydo bo'ladi.

## 6-qadam. Birinchi kirishdan keyin

1. `https://efootballarena.uz/#/admin/login` sahifasiga kiring. Login `admin`, parol esa birinchi ishga tushishda serverda yaratiladi: `journalctl -u efootballarena | grep "Asosiy admin"` buyrug'i bilan ko'ring.
2. **Darhol** Admin panel → Sozlamalar bo'limida parolni almashtiring.

---

## Foydali buyruqlar (serverda)

| Nima qilish kerak | Buyruq |
|---|---|
| Saytni qayta ishga tushirish | `systemctl restart efootballarena` |
| Xatolarni ko'rish | `journalctl -u efootballarena -n 100` |
| Yangilangan fayllarni yuklash | 3-qadamdagi `scp` (data'siz), keyin `systemctl restart efootballarena` |
| Zaxira nusxa olish (kompyuteringizda) | `scp -r root@IP:/opt/efootballarena/data ./zaxira` |
| Serverdagi avtomatik zaxiralar | har kuni `/root/backups/data-SANA.tar.gz`, oxirgi 14 kun saqlanadi |

**Muhim:** `data/` papkasida barcha o'yinchilar, turnirlar va skrinshotlar saqlanadi. Haftada bir marta zaxira nusxa oling.
Saytni yangilaganda `data` papkasini qayta yuklamang, aks holda serverdagi yangi ma'lumotlar eskisi bilan almashib qoladi.
