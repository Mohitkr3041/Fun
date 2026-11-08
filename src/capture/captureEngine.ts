
/**
 * Reel Recording & Postcard Screenshot Engine
 *
 * Records the stage canvas into a 1920x1080 output canvas,
 * preserving the source aspect ratio.
 *
 * Note: Upscaling a low-resolution source does not create
 * additional image detail.
 */

export interface CaptureCallbacks {
  onRecordingStart?: () => void;
  onRecordingStop?: (videoBlob: Blob, videoUrl: string) => void;
  onTimeUpdate?: (elapsedSeconds: number, maxSeconds: number) => void;
}

export class CaptureEngine {
  private canvas: HTMLCanvasElement;
  private recorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  private captureCanvas: HTMLCanvasElement | null = null;
  private captureContext: CanvasRenderingContext2D | null = null;
  private captureStream: MediaStream | null = null;

  private drawFrameId = 0;
  private isDrawing = false;

  public isRecording = false;

  private startTime = 0;
  private timerInterval = 0;

  private readonly MAX_DURATION_SEC = 90;

  private readonly OUTPUT_WIDTH = 1920;
  private readonly OUTPUT_HEIGHT = 1080;

  private readonly FRAME_RATE = 60;
  private readonly VIDEO_BITRATE = 16_000_000;

  private callbacks: CaptureCallbacks = {};

  public latestBlob: Blob | null = null;
  public latestVideoUrl: string | null = null;

  public selectedExtension = 'webm';

  constructor(canvas: HTMLCanvasElement, callbacks?: CaptureCallbacks) {
    this.canvas = canvas;

    if (callbacks) {
      this.callbacks = callbacks;
    }
  }

