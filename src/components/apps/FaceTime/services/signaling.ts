import { io, Socket } from "socket.io-client";
import type { User, CallType } from "../types";

export type UsersUpdateCallback = (users: User[]) => void;
export type IncomingCallCallback = (data: { fromUser: User; callType: CallType }) => void;
export type CallAcceptedCallback = (data: { fromUser: User }) => void;
export type CallRejectedCallback = (data: { reason: string }) => void;
export type CallEndedCallback = (data: { fromUserId?: string }) => void;
export type WebRtcOfferCallback = (data: {
  fromUserId: string;
  offer: RTCSessionDescriptionInit;
}) => void;
export type WebRtcAnswerCallback = (data: {
  fromUserId: string;
  answer: RTCSessionDescriptionInit;
}) => void;
export type IceCandidateCallback = (data: {
  fromUserId: string;
  candidate: RTCIceCandidateInit;
}) => void;
export type CallFailedCallback = (data: { reason: string; message: string }) => void;

class SignalingService {
  private socket: Socket | null = null;
  private registeredUser: User | null = null;

  // Listeners
  private usersUpdateListeners = new Set<UsersUpdateCallback>();
  private incomingCallListeners = new Set<IncomingCallCallback>();
  private callAcceptedListeners = new Set<CallAcceptedCallback>();
  private callRejectedListeners = new Set<CallRejectedCallback>();
  private callEndedListeners = new Set<CallEndedCallback>();
  private webrtcOfferListeners = new Set<WebRtcOfferCallback>();
  private webrtcAnswerListeners = new Set<WebRtcAnswerCallback>();
  private iceCandidateListeners = new Set<IceCandidateCallback>();
  private callFailedListeners = new Set<CallFailedCallback>();
  private connectionStateListeners = new Set<(connected: boolean) => void>();

  public connect(url?: string): Socket {
    if (this.socket) {
      if (this.registeredUser) {
        this.registerUser(this.registeredUser);
      }
      return this.socket;
    }

    const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
    const serverUrl =
      url || (import.meta as any).env?.VITE_SIGNALING_URL || `http://${host}:3001`;

    this.socket = io(serverUrl, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1500
    });

    this.socket.on("connect", () => {
      console.log(
        `[Signaling Client] Connected to ${serverUrl} with socket ID: ${this.socket?.id}`
      );
      this.connectionStateListeners.forEach((cb) => cb(true));
      if (this.registeredUser) {
        this.registerUser(this.registeredUser);
      }
    });

    this.socket.on("disconnect", () => {
      console.log("[Signaling Client] Disconnected from signaling server");
      this.connectionStateListeners.forEach((cb) => cb(false));
    });

    this.socket.on("connect_error", (err) => {
      console.warn("[Signaling Client] Connection error:", err.message);
      this.connectionStateListeners.forEach((cb) => cb(false));
    });

    this.socket.on("users-update", (users: User[]) => {
      this.usersUpdateListeners.forEach((cb) => cb(users));
    });

    this.socket.on("incoming-call", (data) => {
      this.incomingCallListeners.forEach((cb) => cb(data));
    });

    this.socket.on("call-accepted", (data) => {
      this.callAcceptedListeners.forEach((cb) => cb(data));
    });

    this.socket.on("call-rejected", (data) => {
      this.callRejectedListeners.forEach((cb) => cb(data));
    });

    this.socket.on("call-ended", (data) => {
      this.callEndedListeners.forEach((cb) => cb(data));
    });

    this.socket.on("webrtc-offer", (data) => {
      this.webrtcOfferListeners.forEach((cb) => cb(data));
    });

    this.socket.on("webrtc-answer", (data) => {
      this.webrtcAnswerListeners.forEach((cb) => cb(data));
    });

    this.socket.on("ice-candidate", (data) => {
      this.iceCandidateListeners.forEach((cb) => cb(data));
    });

    this.socket.on("call-failed", (data) => {
      this.callFailedListeners.forEach((cb) => cb(data));
    });

    return this.socket;
  }

  public registerUser(user: User) {
    this.registeredUser = user;
    if (this.socket && this.socket.connected) {
      this.socket.emit("register-user", user);
    }
  }

  public callUser(toUserId: string, fromUser: User, callType: CallType = "video") {
    if (this.socket) {
      this.socket.emit("call-user", { toUserId, fromUser, callType });
    }
  }

  public acceptCall(toUserId: string, fromUser: User) {
    if (this.socket) {
      this.socket.emit("accept-call", { toUserId, fromUser });
    }
  }

  public rejectCall(toUserId: string, reason = "declined") {
    if (this.socket) {
      this.socket.emit("reject-call", { toUserId, reason });
    }
  }

  public endCall(toUserId: string) {
    if (this.socket) {
      this.socket.emit("end-call", { toUserId });
    }
  }

  public sendOffer(toUserId: string, offer: RTCSessionDescriptionInit) {
    if (this.socket) {
      this.socket.emit("webrtc-offer", {
        toUserId,
        offer,
        fromUserId: this.registeredUser?.id
      });
    }
  }

  public sendAnswer(toUserId: string, answer: RTCSessionDescriptionInit) {
    if (this.socket) {
      this.socket.emit("webrtc-answer", {
        toUserId,
        answer,
        fromUserId: this.registeredUser?.id
      });
    }
  }

  public sendIceCandidate(toUserId: string, candidate: RTCIceCandidateInit) {
    if (this.socket) {
      this.socket.emit("ice-candidate", {
        toUserId,
        candidate,
        fromUserId: this.registeredUser?.id
      });
    }
  }

  // Listener subscriptions with unsubscribe returns
  public onUsersUpdate(cb: UsersUpdateCallback) {
    this.usersUpdateListeners.add(cb);
    return () => this.usersUpdateListeners.delete(cb);
  }

  public onIncomingCall(cb: IncomingCallCallback) {
    this.incomingCallListeners.add(cb);
    return () => this.incomingCallListeners.delete(cb);
  }

  public onCallAccepted(cb: CallAcceptedCallback) {
    this.callAcceptedListeners.add(cb);
    return () => this.callAcceptedListeners.delete(cb);
  }

  public onCallRejected(cb: CallRejectedCallback) {
    this.callRejectedListeners.add(cb);
    return () => this.callRejectedListeners.delete(cb);
  }

  public onCallEnded(cb: CallEndedCallback) {
    this.callEndedListeners.add(cb);
    return () => this.callEndedListeners.delete(cb);
  }

  public onWebRtcOffer(cb: WebRtcOfferCallback) {
    this.webrtcOfferListeners.add(cb);
    return () => this.webrtcOfferListeners.delete(cb);
  }

  public onWebRtcAnswer(cb: WebRtcAnswerCallback) {
    this.webrtcAnswerListeners.add(cb);
    return () => this.webrtcAnswerListeners.delete(cb);
  }

  public onIceCandidate(cb: IceCandidateCallback) {
    this.iceCandidateListeners.add(cb);
    return () => this.iceCandidateListeners.delete(cb);
  }

  public onCallFailed(cb: CallFailedCallback) {
    this.callFailedListeners.add(cb);
    return () => this.callFailedListeners.delete(cb);
  }

  public onConnectionState(cb: (connected: boolean) => void) {
    this.connectionStateListeners.add(cb);
    return () => this.connectionStateListeners.delete(cb);
  }
}

export const signalingService = new SignalingService();
