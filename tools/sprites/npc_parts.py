# NPC пролога в тех же пропорциях, что и стажёр (кадр 24×32): голова 16 строк, туловище 8, ноги 8.
# Туловище и ноги — из частей героя (player_parts.py), перекрашенные; головы — свои.
#
# Запуск: python3 tools/sprites/npc_parts.py && npm run sprites
# Пишет art/sprites/npc/*.txt. Анимации: idle (дыхание), talk (рот открывается).

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from player_parts import FACE_MALE, FACE_FEMALE, TORSO, LEGS, overlay, W  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
BLANK = "." * W


def recolor(rows, mapping):
    return ["".join(mapping.get(ch, ch) for ch in r) for r in rows]


def check(rows, n):
    assert len(rows) == n, (len(rows), n)
    for r in rows:
        assert len(r) == W, (r, len(r))
    return rows


# Макушка с волосами (9 строк — на месте каски героя). «s» — цвет волос, перекрашивается.
HAIR_TOP = check([
    BLANK,
    BLANK,
    BLANK,
    "........KKKKKKK.........",
    "......KKsssssssKK.......",
    ".....KsssssssssssK......",
    ".....KssssssssssssK.....",
    ".....KsssssssssssssK....",
    ".....KssssssssHFFFFK....",
], 9)

# Лысина Деда с седым венчиком сзади
BALD_TOP = check([
    BLANK,
    BLANK,
    BLANK,
    "........KKKKKKK.........",
    "......KKHFFFFFFKK.......",
    ".....KhHFFFFFFFFFK......",
    ".....K44HFFFFFFFFHK.....",
    ".....K454HFFFFFFFHhK....",
    ".....K4544HFFFFFFFHK....",
], 9)

# Седые брови-очки и усы Деда — поверх лица (строки лица 0–6)
DED_PATCH = [
    "...........KKKK.KKKK....",
    "...........K5.K.K5.K....",
    "............KKK.KKK.....",
    "........................",
    "............556665......",
    "............5....5......",
    "........................",
]

TIE = [  # галстук поверх рубашки, строки туловища
    "...........xx...........",
    "...........xx...........",
    "...........xT...........",
    "...........xx...........",
    "...........cx...........",
]

GLASSES = [
    "...........KKKK.KKKK....",
    "...........K..KKK..K....",
    "...........KKKK.KKKK....",
]

TROUSERS = {"B": "2", "n": "1", "N": "D", "5": "1", "w": "K", "W": "D", "X": "1"}


def npc(hair, hair_color, face, shirt, patch=None, top_extra=None, glasses=False, tie=False):
    head = hair + recolor(face, {"s": hair_color})
    if patch:
        head = overlay(head, patch, len(hair))
    if glasses:
        head = overlay(head, GLASSES, len(hair) + 1)
    body = recolor(TORSO, shirt)
    if tie:
        body = overlay(body, TIE, 1)
    legs = recolor(LEGS, TROUSERS)
    idle0 = check(head + body + legs, 32)
    idle1 = check([BLANK] + head + body[1:] + legs, 32)
    talk = list(idle0)
    mouth = len(hair) + 5
    talk[mouth] = talk[mouth].replace("xx", "ss") if "xx" in talk[mouth] else talk[mouth]
    talk[mouth - 1] = talk[mouth - 1][:14] + "KK" + talk[mouth - 1][16:] if mouth - 1 >= 0 else talk[mouth - 1]
    return idle0, idle1, check(talk, 32)


def write(name, header, frames):
    idle0, idle1, talk = frames
    out = header + ["size 24x32", "", "anim idle 2 loop", "frame"] + idle0 + ["frame"] + idle1
    out += ["", "anim talk 6 loop", "frame"] + talk + ["frame"] + idle0
    path = os.path.join(ROOT, "art", "sprites", "npc", name + ".txt")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, "w").write("\n".join(out) + "\n")
    print("✓", os.path.relpath(path, ROOT))


# Дед Штангенциркуль — главный кладовщик: лысина с седым венчиком, очки, седые усы,
# серый рабочий халат, из нагрудного кармана торчит штангенциркуль.
DED_COAT = {"B": "3", "b": "4", "L": "5", "n": "2", "N": "1", "Y": "5", "g": "1", "D": "1"}
ded = npc(BALD_TOP, "4", FACE_MALE, DED_COAT, patch=DED_PATCH)
ded = tuple(overlay(f, ["..............5.", "..............5.", "..............55"], 16) for f in ded)

# Коллеги из офиса — собирательные образы (ТЗ, раздел 6: реальных сотрудников не рисуем)
WHITE_SHIRT = {"B": "6", "b": "6", "L": "6", "n": "5", "N": "4", "Y": "5", "g": "4", "D": "4"}
GREEN_CARDIGAN = {"B": "G", "b": "v", "L": "6", "n": "g", "N": "g", "Y": "V", "g": "g", "D": "g"}
TEAL_SWEATER = {"B": "t", "b": "e", "L": "e", "n": "A", "N": "a", "Y": "e", "g": "a", "D": "a"}

colleague_a = npc(HAIR_TOP, "s", FACE_MALE, WHITE_SHIRT, tie=True)
colleague_b = npc(HAIR_TOP, "w", FACE_FEMALE, GREEN_CARDIGAN)
colleague_c = npc(HAIR_TOP, "D", FACE_MALE, TEAL_SWEATER, glasses=True)

HEADER = "# Собран в tools/sprites/npc_parts.py из частей героя — правь там. Кадр 24×32, низ по центру, смотрит вправо."
write("ded", ["# Дед Штангенциркуль — наставник, главный кладовщик (ТЗ, раздел 2).", HEADER], ded)
write("colleague_a", ["# Коллега: белая рубашка с галстуком.", HEADER], colleague_a)
write("colleague_b", ["# Коллега: зелёный кардиган.", HEADER], colleague_b)
write("colleague_c", ["# Коллега: бирюзовый свитер, очки.", HEADER], colleague_c)
