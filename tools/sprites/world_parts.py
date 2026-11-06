# Сборка кадров врагов и объектов уровня из частей.
#
# Запуск: python3 tools/sprites/world_parts.py && npm run sprites
#
# Пишет art/sprites/enemies/peresort.txt и art/sprites/objects/turnstile.txt.
# Тела существ затеняются по форме (свет сверху-слева, как во всей игре), детали — нарисованы вручную.
# Цвета — символы палитры из tools/sprites/palette.js, «.» — прозрачный пиксель.

import os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))


class Canvas:
    def __init__(self, w, h):
        self.w, self.h = w, h
        self.px = [["."] * w for _ in range(h)]

    def put(self, x, y, ch):
        if 0 <= x < self.w and 0 <= y < self.h and ch != ".":
            self.px[y][x] = ch

    def stamp(self, rows, x, y):
        for dy, row in enumerate(rows):
            for dx, ch in enumerate(row):
                self.put(x + dx, y + dy, ch)

    def ellipse(self, cx, cy, rx, ry, ramp):
        """Залитый эллипс с затенением: свет сверху-слева. ramp — от светлого к тёмному."""
        inside = set()
        for y in range(self.h):
            for x in range(self.w):
                dx, dy = (x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry
                if dx * dx + dy * dy <= 1:
                    inside.add((x, y))
                    light = -dx * 0.55 - dy * 0.65  # больше — светлее
                    i = 0 if light > 0.55 else 1 if light > -0.05 else 2 if light > -0.6 else 3
                    self.put(x, y, ramp[i])
        return inside

    def outline(self, cells, ch="K"):
        for x, y in cells:
            for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if (nx, ny) not in cells and 0 <= nx < self.w and 0 <= ny < self.h and self.px[ny][nx] == ".":
                    self.px[ny][nx] = ch

    def rect(self, x, y, w, h, ch):
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                self.put(xx, yy, ch)

    def rows(self):
        return ["".join(r) for r in self.px]


def write(name, header, w, h, anims):
    out = header + [f"size {w}x{h}"]
    for anim, fps, loop, frames in anims:
        out += ["", f"anim {anim} {fps} {'loop' if loop else 'once'}"]
        for f in frames:
            assert len(f) == h and all(len(r) == w for r in f), (name, anim)
            out += ["frame"] + f
    path = os.path.join(ROOT, "art", "sprites", name + ".txt")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, "w").write("\n".join(out) + "\n")
    print("✓", os.path.relpath(path, ROOT))


# ---------- Пересортик ----------
# Рыжее существо из ржавчины: таскает гайку М8, над головой болтается гайка М6 — путает размеры.

NUT_BIG = [  # гайка М8, вид сверху: шестигранник с отверстием
    "..KKKK..",
    ".K5554K.",
    "K554443K",
    "K54KK43K",
    "K44KK33K",
    "K443332K",
    ".K3332K.",
    "..KKKK..",
]
NUT_SMALL = [  # гайка М6 — меньше
    ".KKKK.",
    "K5543K",
    "K4KK3K",
    "K4KK2K",
    "K4332K",
    ".KKKK.",
]
FACE = [  # злые брови, глаза, разинутый рот
    "KK...KK",
    ".6K.6K.",
    ".6K.6K.",
    ".......",
    "..KKK..",
    "..KxK..",
    "...K...",
]
LEG = ["KrK.", "KrK.", "K8CK", "KKKK"]  # нога: штанина-ржавчина, ботинок носком вперёд


def peresort(bob=0, step=0, small_nut_dy=0):
    """step: 0 — ноги рядом, 1 — передняя нога вперёд, -1 — задняя нога поднята."""
    c = Canvas(24, 24)
    # Гайка М6 над головой (позади тела)
    c.stamp(NUT_SMALL, 2, 1 + small_nut_dy)
    # Ноги — позади тела
    back_x, front_x, back_y = {0: (8, 12, 20), 1: (7, 13, 20), -1: (9, 11, 19)}[step]
    c.stamp(LEG, back_x, back_y)
    c.stamp(LEG, front_x, 20)
    # Тело — повыше, «человечком»
    # Ржавые «колючки» на макушке — рисуются до контура, чтобы он их обвёл
    spikes = {(9, 4 + bob), (10, 3 + bob), (14, 4 + bob)}
    for x, y in spikes:
        c.put(x, y, "r")
    cells = c.ellipse(11.5, 12.5 + bob, 5.5, 7.5, "Oor8") | spikes
    c.outline(cells)
    # Фактура ржавчины: каверны и светлые чешуйки
    for x, y in ((8, 15), (13, 18), (10, 18), (15, 12), (7, 12)):
        c.put(x, y + bob, "8")
    for x, y in ((9, 7), (12, 6), (7, 10)):
        c.put(x, y + bob, "9")
    c.stamp(FACE, 8, 8 + bob)
    # Задняя рука
    c.stamp(["KK", "rK", "KK"], 4, 13 + bob)
    # Передняя рука и гайка М8
    c.stamp(["KoK", "KrK"], 15, 14 + bob)
    c.stamp(NUT_BIG, 16, 11 + bob)
    return c.rows()


write("enemies/peresort", [
    "# Пересортик — враг Армии Коррозии (ТЗ, раздел 2): путает М6 с М8. Кадр 24×24, опорная точка — низ по центру.",
    "# Физическое тело в игре — 16×16 у низа кадра. Смотрит вправо, влево — отражением.",
    "# Собран в tools/sprites/world_parts.py — правь там.",
], 24, 24, [
    ("walk", 6, True, [
        peresort(0, 1, 0),
        peresort(-1, 0, -1),
        peresort(0, -1, 0),
        peresort(-1, 0, 1),
    ]),
])


