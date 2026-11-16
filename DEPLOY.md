# Deploying efootballarena.uz

What you need:
1. **A domain**: `efootballarena.uz`
2. **A VPS**: a small Ubuntu server that runs 24/7
3. About 30–60 minutes

> Why a VPS? The site stores its data in the `data/` folder. Most free hosting platforms (Render free tier, Vercel, Netlify)
> wipe the disk on every deploy, so the data would be lost. On a VPS everything persists.

---

## Step 1. Buy the domain (.uz)

1. Check that `efootballarena.uz` is available on https://cctld.uz.
2. Buy it from one of the accredited registrars listed on cctld.uz. Only they sell `.uz` domains.
3. Leave the DNS settings alone for now; you will need them in step 5.

## Step 2. Get a VPS

The smallest plan is enough: **1 CPU, 1 GB RAM, 10–20 GB disk, Ubuntu 22.04 or 24.04**.

- A hosting company in Uzbekistan (fast from inside the country, paid in UZS)
- or abroad: Hetzner, DigitalOcean, Contabo and others (about $4–6 per month)

After purchase you get an **IP address** (for example `185.10.20.30`) and a **root password**.

## Step 3. Upload the files

Open PowerShell on your computer and go into the project folder. Then run the following
(replace `IP` with your server's IP address; you will be asked for the root password):

```
ssh root@IP "mkdir -p /opt/efootballarena"
scp -r server.py teams.py static deploy root@IP:/opt/efootballarena/
```

To move existing players and tournaments as well, upload the `data` folder too:

```
scp -r data root@IP:/opt/efootballarena/
```

## Step 4. Set up the server

Connect to the server:

```
ssh root@IP
```

Then run these commands one after another:

```bash
# required packages
apt update && apt install -y python3 caddy

# a dedicated user and folder for the site
useradd --system --home /opt/efootballarena efootball
mkdir -p /opt/efootballarena
chown -R efootball:efootball /opt/efootballarena

# run the site as a service (starts automatically after a reboot)
cp /opt/efootballarena/deploy/efootballarena.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now efootballarena
systemctl status efootballarena      # should say "active (running)"

# HTTPS (Caddy obtains the SSL certificate by itself)
cp /opt/efootballarena/deploy/Caddyfile /etc/caddy/Caddyfile
systemctl restart caddy
```

> If `apt install caddy` says the package was not found, install Caddy using the official guide:
> https://caddyserver.com/docs/install#debian-ubuntu-raspbian

## Step 5. Point the domain to the server (DNS)

In your registrar's control panel, add these DNS records for the domain:

| Type | Name | Value |
|------|------|-------|
| A    | `@`  | your server's IP address |
| A    | `www`| your server's IP address |

DNS changes take from 10 minutes to a few hours. After that **https://efootballarena.uz** opens,
and the padlock (HTTPS) appears automatically.

## Step 6. After the first sign-in

1. Open `https://efootballarena.uz/#/admin/login`. The login is `admin`; the password is generated on the server at first launch. View it with `journalctl -u efootballarena | grep "Asosiy admin"`.
2. Change the password **right away** under Admin panel → Settings.

---

## Useful commands (on the server)

| Task | Command |
|---|---|
| Restart the site | `systemctl restart efootballarena` |
| View errors | `journalctl -u efootballarena -n 100` |
| Upload updated files | the `scp` from step 3 (without `data`), then `systemctl restart efootballarena` |
| Download a backup (on your computer) | `scp -r root@IP:/opt/efootballarena/data ./backup` |
| Automatic backups on the server | daily `/root/backups/data-DATE.tar.gz`, the last 14 days are kept |

**Important:** the `data/` folder holds all players, tournaments and screenshots. Take a backup once a week.
Never re-upload the `data` folder when updating the site, or the newer data on the server will be overwritten with the old copy.
