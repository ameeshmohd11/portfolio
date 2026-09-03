export class HeartParticleSystem {
  private originX: number;
  private originY: number;
  private width: number;
  private height: number;
  private startTime: number;
  private duration: number = 3000;
  private isDone: boolean = false;

  private hearts: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    scale: number;
    rotation: number;
    vRot: number;
    alpha: number;
    delay: number;
    color: string;
    swayFreq: number;
    swayAmp: number;
  }[] = [];

  constructor(x: number, y: number, width: number, height: number) {
    this.width = width;
    this.height = height;
    this.originX = (x || 0.5) * width;
    this.originY = (y || 0.5) * height;
    this.startTime = performance.now();

    const colors = [
      "#f43f5e", // Rose
      "#ec4899", // Pink
      "#e11d48", // Crimson
      "#fb7185", // Light Pink
      "#d946ef" // Fuchsia
    ];

    // Main Swarm of 18 Hearts
    for (let i = 0; i < 18; i++) {
      const isMain = i === 0;
      this.hearts.push({
        x: this.originX + (Math.random() - 0.5) * 80,
        y: this.originY + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -(1.8 + Math.random() * 2.2),
        size: isMain ? 48 : 22 + Math.random() * 26,
        scale: 0,
        rotation: (Math.random() - 0.5) * 0.4,
        vRot: (Math.random() - 0.5) * 0.02,
        alpha: 1,
        delay: i * 80,
        color: colors[i % colors.length],
        swayFreq: 0.003 + Math.random() * 0.004,
        swayAmp: 15 + Math.random() * 25
      });
    }
  }

  public update(now: number): void {
    const elapsed = now - this.startTime;
    if (elapsed >= this.duration) {
      this.isDone = true;
      return;
    }

    this.hearts.forEach((h) => {
      if (elapsed < h.delay) return;
      const t = elapsed - h.delay;

      // Floating physics
      h.y += h.vy;
      h.x += h.vx + Math.sin(t * h.swayFreq) * 0.6;
      h.rotation += h.vRot;

      // Scale pop-in
      if (t < 250) {
        h.scale = (t / 250) * 1.1;
      } else if (t < 400) {
        h.scale = 1.1 - ((t - 250) / 150) * 0.1;
      } else {
        h.scale = 1.0;
      }

      // Alpha fade out
      if (t > 1800) {
        h.alpha = Math.max(0, 1 - (t - 1800) / 1000);
      }
    });
  }

  public draw(ctx: CanvasRenderingContext2D, now: number): void {
    const elapsed = now - this.startTime;

    ctx.save();
    this.hearts.forEach((h) => {
      if (elapsed < h.delay || h.alpha <= 0) return;

      ctx.save();
      ctx.globalAlpha = h.alpha;
      ctx.translate(h.x, h.y);
      ctx.rotate(h.rotation);
      ctx.scale(h.scale, h.scale);

      // Heart Shadow & Glow
      ctx.shadowColor = h.color;
      ctx.shadowBlur = 20;

      // Draw Vector Smooth 3D Heart
      this.drawHeartPath(ctx, h.size, h.color);

      ctx.restore();
    });
    ctx.restore();
  }

  private drawHeartPath(
    ctx: CanvasRenderingContext2D,
    size: number,
    color: string
  ): void {
    const s = size / 30;
    ctx.beginPath();
    ctx.moveTo(0 * s, 10 * s);
    ctx.bezierCurveTo(-15 * s, -10 * s, -30 * s, 5 * s, 0 * s, 25 * s);
    ctx.bezierCurveTo(30 * s, 5 * s, 15 * s, -10 * s, 0 * s, 10 * s);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, -10 * s, 0, 25 * s);
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(0.3, color);
    gradient.addColorStop(1, "#9f1239");

    ctx.fillStyle = gradient;
    ctx.fill();

    // Specular Highlight
    ctx.beginPath();
    ctx.arc(-6 * s, 2 * s, 3 * s, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.fill();
  }

  public isFinished(): boolean {
    return this.isDone;
  }
}
