export class ConfettiParticleSystem {
  private originX: number;
  private originY: number;
  private width: number;
  private height: number;
  private startTime: number;
  private duration: number = 3200;
  private isDone: boolean = false;

  private particles: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    w: number;
    h: number;
    color: string;
    rotX: number;
    rotY: number;
    rotZ: number;
    vRotX: number;
    vRotY: number;
    vRotZ: number;
    alpha: number;
    shape: "ribbon" | "circle" | "star";
  }[] = [];

  constructor(x: number, y: number, width: number, height: number) {
    this.width = width;
    this.height = height;
    this.originX = (x || 0.5) * width;
    this.originY = (y || 0.5) * height;
    this.startTime = performance.now();

    const colors = [
      "#38bdf8", // Sky Blue
      "#34d399", // Emerald
      "#fbbf24", // Amber
      "#f43f5e", // Rose
      "#a855f7", // Purple
      "#ec4899", // Pink
      "#f97316" // Orange
    ];

    const shapes: ("ribbon" | "circle" | "star")[] = [
      "ribbon",
      "ribbon",
      "circle",
      "star"
    ];

    // Spawn 90 confetti particles in radial burst
    for (let i = 0; i < 90; i++) {
      const angle = (Math.PI * 2 * i) / 90 + (Math.random() - 0.5) * 0.5;
      const speed = 4 + Math.random() * 12;
      const shape = shapes[Math.floor(Math.random() * shapes.length)];

      this.particles.push({
        x: this.originX,
        y: this.originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4, // Initial upward pop
        w: shape === "ribbon" ? 10 + Math.random() * 8 : 8 + Math.random() * 6,
        h: shape === "ribbon" ? 16 + Math.random() * 12 : 8 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotX: Math.random() * Math.PI * 2,
        rotY: Math.random() * Math.PI * 2,
        rotZ: Math.random() * Math.PI * 2,
        vRotX: (Math.random() - 0.5) * 0.15,
        vRotY: (Math.random() - 0.5) * 0.15,
        vRotZ: (Math.random() - 0.5) * 0.1,
        alpha: 1,
        shape
      });
    }
  }

  public update(now: number): void {
    const elapsed = now - this.startTime;
    if (elapsed >= this.duration) {
      this.isDone = true;
      return;
    }

    this.particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.22; // Gravity
      p.vx *= 0.96; // Air resistance
      p.vy *= 0.98;

      p.rotX += p.vRotX;
      p.rotY += p.vRotY;
      p.rotZ += p.vRotZ;

      if (elapsed > 2000) {
        p.alpha = Math.max(0, 1 - (elapsed - 2000) / 1200);
      }
    });
  }

  public draw(ctx: CanvasRenderingContext2D, now: number): void {
    const elapsed = now - this.startTime;

    ctx.save();
    this.particles.forEach((p) => {
      if (p.alpha <= 0) return;

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);

      // 3D Flip Simulation
      const scaleX = Math.cos(p.rotX);
      const scaleY = Math.sin(p.rotY);
      ctx.scale(scaleX, scaleY);
      ctx.rotate(p.rotZ);

      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;

      if (p.shape === "circle") {
        ctx.beginPath();
        ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === "star") {
        this.drawStar(ctx, p.w / 2);
      } else {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }

      ctx.restore();
    });
    ctx.restore();
  }

  private drawStar(ctx: CanvasRenderingContext2D, r: number): void {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      ctx.lineTo(
        Math.cos((i * 4 * Math.PI) / 5) * r,
        Math.sin((i * 4 * Math.PI) / 5) * r
      );
    }
    ctx.closePath();
    ctx.fill();
  }

  public isFinished(): boolean {
    return this.isDone;
  }
}