# ---------- Проходная-турникет ----------
# Слева стойка со считывателем пропусков, справа стойка с лампой, между ними планки.

def turnstile(opened):
    c = Canvas(32, 32)
    screen = "v" if opened else "t"
    lamp = "v" if opened else "x"
    # Левая стойка со считывателем
    for y in range(5, 31):
        c.stamp(["K544433K"], 2, y)
    c.stamp(["KBBBBBBK", "KnnnnnnK"], 2, 3)  # синяя крышка
    c.stamp(["KKKKKK", "K" + screen * 4 + "K", "K" + screen + "66" + screen + "K", "K" + screen * 4 + "K", "KKKKKK"], 3, 8)
    c.stamp(["K22K"], 4, 15)  # прорезь для пропуска
    # Правая стойка с лампой
    for y in range(9, 31):
        c.stamp(["K5443K"], 24, y)
    c.stamp(["KKKKKK"], 24, 8)
    c.stamp([".KKKK.", "K" + lamp * 4 + "K", ".KKKK."], 24, 5)
    # Основания
    c.stamp(["KKKKKKKK"], 2, 31)
    c.stamp(["KKKKKK"], 24, 31)
    # Планки: закрыто — поперёк прохода, открыто — откинуты вниз вдоль левой стойки
    if not opened:
        for y in (14, 19):
            c.stamp(["K" * 14, "K" + "6" * 12 + "K", "K" + "3" * 12 + "K", "K" * 14], 10, y)
    else:
        for x in (10, 13):
            for y in range(14, 30):
                c.stamp(["63"], x, y)
            for y in range(13, 31):
                c.put(x - 1, y, "K")
                c.put(x + 2, y, "K")
            c.stamp(["KKK"], x, 13)
            c.stamp(["KKK"], x, 30)
    return c.rows()


write("objects/turnstile", [
    "# Проходная-турникет — чекпоинт (ТЗ, раздел 3: «отметился на проходной»). Кадр 32×32, опорная точка — низ по центру.",
    "# closed — красная лампа, планки поперёк; open — зелёные лампа и экран, планки откинуты.",
    "# Собран в tools/sprites/world_parts.py — правь там.",
], 32, 32, [
    ("closed", 1, False, [turnstile(False)]),
    ("open", 1, False, [turnstile(True)]),
])


# ---------- Бонусы на уровне (16×16) ----------

def helmet_item():
    # Каска-бонус: жёлтая (синяя — у героя), вид сбоку: купол с рёбрами и козырёк вперёд
    return [
        "................",
        "................",
        "................",
        "......KKKKK.....",
        "....KKZZYYYKK...",
        "...KZZYZYYYYyK..",
        "..KZZYYZYYYYYyK.",
        "..KZYYYZYYYYYyK.",
        "..KZYYYZYYYYyyK.",
        "..KYYYYZYYYYyyK.",
        ".KKKKKKKKKKKKKKK",
        ".KZZZZZZZZZZZZyK",
        "..KyyyyyyyyyyyK.",
        "...KKKKKKKKKKK..",
        "................",
        "................",
    ]


def coffee_item(steam):
    # Кофе: белая кружка с ручкой, сверху — кофе, над ним пар (два кадра)
    c = Canvas(16, 16)
    puffs = [(6, 1), (8, 2), (6, 3)] if steam == 0 else [(7, 1), (6, 2), (8, 3)]
    for x, y in puffs:
        c.put(x, y, "5")
    c.stamp(["KKKKKKKKK"], 3, 4)
    c.stamp(["K5wsssswK"], 3, 5)
    for y in range(6, 12):
        c.stamp(["K6555543K"], 3, y)
    c.stamp(["K5444433K"], 3, 12)
    c.stamp([".KKKKKKK."], 3, 13)
    c.stamp(["KKKK", "K.5K", "K.5K", "K.5K", "KK5K", "KKKK"], 11, 6)
    return c.rows()


def tape_item():
    # Изолента: моток, вид сверху в три четверти, свободный конец ленты свисает справа
    c = Canvas(16, 16)
    side = c.ellipse(8, 9.5, 6.5, 4, "GGgg")
    top = c.ellipse(8, 7.5, 6.5, 4, "VvvG")
    hole = set()
    for y in range(16):
        for x in range(16):
            dx, dy = (x + 0.5 - 8) / 2.6, (y + 0.5 - 7.5) / 1.6
            if dx * dx + dy * dy <= 1:
                hole.add((x, y))
                c.px[y][x] = "D" if y < 8 else "d"
    c.outline(side | top)
    for x, y in hole:  # контур дырки
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if (nx, ny) not in hole and c.px[ny][nx] in "VvG":
                c.px[ny][nx] = "K"
    for x, y in ((13, 11), (13, 12), (14, 13), (14, 14)):  # хвостик ленты
        c.put(x, y, "v")
        c.put(x + 1, y, "K")
    c.put(13, 15, "K")
    c.put(14, 15, "K")
    return c.rows()


