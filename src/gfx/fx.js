// Короткие эффекты: спрайт проигрывает анимацию один раз и исчезает.
// Эффекты не мешают игре: без физики, поверх объектов уровня, но под интерфейсом.

export function playFx(scene, x, y, sheet, anim) {
  const fx = scene.add.sprite(x, y, sheet).setDepth(50);
  fx.once('animationcomplete', () => fx.destroy());
  fx.play(`${sheet}:${anim}`);
  return fx;
}
