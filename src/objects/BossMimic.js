import { FONT } from '../config.js';
import { playFx } from '../gfx/fx.js';
import { audio } from '../audio/audio.js';

// Босс Склада — Ящик-мимик «Разное» (ТЗ, раздел 4). Притворяется коробкой, прыгает к герою,
// открывает пасть и плюётся пересортом: гайками, болтами, шайбами, саморезами.
// Плюнул — устал, язык наружу: тут его и бить (прыжком сверху или E). По закрытой крышке — только «клац».
// Три удара — разобран. Время считаем по delta кадров: на паузе босс тоже стоит.
export const MIMIC = {
  hp: 3,
  hopVy: 330,
  hopVx: 95, // + 25 за каждый полученный удар — злится
  idleTime: 1100,
  peekTime: 500,
  spitGap: 240,
  tiredTime: 2100,
  hurtTime: 750,
  bodyWidth: 52,
  bodyHeight: 40,
  boltsPerHit: 3,
  boltsOnDefeat: 10,
};

const FASTENER_FRAMES = ['nut', 'bolt', 'washer', 'screw'];

export default class BossMimic {
  constructor(scene, x, groundY, minX, maxX) {
    this.scene = scene;
    this.minX = minX;
    this.maxX = maxX;
    this.homeX = x;
    this.hp = MIMIC.hp;
    this.state = 'sleep'; // sleep → idle ⇄ hop → peek → open → tired → idle … hurt … defeated
    this.t = 0;
    this.hopsLeft = 1;
    this.spitsLeft = 0;

    this.sprite = scene.add.sprite(x, groundY, 'mimic').setOrigin(0.5, 1).setDepth(5);
    this.sprite.play('mimic:closed');
    scene.physics.add.existing(this.sprite);
    const body = this.sprite.body;
    body.setSize(MIMIC.bodyWidth, MIMIC.bodyHeight);
    body.setOffset((64 - MIMIC.bodyWidth) / 2, 56 - MIMIC.bodyHeight);
    body.setMaxVelocity(400, 600);

    // Надпись на наклейке — текстом игры, не в картинке
    this.label = scene.add
      .text(x, groundY - 16, 'РАЗНОЕ', { fontFamily: FONT.family, fontSize: FONT.body, color: '#16181c' })
      .setOrigin(0.5)
      .setDepth(6);

    this.projectiles = scene.physics.add.group({ allowGravity: true });
  }

  get angry() {
    return MIMIC.hp - this.hp;
  }

  // Бить можно, пока пасть открыта
  get vulnerable() {
    return this.state === 'open' || this.state === 'tired';
  }

  get alive() {
    return this.state !== 'defeated';
  }

  wake() {
    if (this.state !== 'sleep') return;
    this.setState('peek', 900);
  }

  setState(state, t = 0) {
    this.state = state;
    this.t = t;
    const anim = { sleep: 'closed', idle: 'closed', hop: 'closed', peek: 'peek', open: 'open', tired: 'tired', hurt: 'hurt', defeated: 'folded' }[state];
    this.sprite.play(`mimic:${anim}`, true);
  }

  update(delta, player) {
    const { sprite } = this;
    const body = sprite.body;
    // Наклейка едет с коробом; у разобранного — прячется
    this.label.setPosition(sprite.x, sprite.y - 16 * sprite.scaleY).setScale(1, sprite.scaleY);
    this.label.setVisible(this.state !== 'defeated');

    // Снаряды, упавшие на пол или улетевшие за край, исчезают
    this.projectiles.getChildren().forEach((p) => {
      if (p.y > 260 || p.x < -20 || p.x > this.scene.physics.world.bounds.width + 20) p.destroy();
    });

    if (this.state === 'sleep' || this.state === 'defeated') return;
    this.t -= delta;
    const onGround = body.blocked.down;
    if (onGround && this.state !== 'hop') body.setVelocityX(0);

    switch (this.state) {
      case 'idle':
        if (this.t <= 0) {
          if (this.hopsLeft > 0) this.hop(player);
          else this.setState('peek', MIMIC.peekTime);
        }
        break;
      case 'hop':
        if (onGround && this.t <= 0) this.land();
        break;
      case 'peek':
        if (this.t <= 0) {
          this.spitsLeft = 3 + this.angry;
          this.setState('open', 250);
        }
        break;
      case 'open':
        if (this.t <= 0) {
          if (this.spitsLeft > 0) {
            this.spit(player);
            this.spitsLeft -= 1;
            this.t = MIMIC.spitGap;
          } else this.setState('tired', MIMIC.tiredTime);
        }
        break;
      case 'tired':
        if (this.t <= 0) {
          audio.play('lidClank');
          this.hopsLeft = 1 + Math.min(this.angry, 2);
          this.setState('idle', MIMIC.idleTime - this.angry * 200);
        }
        break;
      case 'hurt':
        if (this.t <= 0) {
          if (this.hp <= 0) this.defeat();
          else {
            this.hopsLeft = 2;
            this.setState('idle', 400);
          }
        }
        break;
    }
  }

