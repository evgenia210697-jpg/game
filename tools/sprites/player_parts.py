# Сборка кадров стажёра (мужчина и женщина) из общих частей.
#
# Запуск: python3 tools/sprites/player_parts.py && npm run sprites
#
# Пишет art/sprites/player/player_male.txt и player_female.txt. Каска, туловище, руки и ноги — общие,
# лицо и волосы — у каждого свои. Новый кадр (действие, урон, победа) добавляем здесь — сразу обоим.
# Если правишь один кадр вручную прямо в .txt — этот скрипт его перезапишет: правь части здесь.
# Цвета — символы палитры из tools/sprites/palette.js, «.» — прозрачный пиксель.

import os

W = 24
BLANK = "." * W
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

# Каска — общая

HELMET = [
".........KKKKKK.........",
".......KKbLLbBBKK.......",
"......KbLLbBBBBBBK......",
".....KbLbbBBBLLBBnK.....",
"....KbLbBBBBBLbBBBnK....",
"....KbbBBBBBBbBBBBnnK...",
"....KbBBBBBBBBBBBBnnK...",
"...KKnBBBBBBBBBBBnnNKKK.",
"...KNnnnnnnnnnbbbbbbbbK.",
]

# Лицо стажёра-мужчины: ухо и тёмные волосы сзади, глаза-чёрточки, приоткрытый рот

FACE_MALE = [
".....KsssssHFFFFFFHK....",
".....KsHHsHFFKFFFKFK....",
".....KsHhsFFFKFFFKFK....",
".....KssshFFFFFFFFFK....",
"......KssFFFFFKKFFHK....",
"......KshFFFFFxxFHK.....",
".......KhhHHHHHHHK......",
]

# Лицо стажёра-женщины: тёмные пряди у лица, глаза чуть выше, рот меньше

FACE_FEMALE = [
".....KsssssFFFFFFFsK....",
".....KssssFFFKFFFKsK....",
".....KsssHFFFKFFFKsK....",
".....KssshFFFKFFFKsK....",
"......KssFFFFFKKFFsK....",
"......KssFFFFFxxFsK.....",
".......KshHHHHHHHK......",
]

# Рыжий хвост героини с синей резинкой, рисуется позади головы. Строки — от верха каски.
# Рыжий из группы «Ржавчина» — исключение: это волосы героини, а не враг.

PONYTAIL = [""] * 10 + [
"...KK.",
"..KBBK",
".KOOCK",
"KO9OoK",
"KOOOoK",
"KoOorK",
".KoorK",
".KorK.",
"..KrK.",
"...K..",
]

# Туловище: руки опущены

TORSO = [
".......KBBNgDDgNBBK.....",
".....KbLBBNLLLLNBBBnK...",
".....KbBBnNBBBBNnBBnK...",
"....KHFHKnNBBBBNnKHFHK..",
"...KHFFHKnNBBBBNnKHFFHK.",
"...KHFHhKNNYNNYNNKHFHhK.",
"...KhHhhKnnnnnnnnKhHhhK.",
"....KKKKKnnnnnnnnKKKKK..",
]

# Туловище на бегу: передняя рука вперёд-вверх, задняя назад-вниз

TORSO_A = TORSO[:1] + [
".....KbLBBNLLLLNBBBBnK..",
".....KbBBnNBBBBNnBBKHFHK",
"....KbBBKnNBBBBNnK.KHHhK",
"...KHFHKKnNBBBBNnK..KKK.",
"..KHFFHKKNNYNNYNNK......",
"..KhHhhKKnnnnnnnnK......",
"...KKKKKKnnnnnnnnK......",
]

# Туловище на бегу: передняя рука назад-вниз, задняя вперёд-вверх

TORSO_C = TORSO[:3] + [
"...KHFHKKnNBBBBNnKBBnK..",
"..KHFFHKKnNBBBBNnKHFHK..",
"..KhHhhKKNNYNNYNNKHFFHK.",
"...KKKKKKnnnnnnnnKHFHhK.",
"........KnnnnnnnnKhHhhK.",
]

# Ноги: стоит

LEGS = [
"........KBnnnNBnnK......",
"........KBnnKKBnnK......",
"........KBnnKKBnnK......",
"........KNnnKKNnnK......",
"........K555KK555K......",
".......KwWXWKKwWXWWK....",
".......KwwWWKKwwWWWK....",
".......KKKKKKKKKKKKK....",
]

# Ноги: шаг

