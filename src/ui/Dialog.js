// Talking box at the bottom of the screen. `await dialog.show(...)` waits for a tap / SPACE.
export default class Dialog {
  constructor(scene) {
    this.scene = scene;
    const { width: W, height: H } = scene.scale;
    this.W = W;

    const g = scene.add.graphics();
    g.fillStyle(0x1b1f3a, 0.93).fillRoundedRect(20, H - 190, W - 40, 170, 18);
    g.lineStyle(4, 0xffffff, 0.9).strokeRoundedRect(20, H - 190, W - 40, 170, 18);
    this.portrait = scene.add.image(95, H - 105, 'char-elin').setScale(1.9);
    this.nameText = scene.add.text(170, H - 175, '', { fontFamily: 'Arial Black, Arial', fontSize: '26px', color: '#ffd23f' });
    this.bodyText = scene.add.text(170, H - 136, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '27px',
      color: '#ffffff',
      wordWrap: { width: W - 230 },
      lineSpacing: 6,
    });
    this.hint = scene.add.text(W - 55, H - 50, '▼', { fontSize: '22px', color: '#ffffff' }).setOrigin(0.5);
    scene.tweens.add({ targets: this.hint, y: H - 42, duration: 400, yoyo: true, repeat: -1 });

    this.c = scene.add.container(0, 0, [g, this.portrait, this.nameText, this.bodyText, this.hint]);
    this.c.setScrollFactor(0, 0, true).setDepth(20000).setVisible(false);

    this.resolve = null;
    this.full = '';
    this.shown = 0;
    this.timer = null;

    scene.input.on('pointerdown', () => this.advance());
    scene.input.keyboard?.on('keydown-SPACE', () => this.advance());
    scene.input.keyboard?.on('keydown-ENTER', () => this.advance());
  }

  show(name, text, portraitKey, color = '#ffd23f') {
    return new Promise((resolve) => {
      this.c.setVisible(true);
      this.nameText.setText(name).setColor(color);
      const x = portraitKey ? 170 : 50;
      this.portrait.setVisible(!!portraitKey);
      if (portraitKey) this.portrait.setTexture(portraitKey);
      this.nameText.x = x;
      this.bodyText.x = x;
      this.bodyText.setWordWrapWidth(this.W - x - 60);
      this.full = text;
      this.shown = 0;
      this.bodyText.setText('');
      this.resolve = resolve;
      this.openedAt = this.scene.time.now;
      this.timer?.remove();
      this.timer = this.scene.time.addEvent({
        delay: 22,
        loop: true,
        callback: () => {
          this.shown++;
          this.bodyText.setText(this.full.slice(0, this.shown));
          if (this.shown >= this.full.length) this.timer.remove();
        },
      });
    });
  }

  advance() {
    if (!this.resolve || this.scene.time.now - this.openedAt < 250) return;
    if (this.shown < this.full.length) {
      this.shown = this.full.length;
      this.bodyText.setText(this.full);
      this.timer?.remove();
      return;
    }
    const r = this.resolve;
    this.resolve = null;
    this.c.setVisible(false);
    r();
  }
}