  hop(player) {
    let dir = Math.sign(player.x - this.sprite.x) || 1;
    // Не выпрыгивать за пределы арены
    if ((dir > 0 && this.sprite.x > this.maxX - 40) || (dir < 0 && this.sprite.x < this.minX + 40)) dir = -dir;
    this.sprite.body.setVelocity(dir * (MIMIC.hopVx + this.angry * 25), -MIMIC.hopVy);
    this.hopsLeft -= 1;
    this.setState('hop', 150); // 150 мс — успеть оторваться от пола, прежде чем ждать приземления
    // Сжимается перед прыжком и вытягивается в полёте
    this.scene.tweens.add({ targets: this.sprite, scaleY: 1.12, duration: 120, yoyo: true });
  }

  land() {
    this.sprite.body.setVelocityX(0);
    this.sprite.x = Math.max(this.minX, Math.min(this.maxX, this.sprite.x));
    this.scene.cameras.main.shake(120, 0.007);
    audio.play('bump');
    playFx(this.scene, this.sprite.x - 22, this.sprite.y - 4, 'dust', 'land');
    playFx(this.scene, this.sprite.x + 22, this.sprite.y - 4, 'dust', 'land');
    this.scene.tweens.add({ targets: this.sprite, scaleY: 0.86, duration: 90, yoyo: true });
    this.setState('idle', 380);
  }

  // Плевок: крепёж летит дугой в сторону героя, с разбросом
  spit(player) {
    const { scene, sprite } = this;
    const frame = FASTENER_FRAMES[Math.floor(Math.random() * FASTENER_FRAMES.length)];
    const p = this.projectiles.create(sprite.x, sprite.y - 36, 'fasteners', frameIndex(scene, frame));
    p.body.setSize(6, 6);
    const dx = player.x - sprite.x;
    const vx = Math.max(-230, Math.min(230, dx / 0.95)) + (Math.random() * 80 - 40);
    p.body.setVelocity(vx, -250 - Math.random() * 90);
    p.body.setAngularVelocity(vx > 0 ? 540 : -540);
    p.setDepth(7);
    audio.play('spit');
  }

  // Прыжок на закрытую крышку — «клац», вреда никому
  clank() {
    audio.play('lidClank');
    this.scene.tweens.add({ targets: this.sprite, scaleY: 0.92, duration: 70, yoyo: true });
  }

  hit() {
    if (!this.vulnerable) return false;
    this.hp -= 1;
    audio.play('bossHit');
    this.scene.cameras.main.shake(160, 0.01);
    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(90, () => this.sprite.clearTint());
    playFx(this.scene, this.sprite.x, this.sprite.y - 40, 'spark', 'hit');
    this.setState('hurt', MIMIC.hurtTime);
    return true;
  }

  defeat() {
    const { scene, sprite } = this;
    this.setState('defeated');
    sprite.body.setVelocity(0, 0);
    sprite.body.enable = false;
    this.clearProjectiles();
    audio.play('bossDown');
    scene.cameras.main.shake(400, 0.012);
    // Весь пересорт разлетается — и больше не мешает
    for (let i = 0; i < 12; i++) {
      const frame = FASTENER_FRAMES[i % FASTENER_FRAMES.length];
      const f = scene.add.image(sprite.x, sprite.y - 30, 'fasteners', frameIndex(scene, frame)).setDepth(50);
      const a = (Math.PI * 2 * i) / 12;
      scene.tweens.add({
        targets: f,
        x: f.x + Math.cos(a) * 70,
        y: f.y + Math.sin(a) * 50 - 20,
        angle: 360,
        alpha: 0,
        duration: 700,
        ease: 'Quad.easeOut',
        onComplete: () => f.destroy(),
      });
    }
  }

  // После смерти героя — пол чистый, а ящик отходит от места появления
  resetAfterRespawn(spawnX) {
    this.clearProjectiles();
    if (!this.alive || this.state === 'sleep') return;
    if (Math.abs(this.sprite.x - spawnX) < 140) this.sprite.x = this.homeX;
    this.sprite.body.setVelocity(0, 0);
    this.hopsLeft = 1;
    this.setState('idle', 1500);
  }

  clearProjectiles() {
    this.projectiles.clear(true, true);
  }
}

function frameIndex(scene, name) {
  return scene.cache.json.get('fasteners_meta').animations[name].frames[0];
}
