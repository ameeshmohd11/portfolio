export class BalloonParticleSystem {
  private originX: number;
  private originY: number;
  private width: number;
  private height: number;
  private startTime: number;
  private duration: number = 3600;
  private isDone: boolean = false;

  private balloons: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    color: string;
    lightColor: string;
    rotation: number;
    vRot: number;
    swayFreq: number;
    swayAmp: number;
    stringLength: number;
    alpha: number;
  }[] = [];

  constructor(x: number, y: number, width: number, height: number) {
    this.width = width;
    this.height = height;
    this.originX = (x || 0.5) * width;
    this.originY = height + 40; // Start below screen bottom
    this.startTime = performance.now();

    const colorPairs = [
      { main: "#f43f5e", light: "#ffe4e6" }, // Rose
      { main: "#38bdf8", light: "#e0f2fe" }, // Sky
      { main: "#fbbf24", light: "#fef3c7" }, // Gold
      { main: "#a855f7", light: "#f3e8ff" }, // Violet
      { main: "#34d399", light: "#d1fae5" }, // Mint
      { main: "#f97316", light: "#ffedd5" } // Orange
    ];

    // Spawn 7 large glossy balloons spread across bottom
    for (let i = 0; i < 7; i++) {
      const pair = colorPairs[i % colorPairs.length];
      const radius = 38 + Math.random() * 22;
      const xOffset = ((i - 3) / 3) * (width * 0.35) + (Math.random() - 0.5) * 60;

      this.balloons.push({
        x: this.originX + xOffset,
        y: this.originY + Math.random() * 80,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -(2.2 + Math.random() * 1.5),
        radius,
        color: pair.main,
        lightColor: pair.light,
        rotation: (Math.random() - 0.5) * 0.2,
        vRot: (Math.random() - 0.5) * 0.005,
        swayFreq: 0.002 + Math.random() * 0.003,
        swayAmp: 18 + Math.random() * 20,
        stringLength: radius * 2.8,
        alpha: 1
      });
    }
  }

  public update(now: number): void {
    const elapsed = now - this.startTime;
    if (elapsed >= this.duration) {
      this.isDone = true;
      return;
    }

    this.balloons.forEach((b) => {
      b.y += b.vy;
      b.x += b.vx + Math.sin(elapsed * b.swayFreq) * 0.8;
      b.rotation += b.vRot;

      if (b.y < -b.radius * 3) {
        b.alpha = 0;
      } else if (elapsed > 2600) {
        b.alpha = Math.max(0, 1 - (elapsed - 2600) / 1000);
      }
    });
  }

  public draw(ctx: CanvasRenderingContext2D, now: number): void {
    const elapsed = now - this.startTime;

    ctx.save();
    this.balloons.forEach((b) => {
      if (b.alpha <= 0) return;

      ctx.save();
      ctx.globalAlpha = b.alpha;
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rotation);

      // 1. Draw Dangling Swaying Balloon String
      ctx.beginPath();
      ctx.moveTo(0, b.radius);
      const stringSway = Math.sin(elapsed * 0.004 + b.x) * 15;
      ctx.quadraticCurveTo(
        stringSway,
        b.radius + b.stringLength * 0.5,
        stringSway * 0.5,
        b.radius + b.stringLength
      );
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // 2. Draw Balloon Knot
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.moveTo(-5, b.radius);
      ctx.lineTo(5, b.radius);
      ctx.lineTo(0, b.radius + 8);
      ctx.closePath();
      ctx.fill();

      // 3. Draw 3D Glossy Balloon Body
      const gradient = ctx.createRadialGradient(
        -b.radius * 0.35,
        -b.radius * 0.35,
        b.radius * 0.1,
        0,
        0,
        b.radius * 1.1
      );
      gradient.addColorStop(0, "#ffffff");
      gradient.addColorStop(0.25, b.lightColor);
      gradient.addColorStop(0.65, b.color);
      gradient.addColorStop(1, "rgba(0, 0, 0, 0.4)");

      ctx.beginPath();
      // Elliptical teardrop shape
      ctx.ellipse(0, 0, b.radius * 0.88, b.radius * 1.08, 0, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 15;
      ctx.fill();

      // Specular Reflection Highlight
      ctx.beginPath();
      ctx.ellipse(
        -b.radius * 0.4,
        -b.radius * 0.45,
        b.radius * 0.22,
        b.radius * 0.35,
        -Math.PI / 4,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.fill();

      ctx.restore();
    });
    ctx.restore();
  }

  public isFinished(): boolean {
    return this.isDone;
  }
}
