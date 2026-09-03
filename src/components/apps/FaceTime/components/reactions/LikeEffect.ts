export class LikeParticleSystem {
  private x: number;
  private y: number;
  private width: number;
  private height: number;
  private startTime: number;
  private duration: number = 2600; // ms
  private isDone: boolean = false;

  private particles: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    alpha: number;
    life: number;
    maxLife: number;
    rotation: number;
    vRot: number;
  }[] = [];

  constructor(x: number, y: number, width: number, height: number) {
    this.width = width;
    this.height = height;
    // Map normalized x, y (0..1) to canvas pixels
    this.x = (x || 0.5) * width;
    this.y = (y || 0.5) * height;
    this.startTime = performance.now();

    // Generate initial sparkle particles
    const colors = ["#38bdf8", "#60a5fa", "#93c5fd", "#fef08a", "#ffffff"];
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4.5;
      this.particles.push({
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        size: 3 + Math.random() * 7,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 0,
        maxLife: 800 + Math.random() * 1200,
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 0.1
      });
    }
  }

  public update(now: number): void {
    const elapsed = now - this.startTime;
    if (elapsed >= this.duration) {
      this.isDone = true;
      return;
    }

    // Update floating particle physics
    this.particles.forEach((p) => {
      p.life += 16;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.03; // gravity
      p.vx *= 0.98;
      p.rotation += p.vRot;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);
    });

    // Spawn subtle upward trailing sparkles while badge floats
    if (elapsed < 1800 && Math.random() < 0.4) {
      const currentBadgeY = this.y - (elapsed / this.duration) * 140;
      this.particles.push({
        x: this.x + (Math.random() - 0.5) * 40,
        y: currentBadgeY + 30,
        vx: (Math.random() - 0.5) * 1,
        vy: Math.random() * 1.5 + 0.5,
        size: 2 + Math.random() * 4,
        color: "#7dd3fc",
        alpha: 0.9,
        life: 0,
        maxLife: 600,
        rotation: 0,
        vRot: 0
      });
    }
  }

  public draw(ctx: CanvasRenderingContext2D, now: number): void {
    const elapsed = now - this.startTime;
    const progress = Math.min(1, elapsed / this.duration);

    // Easing calculations
    // Scale spring animation (0 -> 1.15 -> 1.0)
    let scale = 1;
    if (progress < 0.2) {
      scale = (progress / 0.2) * 1.15;
    } else if (progress < 0.35) {
      scale = 1.15 - ((progress - 0.2) / 0.15) * 0.15;
    }

    // Upward floating motion with subtle horizontal sine sway
    const badgeY = this.y - progress * 160;
    const badgeX = this.x + Math.sin(progress * Math.PI * 4) * 12;

    // Overall alpha fade out
    let alpha = 1;
    if (progress > 0.7) {
      alpha = 1 - (progress - 0.7) / 0.3;
    }

    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);

    // 1. Draw Sparkle Particles
    this.particles.forEach((p) => {
      if (p.alpha <= 0) return;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha * alpha);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;

      // Draw 4-point star
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        ctx.lineTo(
          Math.cos((i * Math.PI) / 2) * p.size,
          Math.sin((i * Math.PI) / 2) * p.size
        );
        ctx.lineTo(
          Math.cos(((i + 0.5) * Math.PI) / 2) * (p.size * 0.4),
          Math.sin(((i + 0.5) * Math.PI) / 2) * (p.size * 0.4)
        );
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });

    // 2. Draw 3D Frosted Glass Pill Badge
    ctx.save();
    ctx.translate(badgeX, badgeY);
    ctx.scale(scale, scale);

    // Glowing Aura Backdrop
    const auraGradient = ctx.createRadialGradient(0, 0, 10, 0, 0, 75);
    auraGradient.addColorStop(0, "rgba(56, 189, 248, 0.45)");
    auraGradient.addColorStop(0.6, "rgba(14, 165, 233, 0.2)");
    auraGradient.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.fillStyle = auraGradient;
    ctx.beginPath();
    ctx.arc(0, 0, 75, 0, Math.PI * 2);
    ctx.fill();

    // Main Badge Circle Body
    const circleRadius = 44;
    const bodyGradient = ctx.createLinearGradient(-30, -44, 30, 44);
    bodyGradient.addColorStop(0, "#0284c7");
    bodyGradient.addColorStop(0.5, "#38bdf8");
    bodyGradient.addColorStop(1, "#7dd3fc");

    ctx.beginPath();
    ctx.arc(0, 0, circleRadius, 0, Math.PI * 2);
    ctx.fillStyle = bodyGradient;
    ctx.shadowColor = "rgba(2, 132, 199, 0.6)";
    ctx.shadowBlur = 25;
    ctx.fill();

    // White Glass Border Ring
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Inner Highlight Arc
    ctx.beginPath();
    ctx.arc(0, 0, circleRadius - 4, -Math.PI * 0.7, -Math.PI * 0.1);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Render Animated 👍 Emoji
    ctx.font = "42px 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
    ctx.fillText("👍", 0, 2);

    ctx.restore();
    ctx.restore();
  }

  public isFinished(): boolean {
    return this.isDone;
  }
}