def paint_item():
    # Порошковая покраска: банка с крышкой, по бокам — потёки краски разных цветов
    c = Canvas(16, 16)
    for y in range(5, 14):
        c.stamp(["K65544433K"], 3, y)
    c.stamp(["KKKKKKKKKK"], 3, 14)
    c.stamp([".KKKKKKKK.", "K66555544K", "K55444433K", ".KKKKKKKK."], 3, 2)
    drips = {4: ("Y", 7), 5: ("Y", 9), 7: ("x", 11), 8: ("x", 8), 10: ("t", 10), 11: ("t", 7)}
    for x, (ch, bottom) in drips.items():
        for y in range(5, bottom):
            c.put(x, y, ch)
    return c.rows()


write("items/bonuses", [
    "# Бонусы на уровне: Каска, Кофе (пар — два кадра), Изолента, Порошковая покраска. Кадр 16×16, центр.",
    "# Собраны в tools/sprites/world_parts.py — правь там.",
], 16, 16, [
    ("helmet", 1, False, [helmet_item()]),
    ("coffee", 3, True, [coffee_item(0), coffee_item(1)]),
    ("tape", 1, False, [tape_item()]),
    ("paint", 1, False, [paint_item()]),
])


# ---------- Шайба Гроверная (12×12) ----------
# Разрезная пружинная шайба (DIN 127): кольцо в три четверти, концы разреза разведены по высоте.
# Сверху сталь, внутри — синяя («своя», как герой). Глаза — чтобы было видно, что она живая.

WASHER = [
    "............",
    "............",
    "...KKKKKK...",
    ".KK655555KK.",
    "K655KKKK443K",
    "K65KDDDDKK3K",
    "K54KnnnnKK2K",
    "K443KKKK3K2K",
    ".KK4K33K2KK.",
    "...KKKKKK...",
    "............",
    "............",
]
# Стальное кольцо: блик сверху-слева, дырка с синей внутренней стенкой (снизу), тёмная прорезь
# разреза справа — как у настоящей пружинной шайбы. Глаза — на передней кромке.


def washer(sparks=0):
    c = Canvas(12, 12)
    c.stamp(WASHER, 0, 0)
    # Искры над шайбой: заряд двойного прыжка
    spark_sets = [[], [(3, 1), (8, 0)], [(2, 1), (5, 0), (8, 1), (10, 2)]]
    for x, y in spark_sets[sparks]:
        c.put(x, y, "L")
    return c.rows()


write("companion/washer", [
    "# Шайба Гроверная — компаньон, даёт двойной прыжок. Кадр 12×12, центр.",
    "# idle — покачивается с редкими искрами; react — вспышка искр при двойном прыжке.",
    "# Собрана в tools/sprites/world_parts.py — правь там.",
], 12, 12, [
    ("idle", 4, True, [washer(0), washer(0), washer(1), washer(0)]),
    ("react", 12, False, [washer(2), washer(1), washer(0)]),
])


# ---------- Финиш: ворота отгрузки (48×64) ----------
# Проём в стене склада, сверху свёрнутый рулонный затвор и синяя табличка с фурой,
# в проёме — день и открытый кузов фуры с коробками. Надпись «ОТГРУЗКА» выводит игра.