STRIDE = [
"........KBnnnNBnnK......",
".......KBnnKKKBnnnK.....",
"......KBnnK...KBnnK.....",
".....KBnnK.....KBnnK....",
"....KNnnK.......KNnnK...",
"...K555K.........K555K..",
"..KwWXWK.........KwWXWWK",
"..KKKKKK.........KKKKKKK",
]

# Ноги: пролёт, передняя нога поднята

PASS = [
"........KBnnnNBnnK......",
"........KBnnnNBnnnK.....",
"........KBnnKKBnnnK.....",
"........KBnnK.K555K.....",
"........KNnnK.KwWXWK....",
"........K555K.KKKKKK....",
".......KwWXWWK..........",
".......KKKKKKK..........",
]

# Ноги: прыжок, поджаты

TUCK = [
"........KBnnnNBnnK......",
".......KBnnnnnnnnnK.....",
"......KBnnKKKKKBnnK.....",
"......K555K....K555K....",
".....KwWXWK...KwWXWK....",
".....KKKKKK...KKKKKK....",
"........................",
"........................",
]


def up(frame, n=1):
    """Кадр выше на n пикселей — тело на пролёте при беге."""
    return frame[n:] + [BLANK] * n


def overlay(frame, patch, top):
    """Накладывает patch на кадр начиная со строки top; «.» в патче не перекрывает."""
    f = list(frame)
    for i, prow in enumerate(patch):
        r = top + i
        if 0 <= r < len(f):
            f[r] = "".join(p if p != "." else c for p, c in zip(prow.ljust(W, "."), f[r]))
    return f


def build(head, back=None):
    H = len(head)

    def with_back(frame, dy):
        return overlay(frame, back, dy) if back else frame

    def close_front_hand(frame):
        # В TORSO_C кисть передней руки уходит на строку ниже туловища — дорисовываем ей нижний контур
        r = H + len(TORSO)
        f = list(frame)
        f[r] = f[r][:18] + "KKKK" + f[r][22:]
        return f

    fr = {
        "idle0": with_back(head + TORSO + LEGS, 0),
        "idle1": with_back([BLANK] + head + TORSO[1:] + LEGS, 1),  # вдох: голова ниже на пиксель
        "runA": with_back(head + TORSO_A + STRIDE, 0),
        "runB": up(with_back(head + TORSO + PASS, 0)),
        "runC": with_back(close_front_hand(head + TORSO_C + STRIDE), 0),
        "runD": up(with_back(head + TORSO + PASS, 0)),
        "jump": with_back(head + TORSO_A + TUCK, 0),
        "fall": with_back(close_front_hand(head + TORSO_C + STRIDE), 0),
    }
    for name, f in fr.items():
        assert len(f) == 32, (name, len(f))
        for i, r in enumerate(f):
            assert len(r) == W, (name, i, r, len(r))
    return fr


def write(name, header, fr):
    out = header + ["size 24x32"]

    def anim(a, fps, loop, frames):
        out.append("")
        out.append(f"anim {a} {fps} {'loop' if loop else 'once'}")
        for f in frames:
            out.append("frame")
            out.extend(f)

    anim("idle", 3, True, [fr["idle0"], fr["idle1"]])
    anim("run", 10, True, [fr["runA"], fr["runB"], fr["runC"], fr["runD"]])
    anim("jump", 1, False, [fr["jump"]])
    anim("fall", 1, False, [fr["fall"]])
    path = os.path.join(ROOT, "art", "sprites", "player", name + ".txt")
    open(path, "w").write("\n".join(out) + "\n")
    print("✓", os.path.relpath(path, ROOT))


write("player_male", [
    "# Стажёр (мужчина). Кадр 24×32, опорная точка — низ по центру, смотрит вправо.",
    "# Физическое тело в игре — 16×32 по центру кадра; каска и руки выходят за него по бокам.",
    "# Собран из частей в tools/sprites/player_parts.py — правь там. Палитра и формат — docs/ART_BIBLE.md.",
], build(HELMET + FACE_MALE))

write("player_female", [
    "# Стажёр (женщина). Кадр 24×32, опорная точка — низ по центру, смотрит вправо.",
    "# Физическое тело в игре — 16×32 по центру кадра; каска, руки и хвост выходят за него по бокам.",
    "# Собрана из частей в tools/sprites/player_parts.py — правь там. Палитра и формат — docs/ART_BIBLE.md.",
], build(HELMET + FACE_FEMALE, PONYTAIL))
