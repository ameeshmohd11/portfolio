import { signalingService } from "./signaling";

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" },
    { urls: "stun:relay.metered.ca:80" }
  ],
  iceCandidatePoolSize: 10
};

export type RemoteStreamCallback = (stream: MediaStream) => void;
export type ConnectionStateChangeCallback = (state: RTCPeerConnectionState) => void;

class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private targetUserId: string | null = null;

  private pendingCandidates: RTCIceCandidateInit[] = [];
  private remoteDescriptionSet = false;

  private onRemoteStreamCallback: RemoteStreamCallback | null = null;
  private onConnectionStateCallback: ConnectionStateChangeCallback | null = null;

  public setRemoteStreamCallback(cb: RemoteStreamCallback | null) {
    this.onRemoteStreamCallback = cb;
  }

  public setConnectionStateCallback(cb: ConnectionStateChangeCallback | null) {
    this.onConnectionStateCallback = cb;
  }

  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  public getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  public getScreenStream(): MediaStream | null {
    return this.screenStream;
  }

  // Helper to create a synthetic silent audio track using Web Audio API
  private createSilentAudioTrack(): MediaStreamTrack | null {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return null;
      const ctx = new AudioCtx();
      const oscillator = ctx.createOscillator();
      const dst = ctx.createMediaStreamDestination();
      const gain = ctx.createGain();
      gain.gain.value = 0; // Silent
      oscillator.connect(gain);
      gain.connect(dst);
      oscillator.start();
      return dst.stream.getAudioTracks()[0] || null;
    } catch (e) {
      console.warn("Could not create Web Audio silent track:", e);
      return null;
    }
  }

  // Helper to create a synthetic canvas video track
  private createCanvasVideoTrack(label = "Simulated Camera"): MediaStreamTrack {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext("2d");

    let hue = 180;
    const draw = () => {
      if (!ctx) return;
      ctx.fillStyle = `hsl(${hue}, 45%, 15%)`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.font =
        "bold 24px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(label, canvas.width / 2, canvas.height / 2 - 15);

      ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
      ctx.font = "14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText("Connected", canvas.width / 2, canvas.height / 2 + 20);

      hue = (hue + 0.5) % 360;
    };

    draw();
    const interval = setInterval(draw, 100);

    const stream = canvas.captureStream(15);
    const track = stream.getVideoTracks()[0];
    track.addEventListener("ended", () => clearInterval(interval));
    return track;
  }

  // Capture user's webcam and mic stream with multi-level resilient fallback
  public async getLocalMedia(video = true, audio = true): Promise<MediaStream> {
    if (
      this.localStream &&
      this.localStream.active &&
      this.localStream.getTracks().length > 0
    ) {
      return this.localStream;
    }

    const hasMediaDevices =
      typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

    if (hasMediaDevices) {
      // 1. Try requested Video and Audio
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: video
            ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" }
            : false,
          audio: audio
            ? { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
            : false
        });
        this.localStream = stream;
        return stream;
      } catch (err1: any) {
        console.warn("[WebRTC] Primary getUserMedia failed:", err1.message || err1);

        // 2. Try Video-only if audio device failed
        if (video) {
          try {
            const videoOnly = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false
            });
            const silentTrack = this.createSilentAudioTrack();
            if (silentTrack) videoOnly.addTrack(silentTrack);
            this.localStream = videoOnly;
            return videoOnly;
          } catch (err2: any) {
            console.warn(
              "[WebRTC] Video-only getUserMedia failed:",
              err2.message || err2
            );
          }
        }

        // 3. Try Audio-only if video device failed
        if (audio) {
          try {
            const audioOnly = await navigator.mediaDevices.getUserMedia({
              video: false,
              audio: true
            });
            const canvasTrack = this.createCanvasVideoTrack("FaceTime Audio");
            if (canvasTrack) audioOnly.addTrack(canvasTrack);
            this.localStream = audioOnly;
            return audioOnly;
          } catch (err3: any) {
            console.warn(
              "[WebRTC] Audio-only getUserMedia failed:",
              err3.message || err3
            );
          }
        }
      }
    }

    // 4. Fallback synthetic stream (e.g. simulated camera for testing or permission restricted environments)
    console.info("[WebRTC] Using synthetic media stream");
    const syntheticStream = new MediaStream();
    const canvasTrack = this.createCanvasVideoTrack("FaceTime Camera");
    const silentTrack = this.createSilentAudioTrack();
    if (canvasTrack) syntheticStream.addTrack(canvasTrack);
    if (silentTrack) syntheticStream.addTrack(silentTrack);

    this.localStream = syntheticStream;
    return syntheticStream;
  }

  // Initialize RTCPeerConnection
  public initializePeerConnection(targetUserId: string): RTCPeerConnection {
    if (this.peerConnection) {
      try {
        this.peerConnection.close();
      } catch (e) {}
      this.peerConnection = null;
    }

    this.targetUserId = targetUserId;
    this.remoteDescriptionSet = false;
    this.pendingCandidates = [];
    this.remoteStream = new MediaStream();

    const pc = new RTCPeerConnection(RTC_CONFIG);
    this.peerConnection = pc;

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && this.targetUserId) {
        signalingService.sendIceCandidate(this.targetUserId, event.candidate.toJSON());
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] Connection state: ${pc.connectionState}`);
      if (this.onConnectionStateCallback) {
        this.onConnectionStateCallback(pc.connectionState);
      }
    };

    // Handle incoming remote media tracks
    pc.ontrack = (event) => {
      console.log("[WebRTC] Received remote track:", event.track.kind, event.track.id);

      if (!this.remoteStream) {
        this.remoteStream = new MediaStream();
      }

      // If track with same kind exists, remove old track first
      const existing = this.remoteStream.getTracks().find((t) => t.id === event.track.id);
      if (!existing) {
        this.remoteStream.addTrack(event.track);
      }

      // Re-emit remote stream copy to trigger React reactivity
      if (this.onRemoteStreamCallback) {
        this.onRemoteStreamCallback(new MediaStream(this.remoteStream.getTracks()));
      }

      // Listen for unmute/mute events
      event.track.onunmute = () => {
        console.log("[WebRTC] Remote track unmuted:", event.track.kind);
        if (this.onRemoteStreamCallback && this.remoteStream) {
          this.onRemoteStreamCallback(new MediaStream(this.remoteStream.getTracks()));
        }
      };
    };

    // Add local tracks to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    return pc;
  }

  // Caller creates and sends an SDP Offer
  public async createAndSendOffer(
    targetUserId: string
  ): Promise<RTCSessionDescriptionInit> {
    // Ensure local stream is ready
    if (!this.localStream || this.localStream.getTracks().length === 0) {
      await this.getLocalMedia(true, true);
    }

    const pc = this.initializePeerConnection(targetUserId);

    const offer = await pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    });
    await pc.setLocalDescription(offer);

    signalingService.sendOffer(targetUserId, offer);
    return offer;
  }

  // Receiver processes offer and responds with SDP Answer
  public async handleOfferAndSendAnswer(
    fromUserId: string,
    offer: RTCSessionDescriptionInit
  ): Promise<RTCSessionDescriptionInit> {
    // Ensure local media is ready before initializing peer connection
    if (!this.localStream || this.localStream.getTracks().length === 0) {
      await this.getLocalMedia(true, true);
    }

    const pc = this.initializePeerConnection(fromUserId);

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    this.remoteDescriptionSet = true;
    await this.processPendingCandidates();

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    signalingService.sendAnswer(fromUserId, answer);
    return answer;
  }

  // Caller receives and sets SDP Answer
  public async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      console.warn("[WebRTC] Cannot handle answer: peer connection is null");
      return;
    }
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    this.remoteDescriptionSet = true;
    await this.processPendingCandidates();
  }

  // Process incoming ICE Candidate
  public async addIceCandidate(candidateInit: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection || !this.remoteDescriptionSet) {
      this.pendingCandidates.push(candidateInit);
      return;
    }
    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidateInit));
    } catch (e) {
      console.warn("[WebRTC] Error adding ICE candidate:", e);
    }
  }

  private async processPendingCandidates() {
    if (!this.peerConnection || !this.remoteDescriptionSet) return;
    while (this.pendingCandidates.length > 0) {
      const cand = this.pendingCandidates.shift();
      if (cand) {
        try {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(cand));
        } catch (e) {
          console.warn("[WebRTC] Error adding queued ICE candidate:", e);
        }
      }
    }
  }

  // Toggle Screen Sharing
  public async startScreenShare(onEndedCallback?: () => void): Promise<MediaStream> {
    if (!this.peerConnection) throw new Error("No active peer connection");

    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        cursor: "always",
        displaySurface: "monitor"
      } as any,
      audio: false
    });
    this.screenStream = screenStream;

    const screenTrack = screenStream.getVideoTracks()[0];
    const senders = this.peerConnection.getSenders();
    let videoSender = senders.find((s) => s.track && s.track.kind === "video");

    if (!videoSender) {
      videoSender = senders.find((s) => (s as any).kind === "video" || s.track === null);
    }

    if (videoSender) {
      await videoSender.replaceTrack(screenTrack);
    } else {
      this.peerConnection.addTrack(screenTrack, screenStream);
    }

    // Handle user stopping screen share from browser banner
    screenTrack.onended = () => {
      this.stopScreenShare();
      if (onEndedCallback) {
        onEndedCallback();
      }
    };

    return screenStream;
  }

  public async stopScreenShare(): Promise<void> {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((t) => t.stop());
      this.screenStream = null;
    }

    if (this.peerConnection && this.localStream) {
      const originalVideoTrack = this.localStream.getVideoTracks()[0] || null;
      const senders = this.peerConnection.getSenders();
      let videoSender = senders.find((s) => s.track && s.track.kind === "video");
      if (!videoSender) {
        videoSender = senders.find(
          (s) => (s as any).kind === "video" || s.track === null
        );
      }
      if (videoSender && originalVideoTrack) {
        await videoSender.replaceTrack(originalVideoTrack);
      }
    }
  }

  // Cleanup active streams and peer connection
  public cleanup() {
    this.stopScreenShare().catch(() => {});

    if (this.peerConnection) {
      this.peerConnection.onicecandidate = null;
      this.peerConnection.ontrack = null;
      this.peerConnection.onconnectionstatechange = null;
      try {
        this.peerConnection.close();
      } catch (e) {}
      this.peerConnection = null;
    }

    this.remoteDescriptionSet = false;
    this.pendingCandidates = [];
    this.remoteStream = null;
    this.targetUserId = null;
  }

  // Stop local camera/mic stream completely
  public stopLocalStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
  }
}

export const webrtcManager = new WebRTCManager();