def loading_gate():
    c = Canvas(48, 64)
    # Проём: дневной свет снаружи — сверху светлее
    c.rect(4, 14, 40, 50, "A")
    c.rect(4, 14, 40, 12, "e")
    # Асфальт снаружи
    c.rect(4, 58, 40, 6, "2")
    # Фура задом к воротам: кузов синий, двери распахнуты, внутри коробки
    c.rect(9, 24, 30, 33, "K")
    c.rect(10, 25, 28, 31, "n")
    c.rect(10, 25, 28, 2, "B")
    c.rect(13, 28, 22, 26, "D")  # тёмный кузов изнутри
    for bx, by, bw, bh in ((14, 42, 9, 12), (24, 44, 10, 10), (15, 33, 8, 9), (25, 36, 8, 8)):
        c.rect(bx, by, bw, bh, "W")
        c.rect(bx, by, bw, 1, "X")
        c.rect(bx + bw // 2, by, 1, bh, "X")
        c.rect(bx + bw - 1, by, 1, bh, "w")
    c.rect(10, 28, 3, 26, "N")  # распахнутые створки по краям
    c.rect(35, 28, 3, 26, "N")
    c.put(11, 52, "x")  # фонари
    c.put(36, 52, "x")
    c.rect(9, 56, 30, 2, "K")  # бампер
    c.rect(12, 58, 6, 4, "K")  # колёса
    c.rect(30, 58, 6, 4, "K")
    c.rect(13, 59, 4, 2, "1")
    c.rect(31, 59, 4, 2, "1")
    # Рулонный затвор, свёрнутый наверху
    c.rect(4, 10, 40, 5, "2")
    for x in range(4, 44, 3):
        c.rect(x, 10, 1, 5, "1")
    c.rect(4, 14, 40, 1, "K")
    # Верхняя балка и синяя табличка с пиктограммой фуры
    c.rect(0, 0, 48, 10, "3")
    c.rect(0, 0, 48, 1, "5")
    c.rect(0, 9, 48, 1, "K")
    c.rect(14, 1, 20, 8, "K")
    c.rect(15, 2, 18, 6, "B")
    c.stamp(["666666...", "6666666..", "66666666.", ".K....K.."], 19, 3)  # фура-пиктограмма
    # Стойки ворот с жёлто-чёрной разметкой
    for x0 in (0, 44):
        c.rect(x0, 10, 4, 54, "3")
        for y in range(10, 64):
            if (y // 4) % 2 == 0:
                c.rect(x0 + 1, y, 2, 1, "Y")
            else:
                c.rect(x0 + 1, y, 2, 1, "K")
        c.rect(x0, 10, 1, 54, "K")
        c.rect(x0 + 3, 10, 1, 54, "K")
    return c.rows()


write("objects/loading_gate", [
    "# Финиш — ворота отгрузки. Кадр 48×64, опорная точка — низ по центру. Надпись «ОТГРУЗКА» выводит игра.",
    "# Собраны в tools/sprites/world_parts.py — правь там.",
], 48, 64, [
    ("gate", 1, False, [loading_gate()]),
])


# ---------- Эффекты ----------

def spark(stage):
    # Искра удара 12×12: вспышка → звезда → гаснущие точки
    c = Canvas(12, 12)
    if stage == 0:
        c.stamp(["..6..", ".666.", "66666", ".666.", "..6.."], 4, 4)
    elif stage == 1:
        for i in range(1, 6):
            for x, y in ((6 + i, 6), (6 - i, 6), (6, 6 + i), (6, 6 - i)):
                c.put(x, y, "Z" if i > 2 else "6")
        for i in (2, 3):
            for x, y in ((6 + i, 6 + i), (6 - i, 6 - i), (6 + i, 6 - i), (6 - i, 6 + i)):
                c.put(x, y, "Y")
        c.put(6, 6, "6")
    else:
        for x, y in ((1, 6), (11, 6), (6, 1), (6, 11), (2, 2), (10, 10), (10, 2), (2, 10)):
            c.put(x, y, "Y")
    return c.rows()


def puff(radius, sparse):
    # «Пуф» при подборе бонуса 16×16: колечко расширяется и рассыпается
    c = Canvas(16, 16)
    import math
    steps = 16 if not sparse else 8
    for i in range(steps):
        a = 2 * math.pi * i / steps
        x, y = round(7.5 + radius * math.cos(a)), round(7.5 + radius * math.sin(a))
        c.put(x, y, "6" if radius < 5 else "5")
    return c.rows()


def twinkle(size):
    # Блеск при сборе болта 8×8: звёздочка
    c = Canvas(8, 8)
    c.put(3, 3, "6")
    for i in range(1, size + 1):
        for x, y in ((3 + i, 3), (3 - i, 3), (3, 3 + i), (3, 3 - i)):
            c.put(x, y, "6" if i == 1 else "5")
    return c.rows()


write("effects/spark", ["# Искра удара. 12×12, центр."], 12, 12, [
    ("hit", 18, False, [spark(0), spark(1), spark(2)]),
])
write("effects/puff", ["# «Пуф» при подборе бонуса. 16×16, центр."], 16, 16, [
    ("pick", 16, False, [puff(3, False), puff(5, False), puff(7, True), puff(7.5, True)]),
])
write("effects/twinkle", ["# Блеск при сборе болта. 8×8, центр."], 8, 8, [
    ("bolt", 16, False, [twinkle(1), twinkle(3), twinkle(2), twinkle(1)]),
])


# ---------- Значок жизни (8×8): голова стажёра в каске ----------
# Отдельно для героя и героини (у неё рыжий хвост) — в панели показываем того, кого выбрали.

LIFE_MALE = [
    "..KKKK..",
    ".KbLBBK.",
    "KbBBBBnK",
    "KNNNNNNK",
    ".KwFKFK.",
    ".KwFFFK.",
    "..KHHK..",
    "...KK...",
]
LIFE_FEMALE = [
    "..KKKK..",
    ".KbLBBK.",
    "KbBBBBnK",
    "KNNNNNNK",
    "OKsFKFK.",
    "OKsFFFK.",
    ".KKHHK..",
    "...KK...",
]

write("ui/life", [
    "# Значок жизни в панели: голова стажёра (male) и стажёрки (female) в каске. 8×8.",
    "# Собран в tools/sprites/world_parts.py — правь там.",
], 8, 8, [
    ("male", 1, False, [LIFE_MALE]),
    ("female", 1, False, [LIFE_FEMALE]),
])


# ---------- Пересортик: гибель ----------
# Кадр 1 — «оглушён»: глаза крестиками, гайки разлетаются. Кадр 2 — сплющен перед тем, как рассыпаться.

FACE_DAZED = [  # глаза — тёмные крестики
    "K.K.K.K",
    ".K...K.",
    "K.K.K.K",
    ".......",
    "..KKK..",
    ".K...K.",
    ".......",
]


def peresort_defeat(stage):
    c = Canvas(24, 24)
    if stage == 0:
        c.stamp(NUT_SMALL, 0, 0)  # М6 слетела вверх-влево
        c.stamp(LEG, 7, 20)
        c.stamp(LEG, 13, 20)
        cells = c.ellipse(11.5, 12.5, 5.5, 7.5, "Oor8")
        c.outline(cells)
        for x, y in ((8, 15), (13, 18), (10, 18), (15, 12)):
            c.put(x, y, "8")
        c.stamp(FACE_DAZED, 8, 8)
        c.stamp(["KK", "rK", "KK"], 3, 10)  # руки вскинуты
        c.stamp(["KK", "Kr", "KK"], 18, 10)
        c.stamp(NUT_BIG, 16, 1)  # М8 подлетела
    else:
        c.stamp(LEG, 6, 20)
        c.stamp(LEG, 14, 20)
        cells = c.ellipse(11.5, 17.5, 8, 4.5, "Oor8")
        c.outline(cells)
        for x, y in ((6, 18), (15, 19), (10, 20), (17, 16)):
            c.put(x, y, "8")
        c.stamp(FACE_DAZED[:3], 8, 15)
        for x, y in ((3, 12), (20, 11), (6, 10), (17, 9)):  # хлопья ржавчины
            c.put(x, y, "r")
    return c.rows()


# ---------- Эффекты: ржавые хлопья и пыль ----------

def rust_burst(stage):
    # Пересортик рассыпается: хлопья ржавчины разлетаются и падают. 24×24
    import math
    c = Canvas(24, 24)
    n = 10
    for i in range(n):
        a = 2 * math.pi * i / n + 0.3
        r = 3 + stage * 3.2
        x = round(11.5 + r * math.cos(a))
        y = round(13 + r * math.sin(a) * 0.8 + stage * stage * 0.9)
        ch = "O" if stage == 0 else "r" if stage < 3 else "8"
        c.put(x, y, ch)
        if stage < 2:
            c.put(x + 1, y, "o")
    return c.rows()


def dust(stage):
    # Пыль из-под ботинок при приземлении: два облачка расходятся в стороны. 16×8
    c = Canvas(16, 8)
    spread = [2, 4, 6][stage]
    for side in (-1, 1):
        cx = 7.5 + side * spread
        for x, y in ((0, 0), (1, 0), (-1, 0), (0, -1)) if stage < 2 else ((0, 0),):
            c.put(round(cx + x), 6 - stage + y, "5" if stage == 0 else "4" if stage == 1 else "3")
    return c.rows()


# ---------- Карточка стандартов (12×16) ----------
# Белая карточка с синей шапкой и чертежом болта; блик пробегает по ней.

def std_card(glint):
    c = Canvas(12, 16)
    c.rect(1, 1, 10, 14, "6")
    c.rect(1, 1, 10, 4, "B")
    c.rect(1, 1, 10, 1, "b")
    c.rect(2, 3, 3, 1, "6")  # «DIN» — полоска текста в шапке
    c.rect(6, 3, 4, 1, "L")
    # Чертёж болта: головка и стержень с резьбой
    c.rect(3, 7, 6, 2, "1")
    c.rect(5, 9, 2, 5, "3")
    for y in (10, 12):
        c.put(4, y, "1")
        c.put(7, y, "1")
    c.rect(8, 13, 2, 1, "4")
    for x in range(0, 12):
        for y in (0, 15):
            c.put(x, y, "K")
    for y in range(0, 16):
        for x in (0, 11):
            c.put(x, y, "K")
    if glint is not None:
        for i in range(4):
            x, y = glint + i, 13 - i * 3
            for dy in range(3):
                if 1 <= x < 11 and 1 <= y + dy < 15:
                    c.put(x, y + dy, "L" if c.px[y + dy][x] == "B" else "5" if c.px[y + dy][x] != "6" else "L")
    return c.rows()


# ---------- Рохля (48×20) ----------
# Гидравлическая тележка с поддоном: на поддоне можно стоять и кататься. Ручка — справа, едет вправо.
# Корпус жёлтый — техника безопасности, вилы стальные.

def rohlya(wheel):
    c = Canvas(48, 20)
    # Поддон на вилах: верхние доски и три бруска
    c.rect(1, 6, 36, 2, "W")
    c.rect(1, 6, 36, 1, "X")
    for x in (1, 17, 33):
        c.rect(x, 8, 4, 3, "w")
    c.rect(1, 11, 36, 1, "w")
    for x in range(1, 37, 6):
        c.put(x, 7, "w")
    # Вилы под поддоном
    c.rect(0, 12, 38, 3, "3")
    c.rect(0, 12, 38, 1, "4")
    c.rect(0, 14, 38, 1, "1")
    # Гидроблок и рама
    c.rect(36, 7, 6, 9, "Y")
    c.rect(36, 7, 6, 1, "Z")
    c.rect(41, 8, 1, 8, "y")
    c.rect(38, 9, 2, 4, "1")  # цилиндр
    c.put(38, 9, "4")
    # Ручка-дышло с рукоятью
    for i in range(7):
        c.put(41 + i // 2, 6 - i, "K")
        c.put(42 + i // 2, 6 - i, "2")
    c.rect(43, 0, 5, 1, "K")
    c.rect(43, 1, 5, 1, "D")
    # Колёса: переднее большое под гидроблоком, ролики под вилами
    for cx in (39,):
        c.rect(cx - 2, 15, 5, 5, "K")
        c.rect(cx - 1, 16, 3, 3, "2")
        c.put(cx - 1 + wheel, 17 if wheel != 1 else 16, "5")
    for rx in (3, 30):
        c.rect(rx, 15, 4, 4, "K")
        c.rect(rx + 1, 16, 2, 2, "1")
        c.put(rx + 1 + wheel % 2, 16, "4")
    # Контур корпуса и вил
    for x in range(0, 38):
        if c.px[15][x] == ".":
            c.put(x, 15, "K")
    c.rect(0, 11, 1, 4, "K")
    c.rect(35, 6, 1, 10, "K")
    c.rect(36, 6, 6, 1, "K")
    c.rect(42, 7, 1, 9, "K")
    return c.rows()


# ---------- Реквизит склада (32×32, опорная точка — низ по центру) ----------
# Декор без физики: оживляет уровень. Без надписей и чужих марок.

def pallet(c, x, y, w=28):
    c.rect(x, y, w, 2, "W")
    c.rect(x, y, w, 1, "X")
    for bx in (x, x + w // 2 - 2, x + w - 4):
        c.rect(bx, y + 2, 4, 2, "w")
    c.rect(x, y + 4, w, 1, "w")


def prop_sacks():
    # Мешки на поддоне (цемент/смесь) — серые, с синей полосой
    c = Canvas(32, 32)
    pallet(c, 2, 27)
    for (cx, cy) in ((9, 23), (22, 23), (15.5, 16.5)):
        cells = c.ellipse(cx, cy, 7, 4.2, "5432")
        c.outline(cells)
        c.rect(int(cx) - 1, int(cy) - 3, 2, 6, "B")
    return c.rows()


def prop_barrel():
    # Синяя пластиковая бочка
    c = Canvas(32, 32)
    c.rect(9, 10, 14, 22, "n")
    c.rect(10, 10, 3, 22, "B")
    c.rect(11, 10, 1, 22, "b")
    c.rect(20, 10, 3, 22, "N")
    for y in (14, 24):
        c.rect(9, y, 14, 1, "N")
        c.rect(10, y - 1, 12, 1, "b")
    c.rect(9, 9, 14, 2, "b")
    c.rect(12, 9, 3, 1, "L")
    for y in range(9, 32):
        c.put(8, y, "K")
        c.put(23, y, "K")
    c.rect(8, 8, 16, 1, "K")
    return c.rows()


def prop_extinguisher():
    # Огнетушитель на кронштейне у стены
    c = Canvas(32, 32)
    c.rect(13, 14, 6, 15, "x")
    c.rect(14, 14, 1, 15, "T")
    c.rect(18, 14, 1, 15, "c")
    c.rect(13, 20, 6, 3, "6")  # белая наклейка
    c.rect(14, 21, 4, 1, "x")
    c.rect(14, 11, 4, 3, "1")
    c.rect(13, 10, 6, 1, "K")
    c.rect(18, 11, 4, 1, "K")  # рычаг
    for y in range(12, 22):
        c.put(20 if y < 18 else 21, y, "D")  # шланг
    for y in range(10, 30):
        c.put(12, y, "K")
        c.put(19, y, "K")
    c.rect(12, 29, 8, 1, "K")
    c.rect(11, 30, 10, 2, "2")  # подставка
    c.rect(11, 30, 10, 1, "3")
    return c.rows()


def prop_wrapped():
    # Паллета, обмотанная стрейч-плёнкой: коробки просвечивают, блики плёнки
    c = Canvas(32, 32)
    pallet(c, 2, 27)
    c.rect(3, 6, 26, 21, "W")
    for y in (6, 13, 20):
        c.rect(3, y, 26, 1, "w")
    for x in (11, 20):
        c.rect(x, 6, 1, 21, "w")
    c.rect(3, 6, 26, 1, "X")
    for i in range(0, 21, 2):
        c.put(5 + i // 3, 7 + i, "5")
        c.put(24 - i // 4, 8 + i, "6" if i % 4 == 0 else "4")
    c.rect(3, 9, 26, 1, "4")
    c.rect(3, 22, 26, 1, "4")
    for y in range(6, 27):
        c.put(2, y, "K")
        c.put(29, y, "K")
    c.rect(2, 5, 28, 1, "K")
    return c.rows()


def prop_cart():
    # Платформенная тележка с коробкой
    c = Canvas(32, 32)
    c.rect(3, 24, 24, 3, "3")
    c.rect(3, 24, 24, 1, "4")
    c.rect(3, 26, 24, 1, "1")
    for y in range(10, 24):  # ручка
        c.put(26, y, "2")
        c.put(27, y, "K")
    c.rect(24, 10, 4, 1, "K")
    for wx in (6, 21):
        c.rect(wx - 2, 27, 5, 5, "K")
        c.rect(wx - 1, 28, 3, 3, "2")
    c.rect(6, 14, 14, 10, "W")
    c.rect(6, 14, 14, 1, "X")
    c.rect(12, 14, 2, 10, "5")
    c.rect(6, 23, 14, 1, "w")
    c.rect(5, 13, 16, 1, "K")
    for y in range(14, 24):
        c.put(5, y, "K")
        c.put(20, y, "K")
    return c.rows()


def prop_ladder():
    # Стремянка с площадкой
    c = Canvas(32, 32)
    for i in range(30):
        x1 = 9 + i // 5
        x2 = 22 - i // 5
        c.put(x1, 31 - i, "Y")
        c.put(x1 - 1, 31 - i, "K")
        c.put(x2, 31 - i, "y")
        c.put(x2 + 1, 31 - i, "K")
    for y in (26, 20, 14, 8):
        i = 31 - y
        c.rect(9 + i // 5, y, 14 - 2 * (i // 5), 1, "3")
    c.rect(13, 1, 7, 2, "3")
    c.rect(13, 1, 7, 1, "5")
    return c.rows()


def prop_crate_bolts():
    # Ящик с болтами — свои, крепёжные
    c = Canvas(32, 32)
    pallet(c, 4, 27, 24)
    c.rect(6, 15, 20, 12, "w")
    c.rect(6, 15, 20, 1, "W")
    for y in (19, 23):
        c.rect(6, y, 20, 1, "W")
    for x in range(7, 25, 2):
        c.put(x, 13, "4")
        c.put(x + 1, 14, "3")
        c.put(x, 14, "2")
    c.rect(8, 12, 2, 1, "5")
    c.rect(18, 12, 2, 1, "5")
    for y in range(13, 27):
        c.put(5, y, "K")
        c.put(26, y, "K")
    c.rect(5, 27 - 1, 22, 1, "K")
    return c.rows()


def prop_lamp():
    # Подвесной светильник (низ — у крепления троса). Свет рисует игра.
    c = Canvas(32, 32)
    c.rect(15, 0, 1, 22, "1")
    c.rect(10, 22, 12, 3, "2")
    c.rect(10, 22, 12, 1, "3")
    c.rect(8, 25, 16, 2, "1")
    c.rect(9, 27, 14, 1, "Z")
    c.rect(11, 28, 10, 1, "6")
    return c.rows()


PROPS = [
    ("sacks", prop_sacks()),
    ("barrel", prop_barrel()),
    ("extinguisher", prop_extinguisher()),
    ("wrapped", prop_wrapped()),
    ("cart", prop_cart()),
    ("ladder", prop_ladder()),
    ("crate_bolts", prop_crate_bolts()),
    ("lamp", prop_lamp()),
]

write("enemies/peresort_defeat", [
    "# Гибель Пересортика: оглушён → сплющен. Дальше игра рассыпает его хлопьями (effects/rust). 24×24.",
    "# Собран в tools/sprites/world_parts.py — правь там.",
], 24, 24, [
    ("defeat", 8, False, [peresort_defeat(0), peresort_defeat(1)]),
])
write("effects/rust", ["# Пересортик рассыпается ржавыми хлопьями. 24×24, центр."], 24, 24, [
    ("burst", 14, False, [rust_burst(s) for s in range(5)]),
])
write("effects/dust", ["# Пыль из-под ботинок. 16×8, низ по центру."], 16, 8, [
    ("land", 14, False, [dust(0), dust(1), dust(2)]),
])
write("items/card", [
    "# Карточка стандартов — коллекция, 3 на уровне (ТЗ, раздел 3). 12×16, центр. Блеск над ней добавляет игра (effects/twinkle).",
    "# Собрана в tools/sprites/world_parts.py — правь там.",
], 12, 16, [
    ("card", 1, False, [std_card(None)]),
])
write("objects/rohlya", [
    "# Рохля с поддоном — на ней катаются (ТЗ: мир «Склад»). 48×20, низ по центру. Ручка справа — едет вправо.",
    "# Собрана в tools/sprites/world_parts.py — правь там.",
], 48, 20, [
    ("idle", 1, False, [rohlya(0)]),
    ("roll", 12, True, [rohlya(0), rohlya(1), rohlya(2)]),
])
write("objects/props", [
    "# Реквизит склада — декор без физики. Кадр 32×32, низ по центру. Имя анимации = предмет.",
    "# Собран в tools/sprites/world_parts.py — правь там.",
], 32, 32, [(name, 1, False, [rows]) for name, rows in PROPS])


# ---------- Босс Склада: Ящик-мимик «Разное» (64×56) ----------
# Картонный ящик, в который свалили всё подряд. Притворяется коробкой, потом открывает пасть
# с зубами-скобами и плюётся вперемешку гайками, болтами и шайбами. Надпись «РАЗНОЕ» на белой
# наклейке пишет игра (текст — не в картинке). Наклейка всегда на одном месте: x 7–56, y 34–45 (под «РАЗНОЕ» шрифтом 8 — 48 px).

def mimic_body(c, top):
    """Короб от строки top до низа кадра: картон, свет слева, тень справа, контур, наклейка."""
    c.rect(4, top, 56, 56 - top, "W")
    c.rect(5, top, 3, 56 - top, "X")
    c.rect(55, top, 4, 56 - top, "w")
    c.rect(4, 53, 56, 2, "w")
    for y in range(top, 56):
        c.put(3, y, "K")
        c.put(60, y, "K")
    c.rect(3, 55, 58, 1, "K")
    # Вмятины и потёртости картона
    for x, y in ((12, 50), (40, 49), (50, 30), (9, 29)):
        if y >= top:
            c.put(x, y, "w")
    # Наклейка под надпись
    c.rect(7, 34, 50, 12, "6")
    c.rect(7, 45, 50, 1, "5")
    c.rect(6, 33, 52, 1, "K")
    c.rect(6, 46, 52, 1, "K")
    c.rect(6, 33, 1, 14, "K")
    c.rect(57, 33, 1, 14, "K")


def mimic_lid_closed(c, y):
    # Крышка-клапаны сверху (вид чуть сверху): светлый картон, шов посередине, полоса скотча
    c.rect(4, y, 56, 6, "X")
    c.rect(4, y + 5, 56, 1, "W")
    c.rect(31, y, 2, 6, "w")
    c.rect(28, y, 8, 6, "4")
    c.rect(28, y, 8, 1, "5")
    c.rect(3, y - 1, 58, 1, "K")
    c.rect(3, y, 1, 6, "K")
    c.rect(60, y, 1, 6, "K")


def mimic_eyes(c, y, kind):
    for ex in (20, 38):
        if kind == "glow":
            c.rect(ex, y, 6, 3, "Z")
            c.rect(ex + 2, y + 1, 2, 1, "6")
        elif kind == "open":
            c.rect(ex, y, 7, 5, "6")
            c.rect(ex + 3 if ex == 20 else ex + 1, y + 1, 3, 3, "K")
            # Злые брови
            c.rect(ex - 1, y - 2, 8, 1, "K")
            c.put(ex + (6 if ex == 20 else 0), y - 1, "K")
        elif kind == "tired":
            c.rect(ex, y + 2, 7, 3, "6")
            c.rect(ex, y + 1, 7, 1, "K")
            c.rect(ex + 2, y + 3, 3, 2, "K")
        elif kind == "x":
            for i in range(5):
                c.put(ex + i + 1, y + i, "6")
                c.put(ex + 5 - i, y + i, "6")


def mimic_mouth(c, lid_y, tongue):
    """Открытая пасть: поднятая крышка с глазами на изнанке, зубы-скобы, язык, крепёж внутри."""
    # Изнанка поднятой крышки
    c.rect(6, lid_y, 52, 14 - lid_y + 2, "w")
    c.rect(6, lid_y, 52, 1, "W")
    c.rect(5, lid_y - 1, 54, 1, "K")
    c.rect(5, lid_y, 1, 16 - lid_y, "K")
    c.rect(58, lid_y, 1, 16 - lid_y, "K")
    # Тёмная пасть
    c.rect(6, 16, 52, 10, "D")
    c.rect(6, 16, 52, 2, "K")
    # Крепёж вперемешку внутри
    for x, y, ch in ((12, 21, "4"), (13, 21, "3"), (44, 20, "4"), (45, 21, "3"), (30, 22, "2"), (36, 21, "5"), (20, 22, "1")):
        c.put(x, y, ch)
    # Зубы-скобы: сверху вниз и снизу вверх
    for x in range(8, 57, 6):
        c.rect(x, 16, 3, 1, "5")
        c.put(x, 17, "4")
        c.put(x + 2, 17, "4")
        c.rect(x + 2, 25, 3, 1, "5")
        c.put(x + 2, 24, "4")
        c.put(x + 4, 24, "4")
    # Язык — вишнёвый, свисает через край
    c.rect(26, 22, 12, 4, "x")
    c.rect(28, 26, 8, tongue, "x")
    c.rect(29, 22, 2, 2, "T")
    c.rect(28, 26 + tongue, 8, 1, "c")


def mimic(state, frame=0):
    c = Canvas(64, 56)
    if state == "closed":
        mimic_body(c, 16)
        mimic_lid_closed(c, 10)
    elif state == "peek":
        mimic_body(c, 16)
        c.rect(4, 11, 56, 5, "K")  # щель под приподнятой крышкой
        mimic_eyes(c, 12, "glow")
        mimic_lid_closed(c, 6)
    elif state in ("open", "tired", "hurt"):
        mimic_body(c, 26)
        lid_y = 1 if state == "open" else 5
        tongue = {"open": 4, "tired": 5 + frame, "hurt": 2}[state]
        mimic_mouth(c, lid_y, tongue)
        mimic_eyes(c, lid_y + 5, {"open": "open", "tired": "tired", "hurt": "x"}[state])
    elif state == "folded":
        # Разобран: сплющенный картон, крышка набок, наклейка — краем
        c.rect(2, 44, 60, 10, "W")
        c.rect(2, 44, 60, 2, "X")
        c.rect(2, 52, 60, 2, "w")
        c.rect(1, 43, 62, 1, "K")
        c.rect(1, 54, 62, 1, "K")
        c.rect(1, 43, 1, 12, "K")
        c.rect(62, 43, 1, 12, "K")
        c.rect(20, 46, 24, 4, "6")
        c.rect(20, 49, 24, 1, "5")
        for x in (8, 54):
            c.rect(x, 50, 2, 1, "w")
    return c.rows()


FASTENERS = {
    "nut": [
        "..KKKK..",
        ".K5543K.",
        "K54KK43K",
        "K4K..K3K",
        "K4K..K2K",
        "K43KK32K",
        ".K3322K.",
        "..KKKK..",
    ],
    "bolt": [
        ".KKKKK..",
        "K55443K.",
        "K44332K.",
        ".KK4KKK.",
        "..K43K..",
        "..K32K..",
        "..K43K..",
        "...KK...",
    ],
    "washer": [
        "..KKKK..",
        ".KLbbBK.",
        "KLbKKBnK",
        "KbK..KnK",
        "KbK..KnK",
        "KBnKKnNK",
        ".KnnNNK.",
        "..KKKK..",
    ],
    "screw": [
        "...KK...",
        "..K54K..",
        "..K43K..",
        ".KK4KKK.",
        "..K43K..",
        ".KK3KK..",
        "..K32K..",
        "...KK...",
    ],
}

write("bosses/mimic", [
    "# Босс Склада — Ящик-мимик «Разное». Кадр 64×56, опорная точка — низ по центру.",
    "# Состояния: закрыт (притворяется), подглядывает, пасть открыта, устал (язык наружу), получил удар, разобран.",
    "# Надпись «РАЗНОЕ» на наклейке (x 7–56, y 34–45) пишет игра. Собран в tools/sprites/world_parts.py — правь там.",
], 64, 56, [
    ("closed", 1, False, [mimic("closed")]),
    ("peek", 1, False, [mimic("peek")]),
    ("open", 1, False, [mimic("open")]),
    ("tired", 4, True, [mimic("tired", 0), mimic("tired", 1)]),
    ("hurt", 1, False, [mimic("hurt")]),
    ("folded", 1, False, [mimic("folded")]),
])
write("bosses/fasteners", [
    "# Снаряды Ящика «Разное» — пересорт вперемешку: гайка, болт, синяя шайба, саморез. 8×8, центр.",
], 8, 8, [(name, 1, False, [rows]) for name, rows in FASTENERS.items()])
