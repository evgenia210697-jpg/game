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
