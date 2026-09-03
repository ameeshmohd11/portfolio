export class FireworkParticleSystem {
  private width: number;
  private height: number;
  private startTime: number;
  private duration: number = 3200;
  private isDone: boolean = false;

  private rockets: {
    x: number;
    y: number;
    targetY: number;
    vx: number;
    vy: number;
    color: string;
    exploded: boolean;
  }[] = [];

  private sparks: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    alpha: number;
    life: number;
    maxLife: number;
  }[] = [];

  constructor(x: number, y: number, width: number, height: number) {
    this.width = width;
    this.height = height;
    this.startTime = performance.now();

    const originX = (x || 0.5) * width;
    const originY = (y || 0.5) * height;

    const colors = ["#fbbf24", "#f43f5e", "#38bdf8", "#a855f7", "#34d399", "#f97316"];

    // Launch 3 rockets positioned around participant video
    const positions = [
      { x: originX, y: originY - 120 },
      { x: Math.max(80, originX - 180), y: originY - 160 },
      { x: Math.min(width - 80, originX + 180), y: originY - 140 }
    ];

    positions.forEach((pos, i) => {
      this.rockets.push({
        x: pos.x,
        y: height + 20,
        targetY: pos.y,
        vx: (pos.x - originX) * 0.005,
        vy: -9 - Math.random() * 3,
        color: colors[i % colors.length],
        exploded: false
      });
    });
  }

  public update(now: number): void {
    const elapsed = now - this.startTime;
    if (elapsed >= this.duration) {
      this.isDone = true;
      return;
    }

    // Update rockets
    this.rockets.forEach((r) => {
      if (r.exploded) return;
      r.x += r.vx;
      r.y += r.vy;
      r.vy *= 0.98;

      if (r.y <= r.targetY || Math.abs(r.vy) < 1.5) {
        r.exploded = true;
        this.explodeRocket(r.x, r.y, r.color);
      }
    });

    // Update sparks
    this.sparks.forEach((s) => {
      s.life += 16;
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.08; // Gravity
      s.vx *= 0.96;
      s.vy *= 0.96;

      s.alpha = Math.max(0, 1 - s.life / s.maxLife);
    });
  }

  private explodeRocket(x: number, y: number, color: string): void {
    const colors = [color, "#ffffff", "#fef08a", "#f43f5e", "#60a5fa"];
    for (let i = 0; i < 70; i++) {
      const angle = (Math.PI * 2 * i) / 70 + (Math.random() - 0.5) * 0.2;
      const speed = 2 + Math.random() * 8;
      this.sparks.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 0,
        maxLife: 800 + Math.random() * 800
      });
    }
  }

  public draw(ctx: CanvasRenderingContext2D, now: number): void {
    ctx.save();

    // Draw Rocket Trails
    this.rockets.forEach((r) => {
      if (r.exploded) return;
      ctx.beginPath();
      ctx.arc(r.x, r.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = r.color;
      ctx.shadowColor = r.color;
      ctx.shadowBlur = 15;
      ctx.fill();
    });

    // Draw Explosion Sparks
    this.sparks.forEach((s) => {
      if (s.alpha <= 0) return;
      ctx.save();
      ctx.globalAlpha = s.alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.restore();
    });

    ctx.restore();
  }

  public isFinished(): boolean {
    return this.isDone;
  }
}
