# -*- coding: utf-8 -*-
"""Jamoalar ro'yxati: 50 ta nomdor klub va 50 ta terma jamoa.

Klublarning haqiqiy logotiplari static/logos/ papkasida saqlanadi.
Admin panel -> "Jamoalar" bo'limidan istalgan jamoaga o'z logotipini yuklash mumkin.
Terma jamoalar uchun bayroqlar flagcdn.com dan olinadi.
"""

def _c(id_, name, short, c1, c2):
    # Haqiqiy logotip: static/logos/<id>.png
    return {"id": id_, "name": name, "short": short, "colors": [c1, c2], "logo": f"/logos/{id_}.png"}


CLUBS = [
    _c("real-madrid", "Real Madrid", "RMA", "#ffffff", "#febe10"),
    _c("barcelona", "Barcelona", "BAR", "#a50044", "#004d98"),
    _c("atletico", "Atletico Madrid", "ATM", "#cb3524", "#272e61"),
    _c("sevilla", "Sevilla", "SEV", "#ffffff", "#d4001f"),
    _c("real-sociedad", "Real Sociedad", "RSO", "#0067b1", "#ffffff"),
    _c("athletic", "Athletic Bilbao", "ATH", "#ee2523", "#ffffff"),
    _c("villarreal", "Villarreal", "VIL", "#ffe667", "#005187"),
    _c("valencia", "Valencia", "VAL", "#ffffff", "#f18e00"),
    _c("betis", "Real Betis", "BET", "#0bb363", "#ffffff"),
    _c("man-city", "Manchester City", "MCI", "#6cabdd", "#1c2c5b"),
    _c("man-united", "Manchester United", "MUN", "#da291c", "#fbe122"),
    _c("liverpool", "Liverpool", "LIV", "#c8102e", "#00b2a9"),
    _c("arsenal", "Arsenal", "ARS", "#ef0107", "#ffffff"),
    _c("chelsea", "Chelsea", "CHE", "#034694", "#ffffff"),
    _c("tottenham", "Tottenham Hotspur", "TOT", "#ffffff", "#132257"),
    _c("newcastle", "Newcastle United", "NEW", "#241f20", "#ffffff"),
    _c("aston-villa", "Aston Villa", "AVL", "#670e36", "#95bfe5"),
    _c("west-ham", "West Ham United", "WHU", "#7a263a", "#1bb1e7"),
    _c("bayern", "Bayern Munchen", "FCB", "#dc052d", "#0066b2"),
    _c("dortmund", "Borussia Dortmund", "BVB", "#fde100", "#000000"),
    _c("leverkusen", "Bayer Leverkusen", "B04", "#e32221", "#000000"),
    _c("leipzig", "RB Leipzig", "RBL", "#ffffff", "#dd0741"),
    _c("stuttgart", "VfB Stuttgart", "VFB", "#ffffff", "#e32219"),
    _c("frankfurt", "Eintracht Frankfurt", "SGE", "#000000", "#e1000f"),
    _c("juventus", "Juventus", "JUV", "#000000", "#ffffff"),
    _c("inter", "Inter", "INT", "#010e80", "#000000"),
    _c("milan", "AC Milan", "MIL", "#fb090b", "#000000"),
    _c("napoli", "Napoli", "NAP", "#12a0d7", "#ffffff"),
    _c("roma", "AS Roma", "ROM", "#8e1f2f", "#f0bc42"),
    _c("lazio", "Lazio", "LAZ", "#87d8f7", "#ffffff"),
    _c("atalanta", "Atalanta", "ATA", "#1e71b8", "#000000"),
    _c("fiorentina", "Fiorentina", "FIO", "#482e92", "#ffffff"),
    _c("psg", "Paris Saint-Germain", "PSG", "#004170", "#da291c"),
    _c("marseille", "Olympique Marseille", "OM", "#2faee0", "#ffffff"),
    _c("lyon", "Olympique Lyon", "OL", "#ffffff", "#da0812"),
    _c("monaco", "AS Monaco", "ASM", "#e51b22", "#ffffff"),
    _c("lille", "Lille", "LOSC", "#e01e13", "#20325f"),
    _c("ajax", "Ajax", "AJA", "#ffffff", "#d2122e"),
    _c("psv", "PSV Eindhoven", "PSV", "#ed1c24", "#ffffff"),
    _c("feyenoord", "Feyenoord", "FEY", "#ff0000", "#000000"),
    _c("benfica", "Benfica", "SLB", "#e83030", "#ffffff"),
    _c("porto", "FC Porto", "FCP", "#00428c", "#ffffff"),
    _c("sporting", "Sporting CP", "SCP", "#008057", "#ffffff"),
    _c("celtic", "Celtic", "CEL", "#018749", "#ffffff"),
    _c("galatasaray", "Galatasaray", "GS", "#a90432", "#fdb912"),
    _c("fenerbahce", "Fenerbahce", "FB", "#163962", "#ffed00"),
    _c("al-nassr", "Al Nassr", "NSR", "#fcd116", "#1b3e8c"),
    _c("al-hilal", "Al Hilal", "HIL", "#005bac", "#ffffff"),
    _c("inter-miami", "Inter Miami", "MIA", "#f7b5cd", "#231f20"),
    _c("boca", "Boca Juniors", "BOC", "#103f79", "#f3b229"),
]


