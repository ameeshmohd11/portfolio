import { useEffect, useRef, useCallback } from "react";
import { useFaceTimeStore } from "../store/facetimeStore";
import { signalingService } from "../services/signaling";
import { webrtcManager } from "../services/webrtc";
import { soundEffects } from "../services/soundEffects";
import type { User, CallType } from "../types";

export function useFaceTime() {
  const {
    currentUser,
    setCurrentUser,
    onlineUsers,
    setOnlineUsers,
    callState,
    callType,
    remoteUser,
    setCallState,
    localStream,
    setLocalStream,
    remoteStream,
    setRemoteStream,
    isMuted,
    isCameraEnabled,
    isScreenSharing,
    toggleMute,
    toggleCamera,
    setScreenSharing,
    callStartedAt,
    callDuration,
    setCallDuration,
    resetCallMetrics,
    permissionError,
    setPermissionError,
    recentCalls,
    addRecentCall,
    clearRecentCalls,
    activeSidebarTab,
    setActiveSidebarTab,
    searchQuery,
    setSearchQuery,
    isSignalingConnected,
    setIsSignalingConnected
  } = useFaceTimeStore();

  const timerRef = useRef<number | null>(null);
  const pendingOfferRef = useRef<{ fromUserId: string; offer: RTCSessionDescriptionInit } | null>(null);

  // Initialize and maintain signaling connection
  useEffect(() => {
    signalingService.connect();
    signalingService.registerUser(currentUser);

    const unsubConnection = signalingService.onConnectionState((connected) => {
      setIsSignalingConnected(connected);
    });

    const unsubUsers = signalingService.onUsersUpdate((users) => {
      setOnlineUsers(users);
    });

    // Handle Incoming Call
    const unsubIncoming = signalingService.onIncomingCall(({ fromUser, callType }) => {
      console.log("[useFaceTime] Incoming call from", fromUser.name);
      setCallState("ringing", fromUser, callType);
      soundEffects.playRinging();
    });

    // Handle Call Accepted by remote peer
    const unsubAccepted = signalingService.onCallAccepted(async ({ fromUser }) => {
      console.log("[useFaceTime] Call accepted by", fromUser.name);
      soundEffects.playConnected();
      setCallState("connected", fromUser);
      useFaceTimeStore.setState({ callStartedAt: Date.now() });

      // Caller sends WebRTC Offer now that remote peer accepted
      try {
        await webrtcManager.createAndSendOffer(fromUser.id);
      } catch (err: any) {
        console.error("[useFaceTime] Failed to create offer:", err);
      }
    });

    // Handle Call Rejected
    const unsubRejected = signalingService.onCallRejected(({ reason }) => {
      console.log("[useFaceTime] Call rejected:", reason);
      soundEffects.playEndCall();
      if (remoteUser) {
        addRecentCall({
          userId: remoteUser.id,
          userName: remoteUser.name,
          userAvatar: remoteUser.avatar,
          type: "missed",
          callType: callType,
          timestamp: Date.now()
        });
      }
      webrtcManager.cleanup();
      soundEffects.stopSounds();
      setCallState("idle", null);
      resetCallMetrics();
    });

    // Handle Call Ended
    const unsubEnded = signalingService.onCallEnded(() => {
      console.log("[useFaceTime] Remote peer ended the call");
      soundEffects.playEndCall();
      if (remoteUser) {
        addRecentCall({
          userId: remoteUser.id,
          userName: remoteUser.name,
          userAvatar: remoteUser.avatar,
          type: "incoming",
          callType: callType,
          timestamp: Date.now(),
          duration: callDuration
        });
      }
      webrtcManager.cleanup();
      soundEffects.stopSounds();
      setRemoteStream(null);
      setCallState("idle", null);
      resetCallMetrics();
    });

    // Handle WebRTC Offer
    const unsubOffer = signalingService.onWebRtcOffer(async ({ fromUserId, offer }) => {
      console.log("[useFaceTime] Received WebRTC offer from", fromUserId);
      pendingOfferRef.current = { fromUserId, offer };
      if (callState === "connected") {
        try {
          await webrtcManager.handleOfferAndSendAnswer(fromUserId, offer);
        } catch (e) {
          console.error("[useFaceTime] Error handling WebRTC offer:", e);
        }
      }
    });

    // Handle WebRTC Answer
    const unsubAnswer = signalingService.onWebRtcAnswer(async ({ answer }) => {
      console.log("[useFaceTime] Received WebRTC answer");
      try {
        await webrtcManager.handleAnswer(answer);
      } catch (e) {
        console.error("[useFaceTime] Error handling WebRTC answer:", e);
      }
    });

    // Handle ICE Candidate
    const unsubIce = signalingService.onIceCandidate(async ({ candidate }) => {
      try {
        await webrtcManager.addIceCandidate(candidate);
      } catch (e) {
        console.error("[useFaceTime] Error adding ICE candidate:", e);
      }
    });

    // Handle Call Failed
    const unsubFailed = signalingService.onCallFailed(({ message }) => {
      console.warn("[useFaceTime] Call failed:", message);
      soundEffects.playEndCall();
      soundEffects.stopSounds();
      setPermissionError(message);
      setCallState("idle", null);
      resetCallMetrics();
    });

    // WebRTC remote stream listener
    webrtcManager.setRemoteStreamCallback((stream) => {
      console.log("[useFaceTime] Remote media stream updated", stream.getTracks());
      setRemoteStream(stream);
    });

    return () => {
      unsubConnection();
      unsubUsers();
      unsubIncoming();
      unsubAccepted();
      unsubRejected();
      unsubEnded();
      unsubOffer();
      unsubAnswer();
      unsubIce();
      unsubFailed();
      soundEffects.stopSounds();
    };
  }, [currentUser, callState, remoteUser, callType, callDuration]);

  // Re-register when current user changes
  useEffect(() => {
    signalingService.registerUser(currentUser);
  }, [currentUser]);

  // Call duration interval timer
  useEffect(() => {
    if (callState === "connected") {
      timerRef.current = window.setInterval(() => {
        setCallDuration(useFaceTimeStore.getState().callDuration + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [callState]);

  // Start outgoing call
  const startCall = useCallback(
    async (targetUser: User, type: CallType = "video") => {
      try {
        setPermissionError(null);
        setCallState("calling", targetUser, type);
        soundEffects.playDialing();

        // Capture local camera & mic
        const stream = await webrtcManager.getLocalMedia(type === "video", true);
        setLocalStream(stream);

        // Emit call-user event via signaling
        signalingService.callUser(targetUser.id, currentUser, type);
      } catch (err: any) {
        console.error("[useFaceTime] Failed to start call:", err);
        setPermissionError(
          err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
            ? "Camera/Microphone permission was denied. Please allow access in your browser."
            : "Could not access media devices."
        );
        soundEffects.stopSounds();
        setCallState("idle", null);
      }
    },
    [currentUser]
  );

  // Accept incoming call
  const acceptCall = useCallback(async () => {
    if (!remoteUser) return;
    try {
      soundEffects.stopSounds();
      soundEffects.playConnected();
      setCallState("connected", remoteUser, callType);
      useFaceTimeStore.setState({ callStartedAt: Date.now() });

      // Capture local stream
      const stream = await webrtcManager.getLocalMedia(callType === "video", true);
      setLocalStream(stream);

      // Notify caller that call was accepted
      signalingService.acceptCall(remoteUser.id, currentUser);

      // If an offer was already received while ringing, handle it immediately
      if (pendingOfferRef.current) {
        await webrtcManager.handleOfferAndSendAnswer(
          pendingOfferRef.current.fromUserId,
          pendingOfferRef.current.offer
        );
        pendingOfferRef.current = null;
      }
    } catch (err: any) {
      console.error("[useFaceTime] Failed to accept call:", err);
      setPermissionError("Could not access camera/microphone.");
      hangUp();
    }
  }, [remoteUser, currentUser, callType]);

  // Decline incoming call
  const declineCall = useCallback(() => {
    if (remoteUser) {
      signalingService.rejectCall(remoteUser.id, "declined");
      addRecentCall({
        userId: remoteUser.id,
        userName: remoteUser.name,
        userAvatar: remoteUser.avatar,
        type: "missed",
        callType: callType,
        timestamp: Date.now()
      });
    }
    soundEffects.stopSounds();
    webrtcManager.cleanup();
    setCallState("idle", null);
    resetCallMetrics();
  }, [remoteUser, callType]);

  // Hang up / Cancel active or outgoing call
  const hangUp = useCallback(() => {
    if (remoteUser) {
      signalingService.endCall(remoteUser.id);
      if (callState === "connected") {
        addRecentCall({
          userId: remoteUser.id,
          userName: remoteUser.name,
          userAvatar: remoteUser.avatar,
          type: "outgoing",
          callType: callType,
          timestamp: Date.now(),
          duration: callDuration
        });
      }
    }
    soundEffects.stopSounds();
    soundEffects.playEndCall();
    webrtcManager.cleanup();
    setRemoteStream(null);
    setCallState("idle", null);
    resetCallMetrics();
    setScreenSharing(false);
  }, [remoteUser, callState, callType, callDuration]);

  // Handle Screen Share Toggle
  const handleToggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      await webrtcManager.stopScreenShare();
      setScreenSharing(false);
    } else {
      try {
        await webrtcManager.startScreenShare(() => {
          setScreenSharing(false);
        });
        setScreenSharing(true);
      } catch (err) {
        console.warn("Screen share cancelled or failed:", err);
        setScreenSharing(false);
      }
    }
  }, [isScreenSharing]);

  return {
    currentUser,
    setCurrentUser,
    onlineUsers,
    callState,
    callType,
    remoteUser,
    localStream,
    remoteStream,
    isMuted,
    isCameraEnabled,
    isScreenSharing,
    callDuration,
    permissionError,
    recentCalls,
    activeSidebarTab,
    setActiveSidebarTab,
    searchQuery,
    setSearchQuery,
    isSignalingConnected,
    startCall,
    acceptCall,
    declineCall,
    hangUp,
    toggleMute,
    toggleCamera,
    toggleScreenShare: handleToggleScreenShare,
    clearRecentCalls,
    setPermissionError
  };
}
