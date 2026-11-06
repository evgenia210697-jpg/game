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
