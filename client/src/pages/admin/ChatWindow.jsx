import { useEffect, useRef, useState } from "react";

import {
  ArrowLeft,
  Camera,
  File,
  Image as ImageIcon,
  Mic,
  MicOff,
  Paperclip,
  Phone,
  PhoneOff,
  Search,
  Send,
  Smile,
  UserRound,
  Video,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

import { useNavigate, useParams } from "react-router-dom";

import api from "../../services/api";
import socket from "../../services/socket";

import "../../styles/adminChat.css";

const API_BASE_URL = "http://localhost:5000";

const RTC_CONFIGURATION = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
};

function ChatWindow() {
  const navigate = useNavigate();
  const { providerUserId } = useParams();

  // =========================================
  // CHAT STATE
  // =========================================

  const [provider, setProvider] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] =
    useState(false);

  const [recording, setRecording] = useState(false);

  // =========================================
  // CALL STATE
  // =========================================

  const [callState, setCallState] = useState("IDLE");
  const [callType, setCallType] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  const [callError, setCallError] = useState("");

  // =========================================
  // REFS
  // =========================================

  const messageInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const messagesEndRef = useRef(null);

  // WebRTC refs
  const peerConnectionRef = useRef(null);

  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const pendingIceCandidatesRef = useRef([]);

  const activeCallIdRef = useRef(null);
  const activeCallTypeRef = useRef(null);

  // =========================================
  // EMOJIS
  // =========================================

  const emojis = [
    "😊",
    "😂",
    "❤️",
    "👍",
    "🙏",
    "👏",
    "🎉",
    "😄",
    "🙂",
    "😉",
    "🤝",
    "💯",
  ];

  // =========================================
  // LOAD CHAT
  // =========================================

  useEffect(() => {
    loadChat();
  }, [providerUserId]);

  // =========================================
  // SOCKET - CHAT MESSAGES
  // =========================================

  useEffect(() => {
    if (!conversation?.id) {
      return;
    }

    if (!socket.connected) {
      socket.connect();
    }

    const joinConversation = () => {
      socket.emit(
        "join-conversation",
        conversation.id
      );
    };

    if (socket.connected) {
      joinConversation();
    }

    socket.on("connect", joinConversation);

    const handleNewMessage = (data) => {
      const newMessage = data?.message || data;

      if (!newMessage) {
        return;
      }

      if (
        newMessage.conversationId &&
        String(newMessage.conversationId) !==
          String(conversation.id)
      ) {
        return;
      }

      setMessages((currentMessages) => {
        const alreadyExists = currentMessages.some(
          (item) =>
            String(item.id) ===
            String(newMessage.id)
        );

        if (alreadyExists) {
          return currentMessages;
        }

        return [
          ...currentMessages,
          newMessage,
        ];
      });

      // If message is from provider, mark it as read.
      if (
        newMessage.senderId &&
        String(newMessage.senderId) !==
          String(providerUserId)
      ) {
        api
          .patch(
            `/chat/conversation/${conversation.id}/read`
          )
          .catch((err) => {
            console.error(
              "Mark messages as read error:",
              err
            );
          });
      }
    };

    socket.on(
      "new-message",
      handleNewMessage
    );

    socket.on(
      "new-chat-message",
      handleNewMessage
    );

    return () => {
      socket.emit(
        "leave-conversation",
        conversation.id
      );

      socket.off(
        "connect",
        joinConversation
      );

      socket.off(
        "new-message",
        handleNewMessage
      );

      socket.off(
        "new-chat-message",
        handleNewMessage
      );
    };
  }, [conversation?.id, providerUserId]);

  // =========================================
  // LOAD PROVIDER + CONVERSATION + MESSAGES
  // =========================================

  const loadChat = async () => {
    try {
      setLoading(true);
      setError("");

      // Get providers
      const providerResponse =
        await api.get("/providers/admin");

      const providers =
        providerResponse.data?.data || [];

      const foundProvider =
        providers.find((item) => {
          const userId =
            item.userId ||
            item.user?.id ||
            item.id;

          return (
            String(userId) ===
            String(providerUserId)
          );
        });

      setProvider(foundProvider || null);

      // Create / get conversation
      const conversationResponse =
        await api.post(
          "/chat/conversation",
          {
            userId: providerUserId,
          }
        );

      const conversationData =
        conversationResponse.data?.data;

      if (!conversationData?.id) {
        throw new Error(
          "Conversation could not be created."
        );
      }

      setConversation(conversationData);

      // Get messages
      const messagesResponse =
        await api.get(
          `/chat/conversation/${conversationData.id}/messages`
        );

      setMessages(
        messagesResponse.data?.data || []
      );

      // Mark messages as read
      await api.patch(
        `/chat/conversation/${conversationData.id}/read`
      );
    } catch (err) {
      console.error(
        "Admin chat error:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load chat."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // CREATE WEBRTC PEER CONNECTION
  // =========================================

  const createPeerConnection = (
    targetUserId,
    currentCallId,
    currentCallType
  ) => {
    const peerConnection =
      new RTCPeerConnection(
        RTC_CONFIGURATION
      );

    peerConnectionRef.current =
      peerConnection;

    // ICE candidate
    peerConnection.onicecandidate = (
      event
    ) => {
      if (!event.candidate) {
        return;
      }

      socket.emit("ice-candidate", {
        to: targetUserId,
        callId: currentCallId,
        candidate: event.candidate,
      });
    };

    // Remote stream
    peerConnection.ontrack = (event) => {
      const remoteStream =
        event.streams?.[0];

      if (!remoteStream) {
        return;
      }

      remoteStreamRef.current =
        remoteStream;

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject =
          remoteStream;

        remoteVideoRef.current.muted =
          !isSpeakerOn;

        remoteVideoRef.current
          .play()
          .catch(() => {});
      }
    };

    // Connection state
    peerConnection.onconnectionstatechange =
      () => {
        const state =
          peerConnection.connectionState;

        console.log(
          "Admin call connection state:",
          state
        );

        if (
          state === "failed" ||
          state === "closed"
        ) {
          cleanupCall(false);
        }
      };

    // Add local tracks
    const localStream =
      localStreamRef.current;

    if (localStream) {
      localStream
        .getTracks()
        .forEach((track) => {
          peerConnection.addTrack(
            track,
            localStream
          );
        });
    }

    return peerConnection;
  };

  // =========================================
  // GET LOCAL MEDIA
  // =========================================

  const getLocalMedia = async (
    currentCallType
  ) => {
    const constraints = {
      audio: true,
      video:
        currentCallType === "VIDEO",
    };

    const stream =
      await navigator.mediaDevices.getUserMedia(
        constraints
      );

    localStreamRef.current = stream;

    if (localVideoRef.current) {
      localVideoRef.current.srcObject =
        stream;

      localVideoRef.current
        .play()
        .catch(() => {});
    }

    return stream;
  };

  // =========================================
  // START AUDIO / VIDEO CALL
  // =========================================

  const startCall = async (
    selectedCallType
  ) => {
    if (
      !providerUserId ||
      callState !== "IDLE"
    ) {
      return;
    }

    try {
      setCallError("");

      if (!socket.connected) {
        socket.connect();
      }

      const currentCallId =
        `call-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`;

      activeCallIdRef.current =
        currentCallId;

      activeCallTypeRef.current =
        selectedCallType;

      setCallType(
        selectedCallType
      );

      setCallState("CALLING");

      // Get microphone / camera
      await getLocalMedia(
        selectedCallType
      );

      // Create peer
      const peerConnection =
        createPeerConnection(
          providerUserId,
          currentCallId,
          selectedCallType
        );

      // Create offer
      const offer =
        await peerConnection.createOffer();

      await peerConnection.setLocalDescription(
        offer
      );

      // Send call to provider
      socket.emit("call-user", {
        to: providerUserId,
        callId: currentCallId,
        callType: selectedCallType,
        offer,
        caller: {
          id: "admin",
          name: "Admin",
          role: "ORGANIZATION_ADMIN",
        },
      });
    } catch (err) {
      console.error(
        "Start call error:",
        err
      );

      setCallError(
        err.message ||
          "Unable to start call."
      );

      cleanupCall(false);
    }
  };

  // =========================================
  // INCOMING CALL
  // =========================================

  useEffect(() => {
    const handleIncomingCall = (
      data
    ) => {
      if (!data?.callId) {
        return;
      }

      // If admin is already on another call
      if (callState !== "IDLE") {
        socket.emit("call-busy", {
          to: data.from,
          callId: data.callId,
        });

        return;
      }

      // Only handle call if it is from
      // the provider currently opened.
      if (
        data.from &&
        String(data.from) !==
          String(providerUserId)
      ) {
        return;
      }

      setIncomingCall(data);

      setCallType(data.callType);

      setCallState("INCOMING");

      activeCallIdRef.current =
        data.callId;

      activeCallTypeRef.current =
        data.callType;
    };

    socket.on(
      "incoming-call",
      handleIncomingCall
    );

    return () => {
      socket.off(
        "incoming-call",
        handleIncomingCall
      );
    };
  }, [
    callState,
    providerUserId,
  ]);

  // =========================================
  // ACCEPT INCOMING CALL
  // =========================================

  const acceptCall = async () => {
    if (!incomingCall) {
      return;
    }

    const currentCall =
      incomingCall;

    try {
      setCallError("");

      setCallState("CONNECTING");

      const currentCallId =
        currentCall.callId;

      const currentCallType =
        currentCall.callType;

      activeCallIdRef.current =
        currentCallId;

      activeCallTypeRef.current =
        currentCallType;

      setCallType(currentCallType);

      // Get microphone / camera
      await getLocalMedia(
        currentCallType
      );

      // Create peer
      const peerConnection =
        createPeerConnection(
          currentCall.from,
          currentCallId,
          currentCallType
        );

      // Set caller offer
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(
          currentCall.offer
        )
      );

      // Create answer
      const answer =
        await peerConnection.createAnswer();

      await peerConnection.setLocalDescription(
        answer
      );

      // Send answer to admin
      socket.emit("accept-call", {
        to: currentCall.from,
        callId: currentCallId,
        answer,
      });

      // Add pending ICE candidates
      for (
        const candidate of
        pendingIceCandidatesRef.current
      ) {
        try {
          await peerConnection.addIceCandidate(
            candidate
          );
        } catch (err) {
          console.error(
            "Pending ICE error:",
            err
          );
        }
      }

      pendingIceCandidatesRef.current =
        [];

      setIncomingCall(null);

      setCallState("ACTIVE");
    } catch (err) {
      console.error(
        "Accept call error:",
        err
      );

      setCallError(
        err.message ||
          "Unable to accept call."
      );

      cleanupCall(false);
    }
  };

  // =========================================
  // REJECT INCOMING CALL
  // =========================================

  const rejectCall = () => {
    if (!incomingCall) {
      return;
    }

    socket.emit("reject-call", {
      to: incomingCall.from,
      callId: incomingCall.callId,
      reason: "Call rejected by admin",
    });

    setIncomingCall(null);

    cleanupCall(false);
  };

  // =========================================
  // CALL ACCEPTED
  // =========================================

  useEffect(() => {
    const handleCallAccepted = async (
      data
    ) => {
      if (
        !data?.callId ||
        String(data.callId) !==
          String(activeCallIdRef.current)
      ) {
        return;
      }

      try {
        const peerConnection =
          peerConnectionRef.current;

        if (!peerConnection) {
          return;
        }

        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(
            data.answer
          )
        );

        // Add pending ICE candidates
        for (
          const candidate of
          pendingIceCandidatesRef.current
        ) {
          try {
            await peerConnection.addIceCandidate(
              candidate
            );
          } catch (err) {
            console.error(
              "Pending ICE error:",
              err
            );
          }
        }

        pendingIceCandidatesRef.current =
          [];

        setCallState("ACTIVE");
      } catch (err) {
        console.error(
          "Call accepted error:",
          err
        );

        setCallError(
          "Unable to connect the call."
        );

        cleanupCall(false);
      }
    };

    socket.on(
      "call-accepted",
      handleCallAccepted
    );

    return () => {
      socket.off(
        "call-accepted",
        handleCallAccepted
      );
    };
  }, []);

  // =========================================
  // ICE CANDIDATE
  // =========================================

  useEffect(() => {
    const handleIceCandidate = async (
      data
    ) => {
      if (
        !data?.callId ||
        String(data.callId) !==
          String(activeCallIdRef.current)
      ) {
        return;
      }

      if (!data.candidate) {
        return;
      }

      const peerConnection =
        peerConnectionRef.current;

      if (
        !peerConnection ||
        !peerConnection.remoteDescription
      ) {
        pendingIceCandidatesRef.current.push(
          data.candidate
        );

        return;
      }

      try {
        await peerConnection.addIceCandidate(
          new RTCIceCandidate(
            data.candidate
          )
        );
      } catch (err) {
        console.error(
          "ICE candidate error:",
          err
        );
      }
    };

    socket.on(
      "ice-candidate",
      handleIceCandidate
    );

    return () => {
      socket.off(
        "ice-candidate",
        handleIceCandidate
      );
    };
  }, []);

  // =========================================
  // CALL REJECTED
  // =========================================

  useEffect(() => {
    const handleCallRejected = (
      data
    ) => {
      if (
        !data?.callId ||
        String(data.callId) !==
          String(activeCallIdRef.current)
      ) {
        return;
      }

      setCallError(
        data.reason ||
          "Call was rejected."
      );

      cleanupCall(false);
    };

    socket.on(
      "call-rejected",
      handleCallRejected
    );

    return () => {
      socket.off(
        "call-rejected",
        handleCallRejected
      );
    };
  }, []);

  // =========================================
  // CALL BUSY
  // =========================================

  useEffect(() => {
    const handleCallBusy = (
      data
    ) => {
      if (
        !data?.callId ||
        String(data.callId) !==
          String(activeCallIdRef.current)
      ) {
        return;
      }

      setCallError(
        `${
          provider?.user?.name ||
          provider?.name ||
          "Provider"
        } is currently busy on another call.`
      );

      cleanupCall(false);
    };

    socket.on(
      "call-busy",
      handleCallBusy
    );

    return () => {
      socket.off(
        "call-busy",
        handleCallBusy
      );
    };
  }, [provider]);

  // =========================================
  // CALL ENDED
  // =========================================

  useEffect(() => {
    const handleCallEnded = (
      data
    ) => {
      if (
        !data?.callId ||
        String(data.callId) !==
          String(activeCallIdRef.current)
      ) {
        return;
      }

      cleanupCall(false);
    };

    socket.on(
      "call-ended",
      handleCallEnded
    );

    return () => {
      socket.off(
        "call-ended",
        handleCallEnded
      );
    };
  }, []);

  // =========================================
  // CALL CANCELLED
  // =========================================

  useEffect(() => {
    const handleCallCancelled = (
      data
    ) => {
      if (
        !data?.callId ||
        String(data.callId) !==
          String(activeCallIdRef.current)
      ) {
        return;
      }

      cleanupCall(false);
    };

    socket.on(
      "call-cancelled",
      handleCallCancelled
    );

    return () => {
      socket.off(
        "call-cancelled",
        handleCallCancelled
      );
    };
  }, []);

  // =========================================
  // CLEANUP CALL
  // =========================================

  const cleanupCall = (
    notifyOtherSide = false
  ) => {
    const currentCallId =
      activeCallIdRef.current;

    if (
      notifyOtherSide &&
      providerUserId &&
      currentCallId
    ) {
      socket.emit("end-call", {
        to: providerUserId,
        callId: currentCallId,
      });
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.close();
      } catch (err) {
        console.error(
          "Peer close error:",
          err
        );
      }

      peerConnectionRef.current =
        null;
    }

    // Stop local tracks
    if (localStreamRef.current) {
      localStreamRef.current
        .getTracks()
        .forEach((track) => {
          track.stop();
        });

      localStreamRef.current = null;
    }

    // Stop remote tracks
    if (remoteStreamRef.current) {
      remoteStreamRef.current
        .getTracks()
        .forEach((track) => {
          track.stop();
        });

      remoteStreamRef.current = null;
    }

    // Clear videos
    if (localVideoRef.current) {
      localVideoRef.current.srcObject =
        null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject =
        null;
    }

    pendingIceCandidatesRef.current =
      [];

    activeCallIdRef.current = null;
    activeCallTypeRef.current = null;

    setIncomingCall(null);
    setCallType(null);
    setCallState("IDLE");

    setIsMuted(false);
    setIsSpeakerOn(true);
  };

  // =========================================
  // END ACTIVE CALL
  // =========================================

  const handleEndCall = () => {
    cleanupCall(true);
  };

  // =========================================
  // CANCEL OUTGOING CALL
  // =========================================

  const handleCancelCall = () => {
    if (
      providerUserId &&
      activeCallIdRef.current
    ) {
      socket.emit("cancel-call", {
        to: providerUserId,
        callId:
          activeCallIdRef.current,
      });
    }

    cleanupCall(false);
  };

  // =========================================
  // MUTE / UNMUTE
  // =========================================

  const handleToggleMute = () => {
    const stream =
      localStreamRef.current;

    if (!stream) {
      return;
    }

    const nextMuted = !isMuted;

    stream
      .getAudioTracks()
      .forEach((track) => {
        track.enabled = !nextMuted;
      });

    setIsMuted(nextMuted);
  };

  // =========================================
  // SPEAKER ON / OFF
  // =========================================

  const handleToggleSpeaker = () => {
    const media =
      remoteVideoRef.current;

    if (!media) {
      return;
    }

    const nextSpeakerState =
      !isSpeakerOn;

    media.muted =
      !nextSpeakerState;

    setIsSpeakerOn(
      nextSpeakerState
    );
  };

  // =========================================
  // CLEANUP WHEN PAGE UNMOUNTS
  // =========================================

  useEffect(() => {
    return () => {
      if (
        activeCallIdRef.current &&
        providerUserId
      ) {
        socket.emit("end-call", {
          to: providerUserId,
          callId:
            activeCallIdRef.current,
        });
      }

      if (
        peerConnectionRef.current
      ) {
        try {
          peerConnectionRef.current.close();
        } catch (err) {
          console.error(
            "Peer cleanup error:",
            err
          );
        }
      }

      if (
        localStreamRef.current
      ) {
        localStreamRef.current
          .getTracks()
          .forEach((track) => {
            track.stop();
          });
      }

      if (
        mediaRecorderRef.current
      ) {
        try {
          mediaRecorderRef.current.stop();
        } catch (err) {
          // Recorder may already be stopped.
        }
      }
    };
  }, [providerUserId]);

  // =========================================
  // SEND TEXT MESSAGE
  // =========================================

  const sendMessage = async (e) => {
    e.preventDefault();

    if (
      !message.trim() ||
      !conversation ||
      sending
    ) {
      return;
    }

    try {
      setSending(true);
      setError("");

      const response =
        await api.post(
          `/chat/conversation/${conversation.id}/messages`,
          {
            content: message.trim(),
          }
        );

      const newMessage =
        response.data?.data;

      if (newMessage) {
        setMessages(
          (currentMessages) => {
            const alreadyExists =
              currentMessages.some(
                (item) =>
                  String(item.id) ===
                  String(newMessage.id)
              );

            if (alreadyExists) {
              return currentMessages;
            }

            return [
              ...currentMessages,
              newMessage,
            ];
          }
        );
      }

      setMessage("");
      setShowEmoji(false);
    } catch (err) {
      console.error(
        "Send message error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to send message."
      );
    } finally {
      setSending(false);
    }
  };

  // =========================================
  // FILE SELECT
  // =========================================

  const handleFileSelect = async (e) => {
    const file =
      e.target.files?.[0];

    if (!file || !conversation) {
      return;
    }

    await sendFileMessage(file);

    e.target.value = "";

    setShowAttachmentMenu(false);
  };

  // =========================================
  // SEND FILE / IMAGE / AUDIO
  // =========================================

  const sendFileMessage = async (
    file
  ) => {
    try {
      setSending(true);
      setError("");

      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );

      const response =
        await api.post(
          `/chat/conversation/${conversation.id}/messages/file`,
          formData,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );

      const newMessage =
        response.data?.data;

      if (newMessage) {
        setMessages(
          (currentMessages) => {
            const alreadyExists =
              currentMessages.some(
                (item) =>
                  String(item.id) ===
                  String(newMessage.id)
              );

            if (alreadyExists) {
              return currentMessages;
            }

            return [
              ...currentMessages,
              newMessage,
            ];
          }
        );
      }
    } catch (err) {
      console.error(
        "Send file error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to send file."
      );
    } finally {
      setSending(false);
    }
  };

  // =========================================
  // START VOICE RECORDING
  // =========================================

  const startRecording = async () => {
    if (
      recording ||
      sending
    ) {
      return;
    }

    try {
      setError("");

      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            audio: true,
          }
        );

      const recorder =
        new MediaRecorder(stream);

      mediaRecorderRef.current =
        recorder;

      audioChunksRef.current =
        [];

      recorder.ondataavailable = (
        event
      ) => {
        if (
          event.data.size > 0
        ) {
          audioChunksRef.current.push(
            event.data
          );
        }
      };

      recorder.onstop = async () => {
        const audioBlob =
          new Blob(
            audioChunksRef.current,
            {
              type: "audio/webm",
            }
          );

        stream
          .getTracks()
          .forEach((track) =>
            track.stop()
          );

        const audioFile =
          new File(
            [audioBlob],
            `voice-${Date.now()}.webm`,
            {
              type: "audio/webm",
            }
          );

        await sendFileMessage(
          audioFile
        );
      };

      recorder.start();

      setRecording(true);
    } catch (err) {
      console.error(
        "Recording error:",
        err
      );

      setError(
        "Microphone permission is required."
      );
    }
  };

  // =========================================
  // STOP VOICE RECORDING
  // =========================================

  const stopRecording = () => {
    if (
      !mediaRecorderRef.current
    ) {
      return;
    }

    mediaRecorderRef.current.stop();

    mediaRecorderRef.current =
      null;

    setRecording(false);
  };

  // =========================================
  // EMOJI
  // =========================================

  const addEmoji = (emoji) => {
    setMessage(
      (currentMessage) =>
        currentMessage + emoji
    );

    setShowEmoji(false);

    setTimeout(() => {
      messageInputRef.current?.focus();
    }, 0);
  };

  // =========================================
  // MESSAGE SEARCH
  // =========================================

  const filteredMessages =
    messages.filter((item) => {
      if (!searchText.trim()) {
        return true;
      }

      const text =
        item.content || "";

      const attachmentName =
        item.attachmentName || "";

      return (
        text
          .toLowerCase()
          .includes(
            searchText.toLowerCase()
          ) ||
        attachmentName
          .toLowerCase()
          .includes(
            searchText.toLowerCase()
          )
      );
    });

  // =========================================
  // FORMAT MESSAGE TIME
  // =========================================

  const formatTime = (date) => {
    if (!date) {
      return "";
    }

    return new Date(
      date
    ).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =========================================
  // GET MESSAGE TYPE
  // =========================================

  const getMessageType = (item) => {
    return (
      item.messageType ||
      item.type ||
      ""
    ).toUpperCase();
  };

  // =========================================
  // ATTACHMENT URL
  // =========================================

  const getAttachmentUrl = (item) => {
    const url =
      item.attachmentUrl ||
      item.fileUrl ||
      item.url;

    if (!url) {
      return "";
    }

    if (url.startsWith("http")) {
      return url;
    }

    return `${API_BASE_URL}${url}`;
  };

  // =========================================
  // RENDER ATTACHMENT
  // =========================================

  const renderAttachment = (item) => {
    const type =
      getMessageType(item);

    const attachmentUrl =
      getAttachmentUrl(item);

    if (!attachmentUrl) {
      return null;
    }

    // IMAGE
    if (type === "IMAGE") {
      return (
        <a
          href={attachmentUrl}
          target="_blank"
          rel="noreferrer"
          className="admin-chat-image-wrapper"
        >
          <img
            src={attachmentUrl}
            alt={
              item.attachmentName ||
              "Image"
            }
            className="admin-chat-image"
          />
        </a>
      );
    }

    // AUDIO
    if (type === "AUDIO") {
      return (
        <audio
          controls
          src={attachmentUrl}
          className="admin-chat-audio"
        />
      );
    }

    // FILE
    if (type === "FILE") {
      return (
        <a
          href={attachmentUrl}
          target="_blank"
          rel="noreferrer"
          className="admin-chat-file"
        >
          <File size={18} />

          <span>
            {item.attachmentName ||
              "Attached file"}
          </span>
        </a>
      );
    }

    return null;
  };

  // =========================================
  // CALL DISPLAY NAME
  // =========================================

  const providerName =
    provider?.user?.name ||
    provider?.name ||
    "Provider";

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <div className="admin-chat-page">
        <div className="admin-chat-loading">
          Loading chat...
        </div>
      </div>
    );
  }

  // =========================================
  // UI
  // =========================================

  return (
    <div className="admin-chat-window">

      {/* =====================================
          HEADER
      ====================================== */}

      <div className="admin-chat-window-header">

        {/* BACK */}
        <button
          type="button"
          className="admin-chat-back"
          onClick={() =>
            navigate("/admin/chat")
          }
        >
          <ArrowLeft size={20} />
        </button>

        {/* AVATAR */}
        <div className="admin-chat-avatar">
          <UserRound size={21} />
        </div>

        {/* PROVIDER INFO */}
        <div className="admin-chat-header-info">
          <h2>
            {providerName}
          </h2>

          <p>
            {provider?.user?.email ||
              provider?.email ||
              ""}
          </p>
        </div>

        {/* HEADER ACTIONS */}
        <div className="admin-chat-header-actions">

          {/* AUDIO CALL */}
          <button
            type="button"
            className="admin-chat-header-call-button"
            title="Audio call"
            onClick={() =>
              startCall("AUDIO")
            }
            disabled={
              callState !== "IDLE"
            }
          >
            <Phone size={19} />
          </button>

          {/* VIDEO CALL */}
          <button
            type="button"
            className="admin-chat-header-call-button"
            title="Video call"
            onClick={() =>
              startCall("VIDEO")
            }
            disabled={
              callState !== "IDLE"
            }
          >
            <Video size={19} />
          </button>

          {/* SEARCH */}
          <button
            type="button"
            title="Search messages"
            onClick={() => {
              setSearchOpen(
                (current) =>
                  !current
              );

              if (searchOpen) {
                setSearchText("");
              }
            }}
          >
            {searchOpen ? (
              <X size={19} />
            ) : (
              <Search size={19} />
            )}
          </button>
        </div>
      </div>

      {/* =====================================
          CALL ERROR
      ====================================== */}

      {callError && (
        <div className="admin-chat-call-error">
          {callError}

          <button
            type="button"
            onClick={() =>
              setCallError("")
            }
            style={{
              marginLeft: "8px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "inherit",
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* =====================================
          INCOMING CALL
      ====================================== */}

      {callState === "INCOMING" &&
        incomingCall && (
          <div className="admin-chat-incoming-call">

            <div className="admin-chat-incoming-box">

              <div className="admin-chat-incoming-avatar">
                <UserRound size={34} />
              </div>

              <h3>
                {incomingCall.caller
                  ?.name ||
                  providerName}
              </h3>

              <p>
                Incoming{" "}
                {incomingCall.callType ===
                "VIDEO"
                  ? "video"
                  : "audio"}{" "}
                call
              </p>

              <div className="admin-chat-incoming-actions">

                {/* REJECT */}
                <button
                  type="button"
                  className="admin-chat-incoming-button reject"
                  onClick={rejectCall}
                >
                  <PhoneOff size={17} />
                  Reject
                </button>

                {/* ACCEPT */}
                <button
                  type="button"
                  className="admin-chat-incoming-button accept"
                  onClick={acceptCall}
                >
                  {incomingCall.callType ===
                  "VIDEO" ? (
                    <Video size={17} />
                  ) : (
                    <Phone size={17} />
                  )}

                  Accept
                </button>
              </div>
            </div>
          </div>
        )}

      {/* =====================================
          ACTIVE / OUTGOING CALL
      ====================================== */}

      {callState !== "IDLE" &&
        callState !== "INCOMING" && (
          <div
            className={`admin-chat-call-panel ${
              callType === "VIDEO"
                ? "video-call"
                : ""
            }`}
          >

            {/* VIDEO CALL */}
            {callType === "VIDEO" ? (
              <div className="admin-chat-video-area">

                {/* REMOTE VIDEO */}
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="admin-chat-remote-video"
                />

                {/* LOCAL VIDEO */}
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="admin-chat-local-video"
                />

                {/* STATUS */}
                <div className="admin-chat-call-status">
                  {callState ===
                  "CALLING"
                    ? "Calling..."
                    : callState ===
                      "CONNECTING"
                    ? "Connecting..."
                    : "Connected"}
                </div>

                {/* NAME */}
                <div
                  className="admin-chat-call-name"
                  style={{
                    position:
                      "absolute",
                    left: "20px",
                    bottom: "20px",
                    color: "#ffffff",
                    margin: 0,
                  }}
                >
                  {providerName}
                </div>

                {/* CONTROLS */}
                <div
                  className="admin-chat-call-controls"
                  style={{
                    position:
                      "absolute",
                    left: "50%",
                    bottom: "20px",
                    transform:
                      "translateX(-50%)",
                    margin: 0,
                  }}
                >

                  {/* MUTE */}
                  <button
                    type="button"
                    className={`admin-chat-call-control ${
                      isMuted
                        ? "active"
                        : ""
                    }`}
                    title={
                      isMuted
                        ? "Unmute"
                        : "Mute"
                    }
                    onClick={
                      handleToggleMute
                    }
                  >
                    {isMuted ? (
                      <MicOff
                        size={20}
                      />
                    ) : (
                      <Mic
                        size={20}
                      />
                    )}
                  </button>

                  {/* SPEAKER */}
                  <button
                    type="button"
                    className={`admin-chat-call-control ${
                      !isSpeakerOn
                        ? "active"
                        : ""
                    }`}
                    title={
                      isSpeakerOn
                        ? "Turn speaker off"
                        : "Turn speaker on"
                    }
                    onClick={
                      handleToggleSpeaker
                    }
                  >
                    {isSpeakerOn ? (
                      <Volume2
                        size={20}
                      />
                    ) : (
                      <VolumeX
                        size={20}
                      />
                    )}
                  </button>

                  {/* END / CANCEL */}
                  <button
                    type="button"
                    className="admin-chat-call-control end"
                    title={
                      callState ===
                      "CALLING"
                        ? "Cancel call"
                        : "End call"
                    }
                    onClick={
                      callState ===
                      "CALLING"
                        ? handleCancelCall
                        : handleEndCall
                    }
                  >
                    <PhoneOff
                      size={20}
                    />
                  </button>
                </div>
              </div>
            ) : (
              /* AUDIO CALL */
              <div className="admin-chat-audio-call">

                <div className="admin-chat-call-avatar">
                  <UserRound
                    size={40}
                  />
                </div>

                <div className="admin-chat-call-name">
                  {providerName}
                </div>

                <div className="admin-chat-call-type">
                  {callState ===
                  "CALLING"
                    ? "Calling..."
                    : callState ===
                      "CONNECTING"
                    ? "Connecting..."
                    : "Audio call"}
                </div>

                {/* Hidden audio element */}
                <audio
                  ref={remoteVideoRef}
                  autoPlay
                />

                {/* CONTROLS */}
                <div className="admin-chat-call-controls">

                  {/* MUTE */}
                  <button
                    type="button"
                    className={`admin-chat-call-control ${
                      isMuted
                        ? "active"
                        : ""
                    }`}
                    title={
                      isMuted
                        ? "Unmute"
                        : "Mute"
                    }
                    onClick={
                      handleToggleMute
                    }
                  >
                    {isMuted ? (
                      <MicOff
                        size={20}
                      />
                    ) : (
                      <Mic
                        size={20}
                      />
                    )}
                  </button>

                  {/* SPEAKER */}
                  <button
                    type="button"
                    className={`admin-chat-call-control ${
                      !isSpeakerOn
                        ? "active"
                        : ""
                    }`}
                    title={
                      isSpeakerOn
                        ? "Turn speaker off"
                        : "Turn speaker on"
                    }
                    onClick={
                      handleToggleSpeaker
                    }
                  >
                    {isSpeakerOn ? (
                      <Volume2
                        size={20}
                      />
                    ) : (
                      <VolumeX
                        size={20}
                      />
                    )}
                  </button>

                  {/* END / CANCEL */}
                  <button
                    type="button"
                    className="admin-chat-call-control end"
                    title={
                      callState ===
                      "CALLING"
                        ? "Cancel call"
                        : "End call"
                    }
                    onClick={
                      callState ===
                      "CALLING"
                        ? handleCancelCall
                        : handleEndCall
                    }
                  >
                    <PhoneOff
                      size={20}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      {/* =====================================
          SEARCH BAR
      ====================================== */}

      {searchOpen && (
        <div className="admin-chat-search">

          <Search size={17} />

          <input
            type="text"
            placeholder="Search messages..."
            value={searchText}
            onChange={(e) =>
              setSearchText(
                e.target.value
              )
            }
            autoFocus
          />

          {searchText && (
            <button
              type="button"
              onClick={() =>
                setSearchText("")
              }
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {/* =====================================
          ERROR
      ====================================== */}

      {error && (
        <div className="admin-chat-error">
          {error}
        </div>
      )}

      {/* =====================================
          MESSAGES
      ====================================== */}

      <div className="admin-chat-messages">

        {filteredMessages.length ===
        0 ? (
          <div className="admin-chat-empty">

            <div className="admin-chat-empty-icon">
              <UserRound
                size={36}
              />
            </div>

            <p>
              {searchText
                ? "No messages found."
                : "No messages yet."}
            </p>

            {!searchText && (
              <span>
                Start a conversation
                with this provider.
              </span>
            )}
          </div>
        ) : (
          filteredMessages.map(
            (item) => {
              /*
                Admin is the logged-in user.
                Therefore anything whose
                sender is NOT the provider
                is considered admin's message.
              */

              const isMine =
                String(
                  item.senderId
                ) !==
                String(
                  providerUserId
                );

              return (
                <div
                  key={item.id}
                  className={`admin-message-row ${
                    isMine
                      ? "mine"
                      : "received"
                  }`}
                >
                  <div className="admin-message-bubble">

                    {/* ATTACHMENT */}
                    {renderAttachment(
                      item
                    )}

                    {/* TEXT */}
                    {item.content && (
                      <p>
                        {item.content}
                      </p>
                    )}

                    {/* TIME */}
                    <span>
                      {formatTime(
                        item.createdAt
                      )}
                    </span>
                  </div>
                </div>
              );
            }
          )
        )}
      <div ref={messagesEndRef} />
      </div>

      {/* =====================================
          EMOJI PICKER
      ====================================== */}

      {showEmoji && (
        <div className="admin-chat-emoji-picker">

          {emojis.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() =>
                addEmoji(emoji)
              }
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* =====================================
          ATTACHMENT MENU
      ====================================== */}

      {showAttachmentMenu && (
        <div className="admin-chat-attachment-menu">

          <button
            type="button"
            onClick={() => {
              fileInputRef.current?.click();
            }}
          >
            <ImageIcon size={18} />

            <span>
              Image / File
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              fileInputRef.current?.click();
            }}
          >
            <Camera size={18} />

            <span>
              Attachment
            </span>
          </button>
        </div>
      )}

      {/* =====================================
          HIDDEN FILE INPUT
      ====================================== */}

      <input
        ref={fileInputRef}
        type="file"
        hidden
        accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.csv"
        onChange={handleFileSelect}
      />

      {/* =====================================
          INPUT AREA
      ====================================== */}

      <form
        className="admin-chat-input-area"
        onSubmit={sendMessage}
      >

        {/* ATTACHMENT */}
        <button
          type="button"
          className="admin-chat-input-icon"
          title="Attach file"
          onClick={() => {
            setShowAttachmentMenu(
              (current) =>
                !current
            );

            setShowEmoji(false);
          }}
          disabled={sending}
        >
          <Paperclip size={19} />
        </button>

        {/* EMOJI */}
        <button
          type="button"
          className="admin-chat-input-icon"
          title="Emoji"
          onClick={() => {
            setShowEmoji(
              (current) =>
                !current
            );

            setShowAttachmentMenu(
              false
            );
          }}
          disabled={sending}
        >
          <Smile size={19} />
        </button>

        {/* MESSAGE */}
        <input
          ref={messageInputRef}
          type="text"
          placeholder={
            recording
              ? "Recording voice message..."
              : "Type a message..."
          }
          value={message}
          onChange={(e) =>
            setMessage(
              e.target.value
            )
          }
          disabled={
            recording || sending
          }
        />

        {/* VOICE */}
        <button
          type="button"
          className={`admin-chat-input-icon ${
            recording
              ? "recording"
              : ""
          }`}
          title={
            recording
              ? "Stop recording"
              : "Voice message"
          }
          onClick={
            recording
              ? stopRecording
              : startRecording
          }
          disabled={sending}
        >
          <Mic size={19} />
        </button>

        {/* SEND */}
        <button
          type="submit"
          disabled={
            !message.trim() ||
            sending ||
            recording
          }
        >
          <Send size={19} />
        </button>
      </form>
    </div>
  );
}

export default ChatWindow;