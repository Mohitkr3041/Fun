
/**
 * Video Compositor & Night-Sky Atmosphere Pipeline
 * Handles camera capture, mirroring, night-sky color grading,
 * and high-resolution stage rendering.
 *
 * Recording target:
 * - Up to 1920x1080
 * - Aspect ratio preserved
 * - High-quality canvas rendering
 * - Logical coordinates preserved for existing animations
 */

export interface CompositorOptions {
  canvas: HTMLCanvasElement;
  video: HTMLVideoElement;
  dimming?: number;
  contrast?: number;
}

export class VideoCompositor {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public video: HTMLVideoElement;

  // Logical screen dimensions used by existing animation code
  public width: number = window.innerWidth;
  public height: number = window.innerHeight;

  public isCameraReady: boolean = false;
  public dimming: number = 0.75;
  public contrast: number = 1.5;

  private stream: MediaStream | null = null;

  private readonly MAX_WIDTH = 1920;
  private readonly MAX_HEIGHT = 1080;

  constructor(options: CompositorOptions) {
    this.canvas = options.canvas;

    const ctx = this.canvas.getContext('2d', {
      alpha: false
    });

    if (!ctx) {
      throw new Error(
        'Could not acquire 2D rendering context from stage canvas'
      );
    }

    this.ctx = ctx;
    this.video = options.video;

    if (options.dimming !== undefined) {
      this.dimming = options.dimming;
    }

    if (options.contrast !== undefined) {
      this.contrast = options.contrast;
    }

    this.resize();

    window.addEventListener('resize', () => this.resize());
  }

  /**
   * Resize canvas backing resolution.
   * Upscales smaller displays and downscales larger displays.
   * Preserves aspect ratio and logical animation coordinates.
   */
  public resize(): void {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    const scale = Math.min(
      this.MAX_WIDTH / this.width,
      this.MAX_HEIGHT / this.height
    );

    // Actual canvas pixel resolution used by MediaRecorder
    this.canvas.width = Math.max(
      1,
      Math.round(this.width * scale)
    );

    this.canvas.height = Math.max(
      1,
      Math.round(this.height * scale)
    );

    // Map logical screen coordinates to actual canvas pixels
    this.ctx.setTransform(
      scale,
      0,
      0,
      scale,
      0,
      0
    );

    // Improve image scaling quality
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }

  /**
   * Start webcam capture at 1280×720 HD.
   * MediaPipe internally rescales to what it needs, so a higher-
   * resolution source improves both the live display and recording.
   * Falls back gracefully if the camera cannot deliver HD.
   */
  public async startCamera(): Promise<MediaStream> {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error(
        'Camera API (getUserMedia) unavailable in this browser'
      );
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width:  { ideal: 1280, min: 640 },
        height: { ideal: 720,  min: 480 },
        frameRate: { ideal: 30 },
        facingMode: 'user'
      },
      audio: false
    });

    this.stream = stream;
    this.video.srcObject = stream;

    await this.video.play();

    this.isCameraReady = true;

    return stream;
  }

  /**
   * Stop webcam and release camera resources.
   */
  public stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    this.video.srcObject = null;
    this.isCameraReady = false;
  }

  /**
   * Draw mirrored atmospheric night-sky webcam background.
   * Lighting is tuned for a bright, well-lit Diwali night atmosphere —
   * the same grading applies to both the live canvas and
   * anything captured from it by the recording engine.
   */
  public drawBackground(): void {
    const { ctx, width, height, video } = this;

    ctx.save();

    ctx.globalCompositeOperation = 'source-over';

    // 1. Deep midnight background (behind webcam)
    ctx.fillStyle = '#100303';
    ctx.fillRect(0, 0, width, height);

    // 2. Webcam background
    if (this.isCameraReady && video.videoWidth > 0) {
      ctx.save();

      // Mirror horizontally
      ctx.translate(width, 0);
      ctx.scale(-1, 1);

      // Aspect ratio cover calculation
      const videoRatio = video.videoWidth / video.videoHeight;
      const screenRatio = width / height;

      let drawW: number;
      let drawH: number;
      let drawX: number;
      let drawY: number;

      if (screenRatio > videoRatio) {
        drawW = width;
        drawH = width / videoRatio;
        drawX = 0;
        drawY = (height - drawH) / 2;
      } else {
        drawH = height;
        drawW = height * videoRatio;
        drawX = (width - drawW) / 2;
        drawY = 0;
      }

      // Brightness 1.0 = full camera exposure.
      // Contrast 1.22 = filmic separation. Saturate 1.05 = warm skin tones.
      ctx.filter = `
        brightness(${this.dimming})
        contrast(${this.contrast})
        saturate(1.05)
      `;

      ctx.drawImage(
        video,
        drawX,
        drawY,
        drawW,
        drawH
      );

      ctx.filter = 'none';

      // 1. Deep navy & dark purple night-sky perimeter tint
      const nightSkyGrad = ctx.createRadialGradient(
        width / 2,
        height * 0.45,
        Math.min(width, height) * 0.25,
        width / 2,
        height * 0.45,
        Math.max(width, height) * 0.8
      );

      nightSkyGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      nightSkyGrad.addColorStop(0.55, 'rgba(4, 10, 34, 0.12)');
      nightSkyGrad.addColorStop(1, 'rgba(28, 8, 48, 0.22)');

      ctx.fillStyle = nightSkyGrad;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = nightSkyGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Warm amber centre-glow — additive light reflection (simulating diya & firework illumination)
      ctx.globalCompositeOperation = 'lighter';
      const ambientGrad = ctx.createRadialGradient(
        width / 2, height * 0.55, 0,
        width / 2, height * 0.55, Math.max(width, height) * 0.58
      );
      ambientGrad.addColorStop(0,   'rgba(180, 80, 0, 0.08)');
      ambientGrad.addColorStop(0.5, 'rgba(90, 20, 60, 0.04)');
      ambientGrad.addColorStop(1,   'rgba(0, 0, 0, 0)');
      ctx.fillStyle = ambientGrad;
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'source-over';

      ctx.restore();
    }

    ctx.restore();

  }
}
