import { signalingService } from "./signaling";

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" }
  ]
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

  // Helper to create a synthetic silent audio track using Web Audio API
  private createSilentAudioTrack(): MediaStreamTrack {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const oscillator = ctx.createOscillator();
      const dst = ctx.createMediaStreamDestination();
      const gain = ctx.createGain();
      gain.gain.value = 0; // Silent
      oscillator.connect(gain);
      gain.connect(dst);
      oscillator.start();
      return dst.stream.getAudioTracks()[0];
    } catch (e) {
      console.warn("Could not create Web Audio silent track:", e);
      // Fallback empty audio track
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const stream = (canvas as any).captureStream?.(1) || new MediaStream();
      return stream.getAudioTracks()[0];
    }
  }

  // Helper to create a synthetic canvas video track (e.g. animated avatar / placeholder)
  private createCanvasVideoTrack(label = "Simulated Camera"): MediaStreamTrack {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext("2d");

    let hue = 160;
    const draw = () => {
      if (!ctx) return;
      ctx.fillStyle = `hsl(${hue}, 40%, 15%)`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.font = "bold 24px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(label, canvas.width / 2, canvas.height / 2 - 15);

      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.font = "14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText("Audio / Video Connected", canvas.width / 2, canvas.height / 2 + 20);

      hue = (hue + 0.2) % 360;
    };

    draw();
    setInterval(draw, 100);

    const stream = canvas.captureStream(15);
    return stream.getVideoTracks()[0];
  }

  // Capture user's webcam and mic stream with multi-level resilient fallback
  public async getLocalMedia(video = true, audio = true): Promise<MediaStream> {
    if (this.localStream && this.localStream.active) {
      return this.localStream;
    }

    const hasMediaDevices = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

    if (hasMediaDevices) {
      // 1. Try both Video and Audio
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: video ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" } : false,
          audio: audio ? { echoCancellation: true, noiseSuppression: true, autoGainControl: true } : false
        });
        this.localStream = stream;
        return stream;
      } catch (err1: any) {
        console.warn("Primary getUserMedia failed:", err1.message || err1);

        // 2. Try Video-only if audio device is unavailable or denied
        if (video) {
          try {
            const videoOnly = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            // Attach a synthetic silent audio track so audio negotiation succeeds
            const silentTrack = this.createSilentAudioTrack();
            if (silentTrack) videoOnly.addTrack(silentTrack);
            this.localStream = videoOnly;
            return videoOnly;
          } catch (err2: any) {
            console.warn("Video-only getUserMedia failed:", err2.message || err2);
          }
        }

        // 3. Try Audio-only if video device is unavailable
        if (audio) {
          try {
            const audioOnly = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
            // Attach a canvas video track so video window renders
            const canvasTrack = this.createCanvasVideoTrack("FaceTime Audio User");
            if (canvasTrack) audioOnly.addTrack(canvasTrack);
            this.localStream = audioOnly;
            return audioOnly;
          } catch (err3: any) {
            console.warn("Audio-only getUserMedia failed:", err3.message || err3);
          }
        }
      }
    }

    // 4. Fallback when hardware is completely inaccessible (e.g. desktop without mic/cam, or non-secure origin)
    console.info("Using simulated media stream for desktop compatibility");
    const syntheticStream = new MediaStream();
    const canvasTrack = this.createCanvasVideoTrack("FaceTime Simulation");
    const silentTrack = this.createSilentAudioTrack();
    if (canvasTrack) syntheticStream.addTrack(canvasTrack);
    if (silentTrack) syntheticStream.addTrack(silentTrack);

    this.localStream = syntheticStream;
    return syntheticStream;
  }

  // Initialize RTCPeerConnection
  public initializePeerConnection(targetUserId: string): RTCPeerConnection {
    this.cleanup();
    this.targetUserId = targetUserId;
    this.remoteDescriptionSet = false;
    this.pendingCandidates = [];

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
      console.log("[WebRTC] Received remote track:", event.track.kind);
      if (!this.remoteStream) {
        this.remoteStream = new MediaStream();
      }
      // Add track to remote stream if not already present
      if (!this.remoteStream.getTracks().some((t) => t.id === event.track.id)) {
        this.remoteStream.addTrack(event.track);
      }
      if (this.onRemoteStreamCallback) {
        this.onRemoteStreamCallback(this.remoteStream);
      }
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
  public async createAndSendOffer(targetUserId: string): Promise<RTCSessionDescriptionInit> {
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
      video: true,
      audio: true
    });
    this.screenStream = screenStream;

    const screenTrack = screenStream.getVideoTracks()[0];
    const senders = this.peerConnection.getSenders();
    const videoSender = senders.find((s) => s.track && s.track.kind === "video");

    if (videoSender) {
      await videoSender.replaceTrack(screenTrack);
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
      const videoSender = senders.find((s) => s.track && s.track.kind === "video");
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
      this.peerConnection.close();
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