def _n(id_, name, short, flag, c1, c2):
    return {"id": "n-" + id_, "name": name, "short": short, "flag": flag, "colors": [c1, c2]}


# Asosan 2026 Jahon chempionatiga yo'llanma olgan terma jamoalar + bir nechta mashhur terma jamoalar
NATIONS = [
    _n("usa", "AQSh", "USA", "us", "#002868", "#bf0a30"),
    _n("mex", "Meksika", "MEX", "mx", "#006847", "#ce1126"),
    _n("can", "Kanada", "CAN", "ca", "#d52b1e", "#ffffff"),
    _n("arg", "Argentina", "ARG", "ar", "#74acdf", "#ffffff"),
    _n("bra", "Braziliya", "BRA", "br", "#ffdf00", "#009c3b"),
    _n("uru", "Urugvay", "URU", "uy", "#5cbfeb", "#ffffff"),
    _n("col", "Kolumbiya", "COL", "co", "#fcd116", "#003893"),
    _n("ecu", "Ekvador", "ECU", "ec", "#ffdd00", "#034ea2"),
    _n("par", "Paragvay", "PAR", "py", "#d52b1e", "#0038a8"),
    _n("fra", "Fransiya", "FRA", "fr", "#002395", "#ed2939"),
    _n("eng", "Angliya", "ENG", "gb-eng", "#ffffff", "#cf081f"),
    _n("esp", "Ispaniya", "ESP", "es", "#c60b1e", "#ffc400"),
    _n("ger", "Germaniya", "GER", "de", "#000000", "#dd0000"),
    _n("por", "Portugaliya", "POR", "pt", "#006600", "#ff0000"),
    _n("ned", "Niderlandiya", "NED", "nl", "#ff6600", "#21468b"),
    _n("bel", "Belgiya", "BEL", "be", "#ed2939", "#fae042"),
    _n("cro", "Xorvatiya", "CRO", "hr", "#ff0000", "#ffffff"),
    _n("sui", "Shveytsariya", "SUI", "ch", "#ff0000", "#ffffff"),
    _n("aut", "Avstriya", "AUT", "at", "#ed2939", "#ffffff"),
    _n("nor", "Norvegiya", "NOR", "no", "#ba0c2f", "#00205b"),
    _n("sco", "Shotlandiya", "SCO", "gb-sct", "#005eb8", "#ffffff"),
    _n("ita", "Italiya", "ITA", "it", "#0066cc", "#ffffff"),
    _n("tur", "Turkiya", "TUR", "tr", "#e30a17", "#ffffff"),
    _n("den", "Daniya", "DEN", "dk", "#c8102e", "#ffffff"),
    _n("ukr", "Ukraina", "UKR", "ua", "#0057b7", "#ffd700"),
    _n("pol", "Polsha", "POL", "pl", "#ffffff", "#dc143c"),
    _n("swe", "Shvetsiya", "SWE", "se", "#006aa7", "#fecc00"),
    _n("srb", "Serbiya", "SRB", "rs", "#c6363c", "#0c4076"),
    _n("uzb", "O'zbekiston", "UZB", "uz", "#0099b5", "#1eb53a"),
    _n("jpn", "Yaponiya", "JPN", "jp", "#000080", "#ffffff"),
    _n("kor", "Janubiy Koreya", "KOR", "kr", "#c60c30", "#003478"),
    _n("irn", "Eron", "IRN", "ir", "#239f40", "#da0000"),
    _n("aus", "Avstraliya", "AUS", "au", "#ffcd00", "#00843d"),
    _n("ksa", "Saudiya Arabistoni", "KSA", "sa", "#006c35", "#ffffff"),
    _n("qat", "Qatar", "QAT", "qa", "#8a1538", "#ffffff"),
    _n("jor", "Iordaniya", "JOR", "jo", "#ce1126", "#007a3d"),
    _n("mar", "Marokash", "MAR", "ma", "#c1272d", "#006233"),
    _n("sen", "Senegal", "SEN", "sn", "#00853f", "#fdef42"),
    _n("egy", "Misr", "EGY", "eg", "#ce1126", "#000000"),
    _n("alg", "Jazoir", "ALG", "dz", "#006633", "#ffffff"),
    _n("tun", "Tunis", "TUN", "tn", "#e70013", "#ffffff"),
    _n("civ", "Kot-d'Ivuar", "CIV", "ci", "#f77f00", "#009e60"),
    _n("gha", "Gana", "GHA", "gh", "#ce1126", "#fcd116"),
    _n("rsa", "Janubiy Afrika", "RSA", "za", "#007749", "#ffb81c"),
    _n("cpv", "Kabo-Verde", "CPV", "cv", "#003893", "#cf2027"),
    _n("nga", "Nigeriya", "NGA", "ng", "#008751", "#ffffff"),
    _n("nzl", "Yangi Zelandiya", "NZL", "nz", "#000000", "#ffffff"),
    _n("pan", "Panama", "PAN", "pa", "#da121a", "#072357"),
    _n("hai", "Gaiti", "HAI", "ht", "#00209f", "#d21034"),
    _n("cuw", "Kyurasao", "CUW", "cw", "#002b7f", "#f9e814"),
]
