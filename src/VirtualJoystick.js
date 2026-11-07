// Floating touch joystick: touch anywhere on the left half of the screen and drag.
// x/y are in the range -1..1.
export default class VirtualJoystick {
  constructor(scene, radius = 70) {
    this.scene = scene;
    this.radius = radius;
    this.pointer = null;
    this.x = 0;
    this.y = 0;

    this.base = scene.add.circle(0, 0, radius, 0xffffff, 0.15).setStrokeStyle(4, 0xffffff, 0.4);
    this.knob = scene.add.circle(0, 0, radius * 0.45, 0xffffff, 0.4);
    for (const o of [this.base, this.knob]) o.setScrollFactor(0).setDepth(1000).setVisible(false);

    scene.input.on('pointerdown', (p) => {
      if (this.pointer || p.x > scene.scale.width / 2) return;
      this.pointer = p;
      this.base.setPosition(p.x, p.y).setVisible(true);
      this.knob.setPosition(p.x, p.y).setVisible(true);
    });
    scene.input.on('pointermove', (p) => {
      if (p !== this.pointer) return;
      const dx = p.x - this.base.x;
      const dy = p.y - this.base.y;
      const dist = Math.min(Math.hypot(dx, dy), radius);
      const ang = Math.atan2(dy, dx);
      this.knob.setPosition(this.base.x + Math.cos(ang) * dist, this.base.y + Math.sin(ang) * dist);
      this.x = (Math.cos(ang) * dist) / radius;
      this.y = (Math.sin(ang) * dist) / radius;
    });
    const release = (p) => {
      if (p !== this.pointer) return;
      this.pointer = null;
      this.x = this.y = 0;
      this.base.setVisible(false);
      this.knob.setVisible(false);
    };
    scene.input.on('pointerup', release);
    scene.input.on('pointerupoutside', release);
  }

  get active() {
    return this.pointer !== null;
  }
}
