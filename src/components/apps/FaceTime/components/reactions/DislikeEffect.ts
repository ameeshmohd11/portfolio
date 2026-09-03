export class DislikeParticleSystem {
  private originX: number;
  private originY: number;
  private width: number;
  private height: number;
  private startTime: number;
  private duration: number = 2800;
  private isDone: boolean = false;

  private drops: {
    x: number;
    y: number;
    speed: number;
    length: number;
    alpha: number;
  }[] = [];

  constructor(x: number, y: number, width: number, height: number) {
    this.width = width;
    this.height = height;
    this.originX = (x || 0.5) * width;
    this.originY = Math.max(60, (y || 0.3) * height - 80);
    this.startTime = performance.now();

    // Generate 35 raindrops
    for (let i = 0; i < 35; i++) {
      this.drops.push({
        x: this.originX + (Math.random() - 0.5) * 160,
        y: this.originY + (Math.random() - 0.5) * 20,
        speed: 6 + Math.random() * 8,
        length: 12 + Math.random() * 18,
        alpha: 0.8
      });
    }
  }

  public update(now: number): void {
    const elapsed = now - this.startTime;
    if (elapsed >= this.duration) {
      this.isDone = true;
      return;
    }

    this.drops.forEach((d) => {
      d.y += d.speed;
      if (d.y > this.height) {
        d.y = this.originY;
      }
      if (elapsed > 2000) {
        d.alpha = Math.max(0, 1 - (elapsed - 2000) / 800);
      }
    });
  }

  public draw(ctx: CanvasRenderingContext2D, now: number): void {
    const elapsed = now - this.startTime;
    const progress = Math.min(1, elapsed / this.duration);

    let alpha = 1;
    if (progress > 0.75) {
      alpha = 1 - (progress - 0.75) / 0.25;
    }

    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);

    // 1. Draw Storm Cloud Body near origin
    ctx.save();
    ctx.translate(this.originX, this.originY);

    ctx.fillStyle = "#1e293b";
    ctx.shadowColor = "rgba(15, 23, 42, 0.8)";
    ctx.shadowBlur = 20;

    ctx.beginPath();
    ctx.arc(-35, 0, 28, 0, Math.PI * 2);
    ctx.arc(0, -12, 34, 0, Math.PI * 2);
    ctx.arc(35, 0, 28, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();

    // 👎 Emoji in Cloud
    ctx.font = "32px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("👎", 0, -5);
    ctx.restore();

    // 2. Draw Raindrops
    this.drops.forEach((d) => {
      if (d.alpha <= 0) return;
      ctx.save();
      ctx.globalAlpha = Math.max(0, d.alpha * alpha);
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x, d.y + d.length);

      const gradient = ctx.createLinearGradient(d.x, d.y, d.x, d.y + d.length);
      gradient.addColorStop(0, "rgba(56, 189, 248, 0)");
      gradient.addColorStop(1, "rgba(56, 189, 248, 0.9)");

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
    });

    ctx.restore();
  }

  public isFinished(): boolean {
    return this.isDone;
  }
}