  public setCallbacks(callbacks: CaptureCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Creates a separate high-resolution recording canvas.
   */
  private createRecordingCanvas(): HTMLCanvasElement {
    const output = document.createElement('canvas');

    output.width = this.OUTPUT_WIDTH;
    output.height = this.OUTPUT_HEIGHT;

    this.captureCanvas = output;

    this.captureContext = output.getContext('2d', {
      alpha: false
    });

    if (!this.captureContext) {
      throw new Error(
        'Could not create the high-resolution recording canvas.'
      );
    }

    return output;
  }

  /**
   * Draws the live stage into the 1920x1080 canvas.
   * The original aspect ratio is preserved.
   */
  private drawRecordingFrame = (): void => {
    if (
      !this.isDrawing ||
      !this.captureContext ||
      !this.captureCanvas
    ) {
      return;
    }

    const ctx = this.captureContext;

    const sourceWidth = this.canvas.width;
    const sourceHeight = this.canvas.height;

    // Clear output with a black background.
    ctx.fillStyle = '#000000';

    ctx.fillRect(
      0,
      0,
      this.OUTPUT_WIDTH,
      this.OUTPUT_HEIGHT
    );

    if (sourceWidth > 0 && sourceHeight > 0) {
      const scale = Math.min(
        this.OUTPUT_WIDTH / sourceWidth,
        this.OUTPUT_HEIGHT / sourceHeight
      );

      const drawWidth = Math.round(sourceWidth * scale);
      const drawHeight = Math.round(sourceHeight * scale);

      // Center the source image.
      const x = Math.round(
        (this.OUTPUT_WIDTH - drawWidth) / 2
      );

      const y = Math.round(
        (this.OUTPUT_HEIGHT - drawHeight) / 2
      );

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(
        this.canvas,
        x,
        y,
        drawWidth,
        drawHeight
      );
    }

    this.drawFrameId = window.requestAnimationFrame(
      this.drawRecordingFrame
    );
  };

  /**
   * Selects a recording format supported by the browser.
   */
  private getRecorderOptions(): {
    options: MediaRecorderOptions;
    extension: string;
  } {
    const candidates: Array<{
      mime: string;
      extension: string;
    }> = [
      {
        mime: 'video/webm;codecs=vp9,opus',
        extension: 'webm'
      },
      {
        mime: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
        extension: 'mp4'
      },
      {
        mime: 'video/mp4;codecs=avc1',
        extension: 'mp4'
      },
      {
        mime: 'video/webm;codecs=vp8,opus',
        extension: 'webm'
      },
      {
        mime: 'video/webm',
        extension: 'webm'
      },
      {
        mime: 'video/mp4',
        extension: 'mp4'
      }
    ];

    const supported = candidates.find((candidate) =>
      MediaRecorder.isTypeSupported(candidate.mime)
    );

    if (supported) {
      return {
        options: {
          mimeType: supported.mime,
          videoBitsPerSecond: this.VIDEO_BITRATE,
          audioBitsPerSecond: 192_000
        },
        extension: supported.extension
      };
    }

    // Allow the browser to choose its default format.
    return {
      options: {
        videoBitsPerSecond: this.VIDEO_BITRATE,
        audioBitsPerSecond: 192_000
      },
      extension: 'webm'
    };
  }

  /**
   * Starts recording.
   */
  public startRecording(
    audioTrack: MediaStreamTrack | null
  ): boolean {
    if (this.isRecording) {
      return false;
    }

    let canvasVideoTrack: MediaStreamTrack | null = null;

    try {
      if (!this.canvas.width || !this.canvas.height) {
        throw new Error(
          'The stage canvas has no drawing dimensions.'
        );
      }

      // Create high-resolution recording canvas.
      const recordingCanvas = this.createRecordingCanvas();

      this.isDrawing = true;
      this.drawRecordingFrame();

      // Capture canvas at target FPS.
      const canvasStream = recordingCanvas.captureStream(
        this.FRAME_RATE
      );

      canvasVideoTrack =
        canvasStream.getVideoTracks()[0] ?? null;

      if (!canvasVideoTrack) {
        throw new Error(
          'The browser could not create a canvas video track.'
        );
      }

      // Combine video and audio.
      const combinedStream = new MediaStream([
        canvasVideoTrack
      ]);

      if (
        audioTrack &&
        audioTrack.readyState === 'live'
      ) {
        combinedStream.addTrack(audioTrack);
      }

      this.captureStream = combinedStream;

      // Choose supported recording format.
      const { options, extension } =
        this.getRecorderOptions();

      this.selectedExtension = extension;

      this.recorder = new MediaRecorder(
        combinedStream,
        options
      );

      // Match extension with the actual browser-selected MIME.
      if (this.recorder.mimeType.includes('mp4')) {
        this.selectedExtension = 'mp4';
      } else if (this.recorder.mimeType.includes('webm')) {
        this.selectedExtension = 'webm';
      }

      this.recordedChunks = [];

      // Collect recorded video chunks.
      this.recorder.ondataavailable = (
        event: BlobEvent
      ) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.recorder.onerror = (event: Event) => {
        console.error('MediaRecorder error:', event);
        this.stopRecording();
      };

      this.recorder.onstop = () => {
        this.finishRecording();
      };

      // Start recording.
      this.recorder.start(1000);

      this.isRecording = true;
      this.startTime = performance.now();

      this.callbacks.onRecordingStart?.();

      // Recording timer.
      this.timerInterval = window.setInterval(() => {
        if (!this.isRecording) return;

        const elapsed =
          (performance.now() - this.startTime) / 1000;

        this.callbacks.onTimeUpdate?.(
          elapsed,
          this.MAX_DURATION_SEC
        );

        if (elapsed >= this.MAX_DURATION_SEC) {
          this.stopRecording();
        }
      }, 200);

      return true;

    } catch (error) {
      this.isDrawing = false;

      if (this.drawFrameId) {
        window.cancelAnimationFrame(this.drawFrameId);
        this.drawFrameId = 0;
      }

      canvasVideoTrack?.stop();

      this.captureStream = null;
      this.captureCanvas = null;
      this.captureContext = null;

      console.error(
        'Failed to start MediaRecorder:',
        error
      );

      return false;
    }
  }

  /**
   * Stops recording.
   */
  public stopRecording(): void {
    if (!this.isRecording || !this.recorder) {
      return;
    }

    this.isRecording = false;
    this.isDrawing = false;

    window.clearInterval(this.timerInterval);

    if (this.drawFrameId) {
      window.cancelAnimationFrame(this.drawFrameId);
      this.drawFrameId = 0;
    }

    if (this.recorder.state !== 'inactive') {
      this.recorder.stop();
    }
  }

  /**
   * Finalizes the recording and creates a video URL.
   */
  private finishRecording(): void {
    const mimeType =
      this.recorder?.mimeType || 'video/webm';

    const blob = new Blob(this.recordedChunks, {
      type: mimeType
    });

    // Stop only the canvas video track.
    // Audio track is owned by the audio engine.
    this.captureStream
      ?.getVideoTracks()
      .forEach((track) => track.stop());

    this.captureStream = null;
    this.captureCanvas = null;
    this.captureContext = null;

    if (this.latestVideoUrl) {
      URL.revokeObjectURL(this.latestVideoUrl);
    }

    this.latestBlob = blob;

    this.latestVideoUrl = URL.createObjectURL(blob);

    this.callbacks.onRecordingStop?.(
      blob,
      this.latestVideoUrl
    );
  }

  /**
   * Downloads the latest recorded reel.
   */
  public downloadCurrentReel(filename?: string): void {
    if (!this.latestVideoUrl) {
      return;
    }

    const anchor = document.createElement('a');

    anchor.href = this.latestVideoUrl;

    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, 19);

    anchor.download =
      filename ||
      `Diwali-Fireworks-${timestamp}.${this.selectedExtension}`;

    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }

  /**
   * Captures a postcard screenshot.
   */
  public takeScreenshot(): void {
    const tempCanvas = document.createElement('canvas');

    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;

    const context = tempCanvas.getContext('2d');

    if (!context) {
      return;
    }

    context.drawImage(this.canvas, 0, 0);

    const padding = tempCanvas.width * 0.035;

    context.save();

    context.textAlign = 'right';

    context.fillStyle = '#FFD700';
    context.shadowColor = 'rgba(255, 215, 0, 0.8)';
    context.shadowBlur = 15;

    context.font =
      `bold ${Math.max(22, tempCanvas.width * 0.024)}px "Cinzel", serif`;

    context.fillText(
      '✨ Happy Diwali ✨',
      tempCanvas.width - padding,
      tempCanvas.height - padding - 18
    );

    context.fillStyle = '#E2E8F0';
    context.shadowBlur = 0;

    context.font =
      `${Math.max(12, tempCanvas.width * 0.012)}px "Plus Jakarta Sans", sans-serif`;

    context.fillText(
      'Fireworks Conductor 2026',
      tempCanvas.width - padding,
      tempCanvas.height - padding
    );

    context.restore();

    tempCanvas.toBlob((blob) => {
      if (!blob) {
        return;
      }

      const url = URL.createObjectURL(blob);

      const anchor = document.createElement('a');

      anchor.href = url;

      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, '-')
        .slice(0, 19);

      anchor.download =
        `Diwali-Postcard-${timestamp}.png`;

      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      window.setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 2000);

    }, 'image/png');
  }
}
