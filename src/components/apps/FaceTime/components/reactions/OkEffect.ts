export class OkParticleSystem {
  private x: number;
  private y: number;
  private width: number;
  private height: number;
  private startTime: number;
  private duration: number = 2500;
  private isDone: boolean = false;

  constructor(x: number, y: number, width: number, height: number) {
    this.width = width;
    this.height = height;
    this.x = (x || 0.5) * width;
    this.y = (y || 0.5) * height;
    this.startTime = performance.now();
  }

  public update(now: number): void {
    if (now - this.startTime >= this.duration) {
      this.isDone = true;
    }
  }

  public draw(ctx: CanvasRenderingContext2D, now: number): void {
    const elapsed = now - this.startTime;
    const progress = Math.min(1, elapsed / this.duration);

    let alpha = 1;
    if (progress > 0.7) {
      alpha = 1 - (progress - 0.7) / 0.3;
    }

    const scale = 0.5 + progress * 0.8;
    const radius = 55 * scale;

    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.translate(this.x, this.y);

    // Glowing Gold Holographic Ring
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "#fbbf24";
    ctx.shadowColor = "#f59e0b";
    ctx.shadowBlur = 25;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Secondary inner cyan ring
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.75, 0, Math.PI * 2);
    ctx.strokeStyle = "#38bdf8";
    ctx.shadowColor = "#38bdf8";
    ctx.shadowBlur = 15;
    ctx.lineWidth = 2;
    ctx.stroke();

    // 👌 Badge
    ctx.font = "38px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("👌", 0, 0);

    ctx.restore();
  }

  public isFinished(): boolean {
    return this.isDone;
  }
}
