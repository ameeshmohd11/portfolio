export class SparkleParticleSystem {
  private width: number;
  private height: number;
  private startTime: number;
  private duration: number = 2400;
  private isDone: boolean = false;

  private sparkles: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    rotation: number;
    vRot: number;
    alpha: number;
    life: number;
    maxLife: number;
  }[] = [];

  constructor(x: number, y: number, width: number, height: number) {
    this.width = width;
    this.height = height;
    this.startTime = performance.now();

    this.addSparklesAt((x || 0.5) * width, (y || 0.5) * height, 25);
  }

  public addSparklesAt(pixelX: number, pixelY: number, count: number = 5): void {
    const colors = ["#fef08a", "#60a5fa", "#38bdf8", "#f472b6", "#ffffff"];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 3.5;
      this.sparkles.push({
        x: pixelX + (Math.random() - 0.5) * 20,
        y: pixelY + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.5,
        size: 3 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 0.1,
        alpha: 1,
        life: 0,
        maxLife: 600 + Math.random() * 800
      });
    }
  }

  public update(now: number): void {
    const elapsed = now - this.startTime;
    if (elapsed >= this.duration && this.sparkles.length === 0) {
      this.isDone = true;
      return;
    }

    for (let i = this.sparkles.length - 1; i >= 0; i--) {
      const s = this.sparkles[i];
      s.life += 16;
      s.x += s.vx;
      s.y += s.vy;
      s.vx *= 0.96;
      s.vy *= 0.96;
      s.rotation += s.vRot;
      s.alpha = Math.max(0, 1 - s.life / s.maxLife);

      if (s.alpha <= 0) {
        this.sparkles.splice(i, 1);
      }
    }
  }

  public draw(ctx: CanvasRenderingContext2D, now: number): void {
    ctx.save();
    this.sparkles.forEach((s) => {
      if (s.alpha <= 0) return;
      ctx.save();
      ctx.globalAlpha = s.alpha;
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rotation);

      ctx.fillStyle = s.color;
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 12;

      // Draw 4-point star burst
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        ctx.lineTo(
          Math.cos((i * Math.PI) / 2) * s.size,
          Math.sin((i * Math.PI) / 2) * s.size
        );
        ctx.lineTo(
          Math.cos(((i + 0.5) * Math.PI) / 2) * (s.size * 0.35),
          Math.sin(((i + 0.5) * Math.PI) / 2) * (s.size * 0.35)
        );
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
    ctx.restore();
  }

  public isFinished(): boolean {
    return this.isDone && this.sparkles.length === 0;
  }
}
