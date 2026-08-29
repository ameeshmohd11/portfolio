import React from "react";
import { useFaceTime } from "./FaceTime/hooks/useFaceTime";
import { FaceTimeHome } from "./FaceTime/components/FaceTimeHome";
import { IncomingCall } from "./FaceTime/components/IncomingCall";
import { OutgoingCall } from "./FaceTime/components/OutgoingCall";
import { ActiveCall } from "./FaceTime/components/ActiveCall";
import { NotificationBanner } from "./FaceTime/components/NotificationBanner";

const FaceTime: React.FC = () => {
  const {
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
    toggleScreenShare,
    clearRecentCalls,
    setPermissionError
  } = useFaceTime();

  return (
    <div className="relative w-full h-full overflow-hidden font-sans">
      {/* Incoming Call Notification Banner */}
      {callState === "ringing" && remoteUser && (
        <NotificationBanner
          caller={remoteUser}
          callType={callType}
          onAccept={acceptCall}
          onDecline={declineCall}
        />
      )}

      {/* Main Window Viewport */}
      {callState === "ringing" && remoteUser ? (
        <IncomingCall
          caller={remoteUser}
          callType={callType}
          onAccept={acceptCall}
          onDecline={declineCall}
        />
      ) : callState === "calling" && remoteUser ? (
        <OutgoingCall
          remoteUser={remoteUser}
          callType={callType}
          localStream={localStream}
          onCancel={hangUp}
        />
      ) : callState === "connected" && remoteUser ? (
        <ActiveCall
          currentUser={currentUser}
          remoteUser={remoteUser}
          localStream={localStream}
          remoteStream={remoteStream}
          isMuted={isMuted}
          isCameraEnabled={isCameraEnabled}
          isScreenSharing={isScreenSharing}
          callDuration={callDuration}
          onToggleMute={toggleMute}
          onToggleCamera={toggleCamera}
          onToggleScreenShare={toggleScreenShare}
          onEndCall={hangUp}
        />
      ) : (
        <FaceTimeHome
          currentUser={currentUser}
          onSelectUser={setCurrentUser}
          onlineUsers={onlineUsers}
          recentCalls={recentCalls}
          activeTab={activeSidebarTab}
          onTabChange={setActiveSidebarTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onStartCall={startCall}
          onClearRecents={clearRecentCalls}
          permissionError={permissionError}
          onDismissError={() => setPermissionError(null)}
          isSignalingConnected={isSignalingConnected}
        />
      )}
    </div>
  );
};

export default FaceTime;
