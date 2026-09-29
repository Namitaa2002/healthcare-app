import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import {
  ArrowLeft,
  CheckCheck,
  Download,
  FileText,
  Loader2,
  MessageCircle,
  Mic,
  MicOff,
  MoreVertical,
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
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import socket from "../../services/socket";

import "../../styles/patientChat.css";

const API_BASE_URL = "http://localhost:5000";

const RTC_CONFIGURATION = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
};

function ProviderChatWindow() {
  console.log("PROVIDER CHAT WINDOW LOADED");
  const navigate = useNavigate();
  const { patientUserId } = useParams();
  const { user } = useAuth();

  const messagesContainerRef = useRef(null);
  const messagesBottomRef = useRef(null);
  const fileInputRef = useRef(null);

  // =========================================
  // WEBRTC REFS
  // =========================================

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const pendingIceCandidatesRef = useRef([]);

  const activeCallIdRef = useRef(null);
  const activeCallTypeRef = useRef(null);

  // =========================================
  // VOICE RECORDING REFS
  // =========================================

  const mediaRecorderRef = useRef(null);
  const recordingChunksRef = useRef([]);
  const recordingStreamRef = useRef(null);
  const recordingTimerRef = useRef(null);

  // =========================================
  // CHAT STATE
  // =========================================

  const [recipient, setRecipient] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);

  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendingFile, setSendingFile] = useState(false);

  const [error, setError] = useState("");

  // =========================================
  // SEARCH / MENU / EMOJI STATE
  // =========================================

  const [showMessageSearch, setShowMessageSearch] =
    useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  const [showMoreMenu, setShowMoreMenu] =
    useState(false);

  const [showEmojiPicker, setShowEmojiPicker] =
    useState(false);

  const [showPatientInfo, setShowPatientInfo] =
    useState(false);

  // =========================================
  // CALL STATE
  // =========================================

  const [callState, setCallState] = useState("IDLE");
  const [callType, setCallType] = useState(null);

  const [incomingCall, setIncomingCall] =
    useState(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] =
    useState(true);

  const [callError, setCallError] = useState("");

  // =========================================
  // VOICE RECORDING STATE
  // =========================================

  const [isRecording, setIsRecording] =
    useState(false);

  const [recordingSeconds, setRecordingSeconds] =
    useState(0);

  const [uploadingVoice, setUploadingVoice] =
    useState(false);

  // =========================================
  // EMOJIS
  // =========================================

  const emojis = [
    "😀",
    "😃",
    "😄",
    "😁",
    "😆",
    "😅",
    "😂",
    "🤣",
    "😊",
    "😇",
    "🙂",
    "🙃",
    "😉",
    "😌",
    "😍",
    "🥰",
    "😘",
    "😗",
    "😙",
    "😚",
    "😋",
    "😛",
    "😝",
    "😜",
    "🤪",
    "🤨",
    "🧐",
    "🤓",
    "😎",
    "🤩",
    "🥳",
    "😏",
    "😢",
    "😭",
    "😤",
    "😡",
    "😱",
    "😮",
    "😴",
    "🤗",
    "🤔",
    "👍",
    "👎",
    "👏",
    "🙏",
    "❤️",
    "💙",
    "💚",
    "💛",
    "🧡",
    "🤍",
    "💕",
    "💯",
    "🎉",
    "🔥",
    "✨",
    "✅",
    "❌",
  ];

  // =========================================
  // CREATE / GET CONVERSATION
  // =========================================

  useEffect(() => {
    if (!patientUserId) {
      return;
    }

    const createConversation = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.post(
          "/chat/conversation",
          {
            userId: patientUserId,
          }
        );

        const conversationData =
          response.data?.data;

        setConversation(conversationData);

        const selectedRecipient =
          conversationData?.participants?.find(
            (participant) =>
              String(participant.user?.id) ===
              String(patientUserId)
          )?.user;

          console.log("CONVERSATION DATA:", conversationData);
          console.log("RECIPIENT:", selectedRecipient);

        if (!selectedRecipient) {
          setError(
            "User information could not be found."
          );
          return;
        }

        setRecipient(selectedRecipient);
      } catch (error) {
        console.error(
          "Create provider conversation error:",
          error
        );

        setError(
          error.response?.data?.message ||
            "Unable to open conversation."
        );
      } finally {
        setLoading(false);
      }
    };

    createConversation();
  }, [patientUserId]);

  // =========================================
  // FETCH MESSAGES
  // =========================================

  useEffect(() => {
    if (!conversation?.id) {
      return;
    }

    const fetchMessages = async () => {
      try {
        setError("");

        const response = await api.get(
          `/chat/conversation/${conversation.id}/messages`
        );

        setMessages(
          response.data?.data || []
        );

        await api.patch(
          `/chat/conversation/${conversation.id}/read`
        );
      } catch (error) {
        console.error(
          "Fetch provider messages error:",
          error
        );

        setError(
          error.response?.data?.message ||
            "Unable to load messages."
        );
      }
    };

    fetchMessages();
  }, [conversation]);

  // =========================================
// SOCKET
// =========================================

useEffect(() => {
  if (!conversation?.id) {
    return;
  }

  if (!socket.connected) {
    socket.connect();
  }

  socket.emit(
    "join-conversation",
    conversation.id
  );

  const handleNewMessage = (data) => {
    // Backend can send the message directly
    // or inside a message property.
    const newMessage =
      data?.message || data;

    if (!newMessage) {
      return;
    }

    // Make sure this message belongs
    // to the currently opened conversation.
    if (
      newMessage.conversationId &&
      String(newMessage.conversationId) !==
        String(conversation.id)
    ) {
      return;
    }

    setMessages((currentMessages) => {
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
    });

    // If message is received from the
    // other user, mark conversation as read.
    if (
      String(newMessage.senderId) !==
      String(user?.id)
    ) {
      api
        .patch(
          `/chat/conversation/${conversation.id}/read`
        )
        .catch((error) => {
          console.error(
            "Mark messages as read error:",
            error
          );
        });
    }
  };

  // Event emitted when message is sent
  // inside the conversation room.
  socket.on(
    "new-message",
    handleNewMessage
  );

  // Event emitted directly to the
  // other participant's user room.
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
      "new-message",
      handleNewMessage
    );

    socket.off(
      "new-chat-message",
      handleNewMessage
    );
  };
}, [conversation?.id, user?.id]);

  // =========================================
  // AUTO SCROLL
  // =========================================

  useLayoutEffect(() => {
    if (!messages.length) {
      return;
    }

    const container =
      messagesContainerRef.current;

    const bottom =
      messagesBottomRef.current;

    if (!container || !bottom) {
      return;
    }

    requestAnimationFrame(() => {
      bottom.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    });
  }, [messages]);

  // =========================================
  // SEND TEXT MESSAGE
  // =========================================

  const handleSendMessage = async (
    event
  ) => {
    event.preventDefault();

    const trimmedMessage =
      message.trim();

    if (
      !trimmedMessage ||
      !conversation?.id ||
      sending ||
      sendingFile ||
      uploadingVoice
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
            content: trimmedMessage,
          }
        );

      const sentMessage =
        response.data?.data;

      if (sentMessage) {
        setMessages(
          (currentMessages) => {
            const alreadyExists =
              currentMessages.some(
                (item) =>
                  item.id ===
                  sentMessage.id
              );

            if (alreadyExists) {
              return currentMessages;
            }

            return [
              ...currentMessages,
              sentMessage,
            ];
          }
        );
      }

      setMessage("");
      setShowEmojiPicker(false);
    } catch (error) {
      console.error(
        "Provider send message error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to send message."
      );
    } finally {
      setSending(false);
    }
  };

  // =========================================
  // FILE SELECT
  // =========================================

  const handleFileSelect = async (
    event
  ) => {
    const selectedFile =
      event.target.files?.[0];

    event.target.value = "";

    if (!selectedFile) {
      return;
    }

    if (!conversation?.id) {
      setError(
        "Conversation is not ready."
      );
      return;
    }

    const maxFileSize =
      10 * 1024 * 1024;

    if (
      selectedFile.size >
      maxFileSize
    ) {
      setError(
        "File size cannot exceed 10 MB."
      );
      return;
    }

    try {
      setSendingFile(true);
      setError("");
      setShowEmojiPicker(false);

      const formData =
        new FormData();

      formData.append(
        "file",
        selectedFile
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

      const sentMessage =
        response.data?.data;

      if (sentMessage) {
        setMessages(
          (currentMessages) => {
            const alreadyExists =
              currentMessages.some(
                (item) =>
                  item.id ===
                  sentMessage.id
              );

            if (alreadyExists) {
              return currentMessages;
            }

            return [
              ...currentMessages,
              sentMessage,
            ];
          }
        );
      }
    } catch (error) {
      console.error(
        "Provider file upload error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to upload file."
      );
    } finally {
      setSendingFile(false);
    }
  };

  // =========================================
  // ATTACH FILE
  // =========================================

  const handleAttachFile = () => {
    if (
      !conversation?.id ||
      sending ||
      sendingFile ||
      uploadingVoice ||
      isRecording
    ) {
      return;
    }

    setShowEmojiPicker(false);

    fileInputRef.current?.click();
  };

  // =========================================
  // ENTER TO SEND
  // =========================================

  const handleMessageKeyDown = (
    event
  ) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      handleSendMessage(event);
    }
  };

  // =========================================
  // FORMAT MESSAGE TIME
  // =========================================

  const formatMessageTime = (
    createdAt
  ) => {
    if (!createdAt) {
      return "";
    }

    return new Date(
      createdAt
    ).toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // =========================================
  // GET ATTACHMENT URL
  // =========================================

  const getAttachmentUrl = (
    attachmentUrl
  ) => {
    if (!attachmentUrl) {
      return "";
    }

    if (
      attachmentUrl.startsWith(
        "http://"
      ) ||
      attachmentUrl.startsWith(
        "https://"
      )
    ) {
      return attachmentUrl;
    }

    return `${API_BASE_URL}${attachmentUrl}`;
  };

  // =========================================
  // IMAGE MESSAGE
  // =========================================

  const isImageMessage = (
    item
  ) => {
    return (
      item.messageType ===
        "IMAGE" ||
      item.attachmentType?.startsWith(
        "image/"
      )
    );
  };

  // =========================================
  // AUDIO MESSAGE
  // =========================================

  const isAudioMessage = (
    item
  ) => {
    return (
      item.messageType ===
        "AUDIO" ||
      item.attachmentType?.startsWith(
        "audio/"
      )
    );
  };

  // =========================================
  // FILE MESSAGE
  // =========================================

  const isFileMessage = (
    item
  ) => {
    return (
      item.messageType ===
      "FILE"
    );
  };

  // =========================================
  // FORMAT RECORDING TIME
  // =========================================

  const formatRecordingTime = (
    seconds
  ) => {
    const minutes =
      Math.floor(seconds / 60);

    const remainingSeconds =
      seconds % 60;

    return `${String(
      minutes
    ).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  // =========================================
  // CLEAR RECORDING TIMER
  // =========================================

  const clearRecordingTimer = () => {
    if (
      recordingTimerRef.current
    ) {
      clearInterval(
        recordingTimerRef.current
      );

      recordingTimerRef.current =
        null;
    }
  };

  // =========================================
  // STOP RECORDING STREAM
  // =========================================

  const stopRecordingStream = () => {
    if (
      recordingStreamRef.current
    ) {
      recordingStreamRef.current
        .getTracks()
        .forEach((track) =>
          track.stop()
        );

      recordingStreamRef.current =
        null;
    }
  };

  // =========================================
  // UPLOAD VOICE MESSAGE
  // =========================================

  const uploadVoiceMessage = async (
    blob
  ) => {
    if (
      !blob ||
      blob.size === 0 ||
      !conversation?.id
    ) {
      return;
    }

    try {
      setUploadingVoice(true);
      setError("");

      const extension =
        blob.type.includes("ogg")
          ? "ogg"
          : "webm";

      const voiceFile =
        new File(
          [blob],
          `voice-message-${Date.now()}.${extension}`,
          {
            type:
              blob.type ||
              "audio/webm",
          }
        );

      const formData =
        new FormData();

      formData.append(
        "file",
        voiceFile
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

      const sentMessage =
        response.data?.data;

      if (sentMessage) {
        setMessages(
          (currentMessages) => {
            const alreadyExists =
              currentMessages.some(
                (item) =>
                  item.id ===
                  sentMessage.id
              );

            if (alreadyExists) {
              return currentMessages;
            }

            return [
              ...currentMessages,
              sentMessage,
            ];
          }
        );
      }
    } catch (error) {
      console.error(
        "Provider voice upload error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to send voice message."
      );
    } finally {
      setUploadingVoice(false);
    }
  };

  // =========================================
  // START VOICE RECORDING
  // =========================================

  const startVoiceRecording =
    async () => {
      if (
        isRecording ||
        uploadingVoice ||
        sending ||
        sendingFile ||
        !conversation?.id
      ) {
        return;
      }

      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices
          .getUserMedia
      ) {
        setError(
          "Microphone access is not supported by this browser."
        );
        return;
      }

      if (!window.MediaRecorder) {
        setError(
          "Voice recording is not supported by this browser."
        );
        return;
      }

      try {
        setError("");
        setShowEmojiPicker(false);
        setShowMoreMenu(false);

        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              audio: true,
            }
          );

        recordingStreamRef.current =
          stream;

        recordingChunksRef.current =
          [];

        let mimeType =
          "audio/webm;codecs=opus";

        if (
          !MediaRecorder.isTypeSupported(
            mimeType
          )
        ) {
          mimeType = "audio/webm";
        }

        if (
          !MediaRecorder.isTypeSupported(
            mimeType
          )
        ) {
          mimeType = "";
        }

        const recorder =
          mimeType
            ? new MediaRecorder(
                stream,
                {
                  mimeType,
                }
              )
            : new MediaRecorder(
                stream
              );

        mediaRecorderRef.current =
          recorder;

        recorder.ondataavailable =
          (event) => {
            if (
              event.data &&
              event.data.size > 0
            ) {
              recordingChunksRef.current.push(
                event.data
              );
            }
          };

        recorder.onstop = async () => {
          clearRecordingTimer();
          stopRecordingStream();

          const finalMimeType =
            recorder.mimeType ||
            "audio/webm";

          const audioBlob =
            new Blob(
              recordingChunksRef.current,
              {
                type:
                  finalMimeType,
              }
            );

          recordingChunksRef.current =
            [];

          mediaRecorderRef.current =
            null;

          setIsRecording(false);
          setRecordingSeconds(0);

          await uploadVoiceMessage(
            audioBlob
          );
        };

        recorder.onerror = (
          event
        ) => {
          console.error(
            "Voice recorder error:",
            event
          );

          clearRecordingTimer();
          stopRecordingStream();

          mediaRecorderRef.current =
            null;

          setIsRecording(false);
          setRecordingSeconds(0);

          setError(
            "Unable to record voice message."
          );
        };

        recorder.start();

        setIsRecording(true);
        setRecordingSeconds(0);

        recordingTimerRef.current =
          setInterval(() => {
            setRecordingSeconds(
              (seconds) =>
                seconds + 1
            );
          }, 1000);
      } catch (error) {
        console.error(
          "Start voice recording error:",
          error
        );

        stopRecordingStream();
        clearRecordingTimer();

        setIsRecording(false);
        setRecordingSeconds(0);

        if (
          error?.name ===
          "NotAllowedError"
        ) {
          setError(
            "Microphone permission was denied. Please allow microphone access for localhost."
          );
        } else if (
          error?.name ===
          "NotFoundError"
        ) {
          setError(
            "No microphone was found on this device."
          );
        } else {
          setError(
            "Unable to start voice recording."
          );
        }
      }
    };

  // =========================================
  // STOP VOICE RECORDING
  // =========================================

  const stopVoiceRecording =
    () => {
      const recorder =
        mediaRecorderRef.current;

      if (!recorder) {
        return;
      }

      if (
        recorder.state !==
        "inactive"
      ) {
        recorder.stop();
      }
    };

  // =========================================
  // CANCEL VOICE RECORDING
  // =========================================

  const cancelVoiceRecording =
    () => {
      const recorder =
        mediaRecorderRef.current;

      clearRecordingTimer();
      stopRecordingStream();

      if (recorder) {
        recorder.ondataavailable =
          null;

        recorder.onstop = null;
        recorder.onerror = null;

        if (
          recorder.state !==
          "inactive"
        ) {
          recorder.stop();
        }
      }

      mediaRecorderRef.current =
        null;

      recordingChunksRef.current =
        [];

      setIsRecording(false);
      setRecordingSeconds(0);
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

    peerConnection.onicecandidate =
      (event) => {
        if (
          event.candidate
        ) {
          socket.emit(
            "ice-candidate",
            {
              to: targetUserId,
              callId:
                currentCallId,
              candidate:
                event.candidate,
            }
          );
        }
      };

    peerConnection.ontrack =
      (event) => {
        const remoteStream =
          event.streams?.[0];

        if (!remoteStream) {
          return;
        }

        remoteStreamRef.current =
          remoteStream;

        if (
          remoteVideoRef.current
        ) {
          remoteVideoRef.current.srcObject =
            remoteStream;

          remoteVideoRef.current
            .play()
            .catch(() => {});
        }
      };

    peerConnection.onconnectionstatechange =
      () => {
        const state =
          peerConnection.connectionState;

        console.log(
          "Provider WebRTC connection state:",
          state
        );

        if (
          state === "failed" ||
          state === "closed"
        ) {
          cleanupCall(false);
        }
      };

    if (
      localStreamRef.current
    ) {
      localStreamRef.current
        .getTracks()
        .forEach((track) => {
          peerConnection.addTrack(
            track,
            localStreamRef.current
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
    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices
        .getUserMedia
    ) {
      throw new Error(
        "Media devices are not supported."
      );
    }

    const constraints = {
      audio: true,
      video:
        currentCallType ===
        "VIDEO",
    };

    const stream =
      await navigator.mediaDevices.getUserMedia(
        constraints
      );

    localStreamRef.current =
      stream;

    if (
      localVideoRef.current
    ) {
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
      !patientUserId ||
      !user?.id ||
      callState !== "IDLE"
    ) {
      return;
    }

    const currentCallId =
      `call-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;

    try {
      setCallError("");
      setShowMoreMenu(false);
      setShowEmojiPicker(false);
      setShowMessageSearch(false);

      activeCallIdRef.current =
        currentCallId;

      activeCallTypeRef.current =
        selectedCallType;

      setCallType(
        selectedCallType
      );

      setCallState("CALLING");

      await getLocalMedia(
        selectedCallType
      );

      const peerConnection =
        createPeerConnection(
          patientUserId,
          currentCallId,
          selectedCallType
        );

      const offer =
        await peerConnection.createOffer();

      await peerConnection.setLocalDescription(
        offer
      );

      socket.emit(
        "call-user",
        {
          to: patientUserId,
          callId:
            currentCallId,
          callType:
            selectedCallType,
          offer,
          caller: {
            id: user.id,
            name:
              user.name ||
              "Provider",
            role: user.role,
          },
        }
      );
    } catch (error) {
      console.error(
        "Provider start call error:",
        error
      );

      if (
        error?.name ===
        "NotAllowedError"
      ) {
        setCallError(
          "Microphone/camera permission was denied. Please allow access for localhost."
        );
      } else if (
        error?.name ===
        "NotFoundError"
      ) {
        setCallError(
          "Requested microphone or camera was not found."
        );
      } else {
        setCallError(
          error?.message ||
            "Unable to start call."
        );
      }

      cleanupCall(false);
    }
  };

  // =========================================
  // INCOMING CALL
  // =========================================

  useEffect(() => {
    const handleIncomingCall =
      (data) => {
        if (!data?.callId) {
          return;
        }

        if (
          callState !== "IDLE"
        ) {
          socket.emit(
            "call-busy",
            {
              to: data.from,
              callId:
                data.callId,
            }
          );

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
  }, [callState]);

  // =========================================
  // ACCEPT INCOMING CALL
  // =========================================

  const acceptIncomingCall =
    async () => {
      if (!incomingCall) {
        return;
      }

      const currentCall =
        incomingCall;

      try {
        setCallError("");
        setCallState("CONNECTING");

        activeCallIdRef.current =
          currentCall.callId;

        activeCallTypeRef.current =
          currentCall.callType;

        setCallType(
          currentCall.callType
        );

        await getLocalMedia(
          currentCall.callType
        );

        const peerConnection =
          createPeerConnection(
            currentCall.from,
            currentCall.callId,
            currentCall.callType
          );

        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(
            currentCall.offer
          )
        );

        const answer =
          await peerConnection.createAnswer();

        await peerConnection.setLocalDescription(
          answer
        );

        socket.emit(
          "accept-call",
          {
            to: currentCall.from,
            callId:
              currentCall.callId,
            answer,
          }
        );

        for (
          const candidate of
            pendingIceCandidatesRef.current
        ) {
          try {
            await peerConnection.addIceCandidate(
              candidate
            );
          } catch (error) {
            console.error(
              "Provider pending ICE error:",
              error
            );
          }
        }

        pendingIceCandidatesRef.current =
          [];

        setIncomingCall(null);
        setCallState("ACTIVE");
      } catch (error) {
        console.error(
          "Provider accept call error:",
          error
        );

        setCallError(
          error?.message ||
            "Unable to accept call."
        );

        rejectIncomingCall(
          currentCall
        );
      }
    };

  // =========================================
  // REJECT INCOMING CALL
  // =========================================

  const rejectIncomingCall =
    (call = incomingCall) => {
      if (!call) {
        return;
      }

      socket.emit(
        "reject-call",
        {
          to: call.from,
          callId:
            call.callId,
          reason:
            "Call rejected by provider",
        }
      );

      setIncomingCall(null);
      cleanupCall(false);
    };

  // =========================================
  // CALL ACCEPTED
  // =========================================

  useEffect(() => {
    const handleCallAccepted =
      async (data) => {
        if (
          !data?.callId ||
          data.callId !==
            activeCallIdRef.current
        ) {
          return;
        }

        const peerConnection =
          peerConnectionRef.current;

        if (!peerConnection) {
          return;
        }

        try {
          await peerConnection.setRemoteDescription(
            new RTCSessionDescription(
              data.answer
            )
          );

          for (
            const candidate of
              pendingIceCandidatesRef.current
          ) {
            try {
              await peerConnection.addIceCandidate(
                candidate
              );
            } catch (error) {
              console.error(
                "Provider pending ICE error:",
                error
              );
            }
          }

          pendingIceCandidatesRef.current =
            [];

          setCallState("ACTIVE");
        } catch (error) {
          console.error(
            "Provider call accepted error:",
            error
          );

          setCallError(
            "Unable to establish the call."
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
    const handleIceCandidate =
      async (data) => {
        if (
          !data?.callId ||
          data.callId !==
            activeCallIdRef.current ||
          !data.candidate
        ) {
          return;
        }

        const peerConnection =
          peerConnectionRef.current;

        if (
          !peerConnection
        ) {
          return;
        }

        if (
          peerConnection.remoteDescription
        ) {
          try {
            await peerConnection.addIceCandidate(
              new RTCIceCandidate(
                data.candidate
              )
            );
          } catch (error) {
            console.error(
              "Provider ICE candidate error:",
              error
            );
          }
        } else {
          pendingIceCandidatesRef.current.push(
            new RTCIceCandidate(
              data.candidate
            )
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
    const handleCallRejected =
      (data) => {
        if (
          data?.callId !==
          activeCallIdRef.current
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
    const handleCallBusy =
      (data) => {
        if (
          data?.callId !==
          activeCallIdRef.current
        ) {
          return;
        }

        setCallError(
          `${recipient?.name || "User"} is currently busy on another call.`
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
  }, [recipient]);

  // =========================================
  // CALL ENDED
  // =========================================

  useEffect(() => {
    const handleCallEnded =
      (data) => {
        if (
          data?.callId !==
          activeCallIdRef.current
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
    const handleCallCancelled =
      (data) => {
        if (
          data?.callId !==
          activeCallIdRef.current
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
      patientUserId &&
      currentCallId
    ) {
      socket.emit(
        "end-call",
        {
          to: patientUserId,
          callId:
            currentCallId,
        }
      );
    }

    if (
      peerConnectionRef.current
    ) {
      peerConnectionRef.current.close();

      peerConnectionRef.current =
        null;
    }

    if (
      localStreamRef.current
    ) {
      localStreamRef.current
        .getTracks()
        .forEach((track) =>
          track.stop()
        );

      localStreamRef.current =
        null;
    }

    if (
      remoteStreamRef.current
    ) {
      remoteStreamRef.current
        .getTracks()
        .forEach((track) =>
          track.stop()
        );

      remoteStreamRef.current =
        null;
    }

    if (
      localVideoRef.current
    ) {
      localVideoRef.current.srcObject =
        null;
    }

    if (
      remoteVideoRef.current
    ) {
      remoteVideoRef.current.srcObject =
        null;
    }

    pendingIceCandidatesRef.current =
      [];

    activeCallIdRef.current =
      null;

    activeCallTypeRef.current =
      null;

    setIncomingCall(null);
    setCallType(null);
    setCallState("IDLE");
    setIsMuted(false);
    setIsSpeakerOn(true);
  };

  // =========================================
  // END CALL
  // =========================================

  const handleEndCall = () => {
    cleanupCall(true);
  };

  // =========================================
  // CANCEL OUTGOING CALL
  // =========================================

  const handleCancelCall = () => {
    const currentCallId =
      activeCallIdRef.current;

    if (
      patientUserId &&
      currentCallId
    ) {
      socket.emit(
        "cancel-call",
        {
          to: patientUserId,
          callId:
            currentCallId,
        }
      );
    }

    cleanupCall(false);
  };

  // =========================================
  // MUTE
  // =========================================

  const handleToggleMute = () => {
    const stream =
      localStreamRef.current;

    if (!stream) {
      return;
    }

    const audioTracks =
      stream.getAudioTracks();

    audioTracks.forEach(
      (track) => {
        track.enabled =
          isMuted;
      }
    );

    setIsMuted(
      (current) => !current
    );
  };

  // =========================================
  // SPEAKER
  // =========================================

  const handleToggleSpeaker =
    () => {
      const media =
        remoteVideoRef.current;

      if (!media) {
        return;
      }

      media.muted =
        isSpeakerOn;

      setIsSpeakerOn(
        (current) => !current
      );
    };

  // =========================================
  // SEARCH
  // =========================================

  const handleSearchMessages =
    () => {
      setShowMoreMenu(false);
      setShowMessageSearch(
        (current) => !current
      );
    };

  const handleCloseMessageSearch =
    () => {
      setSearchQuery("");
      setShowMessageSearch(false);
    };

  // =========================================
  // MORE OPTIONS
  // =========================================

  const handleMoreOptions = () => {
    setShowEmojiPicker(false);
    setShowMoreMenu(
      (current) => !current
    );
  };

  const handlePatientInfo = () => {
    setShowMoreMenu(false);
    setShowPatientInfo(true);
  };

  // =========================================
  // EMOJI
  // =========================================

  const handleEmojiClick = (
    emoji
  ) => {
    setMessage(
      (currentMessage) =>
        `${currentMessage}${emoji}`
    );

    setShowEmojiPicker(false);
  };

  // =========================================
  // FILTER MESSAGES
  // =========================================

  const filteredMessages =
    searchQuery.trim()
      ? messages.filter((item) => {
          const query =
            searchQuery
              .trim()
              .toLowerCase();

          return (
            item.content
              ?.toLowerCase()
              .includes(query) ||
            item.attachmentName
              ?.toLowerCase()
              .includes(query)
          );
        })
      : messages;

  // =========================================
  // CLOSE MENUS WHEN ESC PRESSED
  // =========================================

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key !== "Escape") {
        return;
      }

      setShowMoreMenu(false);
      setShowEmojiPicker(false);
      setShowPatientInfo(false);
      setShowMessageSearch(false);
      setSearchQuery("");
    };

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <div className="patient-chat-page">
        <div className="patient-chat-loading">
          <Loader2
            size={22}
            className="patient-chat-spinner"
          />

          <span>
            Opening conversation...
          </span>
        </div>
      </div>
    );
  }

  // =========================================
  // ERROR
  // =========================================

  if (error && !recipient) {
    return (
      <div className="patient-chat-page">
        <button
          type="button"
          className="patient-chat-back-button"
          onClick={() =>
            navigate("/provider/chat")
          }
        >
          <ArrowLeft size={17} />
          Back to patients
        </button>

        <div className="patient-chat-error">
          {error}
        </div>
      </div>
    );
  }

  // =========================================
  // MAIN UI
  // =========================================

  return (
    <div className="patient-chat-page patient-chat-window-page">
      <div className="patient-chat-main-card">

        {/* =========================================
            HEADER
        ========================================= */}

        <div className="patient-chat-header-bar">
          <div className="patient-chat-header-left">

            <button
              type="button"
              className="patient-chat-back-icon"
              onClick={() =>
                navigate("/provider/chat")
              }
              title="Back"
            >
              <ArrowLeft size={19} />
            </button>

            <div className="patient-chat-header-avatar">
              <UserRound size={23} />
            </div>

            <div className="patient-chat-header-info">
              <strong>
                {recipient?.name || "User"}
              </strong>

              <span>
                <i className="online"></i>

                {recipient?.role ===
                "ORGANIZATION_ADMIN"
                  ? "Admin"
                  : "Patient"}
              </span>
            </div>
          </div>

          <div className="patient-chat-header-actions">

            {/* AUDIO CALL */}

            <button
              type="button"
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
              title="Video call"
              onClick={() =>
                startCall("VIDEO")
              }
              disabled={
                callState !== "IDLE"
              }
            >
              <Video size={20} />
            </button>

            {/* SEARCH */}

            <button
              type="button"
              title="Search messages"
              className={
                showMessageSearch
                  ? "active"
                  : ""
              }
              onClick={
                handleSearchMessages
              }
            >
              <Search size={19} />
            </button>

            {/* MORE */}

            <div className="provider-chat-more-wrapper">

              <button
                type="button"
                title="More options"
                className={
                  showMoreMenu
                    ? "active"
                    : ""
                }
                onClick={
                  handleMoreOptions
                }
              >
                <MoreVertical size={20} />
              </button>

              {showMoreMenu && (
                <div className="provider-chat-more-menu">

                  <button
                    type="button"
                    onClick={
                      handleSearchMessages
                    }
                  >
                    <Search size={17} />

                    <span>
                      Search messages
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={
                      handlePatientInfo
                    }
                  >
                    <UserRound size={17} />

                    <span>
                      User details
                    </span>
                  </button>

                  <div className="provider-chat-more-divider" />

                  <button
                    type="button"
                    onClick={() =>
                      setShowMoreMenu(false)
                    }
                  >
                    <X size={17} />

                    <span>
                      Close menu
                    </span>
                  </button>

                </div>
              )}

            </div>
          </div>
        </div>

        {/* =========================================
            SEARCH BAR
        ========================================= */}

        {showMessageSearch && (
          <div className="provider-chat-search-bar">

            <Search size={18} />

            <input
              type="text"
              autoFocus
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(
                  event.target.value
                )
              }
            />

            {searchQuery && (
              <span className="provider-chat-search-count">
                {
                  filteredMessages.length
                }
              </span>
            )}

            <button
              type="button"
              title="Close search"
              onClick={
                handleCloseMessageSearch
              }
            >
              <X size={17} />
            </button>

          </div>
        )}

        {/* =========================================
            CALL ERROR
        ========================================= */}

        {callError && (
          <div className="patient-chat-inline-error">
            <span>
              {callError}
            </span>

            <button
              type="button"
              onClick={() =>
                setCallError("")
              }
              title="Close"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* =========================================
            INCOMING CALL
        ========================================= */}

        {callState ===
          "INCOMING" &&
          incomingCall && (
            <div className="provider-chat-incoming-call">

              <div className="provider-chat-incoming-avatar">
                <UserRound size={28} />
              </div>

              <div className="provider-chat-incoming-info">
                <strong>
                  {incomingCall.caller?.name ||
                    recipient?.name ||
                    "User"}
                </strong>

                <span>
                  Incoming{" "}
                  {incomingCall.callType ===
                  "VIDEO"
                    ? "video"
                    : "audio"}{" "}
                  call
                </span>
              </div>

              <div className="provider-chat-incoming-actions">

                <button
                  type="button"
                  className="provider-chat-call-reject"
                  onClick={() =>
                    rejectIncomingCall()
                  }
                  title="Reject"
                >
                  <PhoneOff
                    size={19}
                  />
                </button>

                <button
                  type="button"
                  className="provider-chat-call-accept"
                  onClick={
                    acceptIncomingCall
                  }
                  title="Accept"
                >
                  <Phone size={19} />
                </button>

              </div>
            </div>
          )}

        {/* =========================================
            ACTIVE CALL
        ========================================= */}

        {(callState ===
          "CALLING" ||
          callState ===
            "CONNECTING" ||
          callState ===
            "ACTIVE") && (
          <div
            className={`provider-chat-call-panel ${
              callType === "VIDEO"
                ? "video-call"
                : "audio-call"
            }`}
          >

            {callType ===
              "VIDEO" ? (
              <div className="provider-chat-video-area">

                <video
                  ref={
                    remoteVideoRef
                  }
                  autoPlay
                  playsInline
                  className="provider-chat-remote-video"
                />

                <video
                  ref={
                    localVideoRef
                  }
                  autoPlay
                  muted
                  playsInline
                  className="provider-chat-local-video"
                />

                {callState !==
                  "ACTIVE" && (
                  <div className="provider-chat-call-status">
                    {callState ===
                    "CALLING"
                      ? "Calling..."
                      : "Connecting..."}
                  </div>
                )}

                <div className="provider-chat-call-name">
                  {recipient?.name ||
                    "User"}
                </div>

                <div className="provider-chat-call-controls">

                  <button
                    type="button"
                    onClick={
                      handleToggleMute
                    }
                    title={
                      isMuted
                        ? "Unmute"
                        : "Mute"
                    }
                  >
                    {isMuted ? (
                      <MicOff
                        size={19}
                      />
                    ) : (
                      <Mic
                        size={19}
                      />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={
                      handleToggleSpeaker
                    }
                    title={
                      isSpeakerOn
                        ? "Mute speaker"
                        : "Turn speaker on"
                    }
                  >
                    {isSpeakerOn ? (
                      <Volume2
                        size={19}
                      />
                    ) : (
                      <VolumeX
                        size={19}
                      />
                    )}
                  </button>

                  <button
                    type="button"
                    className="provider-chat-end-call"
                    onClick={
                      handleEndCall
                    }
                    title="End call"
                  >
                    <PhoneOff
                      size={19}
                    />
                  </button>

                </div>
              </div>
            ) : (
              <div className="provider-chat-audio-call">

                <div className="provider-chat-audio-avatar">
                  <UserRound
                    size={42}
                  />
                </div>

                <strong>
                  {recipient?.name ||
                    "User"}
                </strong>

                <span>
                  {callState ===
                  "CALLING"
                    ? "Calling..."
                    : callState ===
                        "CONNECTING"
                      ? "Connecting..."
                      : "Audio call"}
                </span>

                <audio
                  ref={
                    remoteVideoRef
                  }
                  autoPlay
                />

                <div className="provider-chat-call-controls">

                  <button
                    type="button"
                    onClick={
                      handleToggleMute
                    }
                    title={
                      isMuted
                        ? "Unmute"
                        : "Mute"
                    }
                  >
                    {isMuted ? (
                      <MicOff
                        size={19}
                      />
                    ) : (
                      <Mic
                        size={19}
                      />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={
                      handleToggleSpeaker
                    }
                    title={
                      isSpeakerOn
                        ? "Mute speaker"
                        : "Turn speaker on"
                    }
                  >
                    {isSpeakerOn ? (
                      <Volume2
                        size={19}
                      />
                    ) : (
                      <VolumeX
                        size={19}
                      />
                    )}
                  </button>

                  <button
                    type="button"
                    className="provider-chat-end-call"
                    onClick={
                      handleEndCall
                    }
                    title="End call"
                  >
                    <PhoneOff
                      size={19}
                    />
                  </button>

                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================
            CHAT BODY
        ========================================= */}

        <div
          className="patient-chat-window-body"
          ref={
            messagesContainerRef
          }
        >

          {error && (
            <div className="patient-chat-inline-error">
              <span>
                {error}
              </span>

              <button
                type="button"
                onClick={() =>
                  setError("")
                }
              >
                <X size={14} />
              </button>
            </div>
          )}

          {messages.length === 0 ? (
            <div className="patient-chat-no-messages">

              <div className="patient-chat-no-messages-icon">
                <MessageCircle
                  size={27}
                />
              </div>

              <strong>
                Start a conversation
              </strong>

              <span>
                Send a message to{" "}
                {recipient?.name ||
                  "this user"}.
              </span>

            </div>
          ) : showMessageSearch &&
            searchQuery.trim() &&
            filteredMessages.length === 0 ? (
            <div className="provider-chat-no-search-results">

              <Search size={25} />

              <strong>
                No messages found
              </strong>

              <span>
                No message matches "
                {searchQuery}".
              </span>

            </div>
          ) : (
            <div className="patient-chat-messages">

              <div className="patient-chat-date-divider">
                <span>
                  Today
                </span>
              </div>

              {filteredMessages.map(
                (item) => {
                  const isMine =
                    item.senderId ===
                    user?.id;

                  const imageMessage =
                    isImageMessage(
                      item
                    );

                  const audioMessage =
                    isAudioMessage(
                      item
                    );

                  const fileMessage =
                    isFileMessage(
                      item
                    );

                  const attachmentUrl =
                    getAttachmentUrl(
                      item.attachmentUrl
                    );

                  return (
                    <div
                      key={
                        item.id
                      }
                      className={`patient-chat-message-row ${
                        isMine
                          ? "mine"
                          : "theirs"
                      }`}
                    >

                      {!isMine && (
                        <div className="patient-chat-message-avatar">
                          <UserRound
                            size={14}
                          />
                        </div>
                      )}

                      <div className="patient-chat-message">

                        {/* IMAGE */}

                        {imageMessage &&
                          attachmentUrl && (
                            <a
                              href={
                                attachmentUrl
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="provider-chat-image-link"
                            >
                              <img
                                src={
                                  attachmentUrl
                                }
                                alt={
                                  item.attachmentName ||
                                  "Shared image"
                                }
                                className="provider-chat-image"
                              />
                            </a>
                          )}

                        {/* AUDIO */}

                        {audioMessage &&
                          attachmentUrl && (
                            <div className="provider-chat-audio-message">

                              <div className="provider-chat-audio-message-icon">
                                <Mic
                                  size={17}
                                />
                              </div>

                              <audio
                                controls
                                preload="metadata"
                                src={
                                  attachmentUrl
                                }
                              />

                            </div>
                          )}

                        {/* FILE */}

                        {fileMessage &&
                          !imageMessage &&
                          !audioMessage &&
                          attachmentUrl && (
                            <a
                              href={
                                attachmentUrl
                              }
                              target="_blank"
                              rel="noreferrer"
                              download={
                                item.attachmentName ||
                                true
                              }
                              className="provider-chat-file-card"
                            >

                              <div className="provider-chat-file-icon">
                                <FileText
                                  size={
                                    21
                                  }
                                />
                              </div>

                              <div className="provider-chat-file-info">

                                <strong>
                                  {item.attachmentName ||
                                    "Shared file"}
                                </strong>

                                <span>
                                  {item.attachmentType ||
                                    "File"}
                                </span>

                              </div>

                              <Download
                                size={18}
                                className="provider-chat-file-download"
                              />

                            </a>
                          )}

                        {/* TEXT */}

                        {!fileMessage &&
                          !imageMessage &&
                          !audioMessage && (
                            <p>
                              {item.content ||
                                "Attachment"}
                            </p>
                          )}

                        {/* IMAGE CAPTION */}

                        {imageMessage &&
                          item.content && (
                            <p>
                              {item.content}
                            </p>
                          )}

                        {/* AUDIO CAPTION */}

                        {audioMessage &&
                          item.content && (
                            <p>
                              {item.content}
                            </p>
                          )}

                        {/* MESSAGE META */}

                        <div className="patient-chat-message-meta">

                          <span>
                            {formatMessageTime(
                              item.createdAt
                            )}
                          </span>

                          {isMine && (
                            <span className="patient-chat-message-status">
                              <CheckCheck
                                size={
                                  13
                                }
                              />
                            </span>
                          )}

                        </div>

                      </div>
                    </div>
                  );
                }
              )}

              <div
                ref={
                  messagesBottomRef
                }
                className="patient-chat-scroll-target"
              />

            </div>
          )}
        </div>

        {/* =========================================
            COMPOSER
        ========================================= */}

        <form
          className="patient-chat-composer"
          onSubmit={
            handleSendMessage
          }
        >

          {/* HIDDEN FILE INPUT */}

          <input
            ref={
              fileInputRef
            }
            type="file"
            hidden
            onChange={
              handleFileSelect
            }
            accept="
              image/jpeg,
              image/png,
              image/webp,
              image/gif,
              application/pdf,
              application/msword,
              application/vnd.openxmlformats-officedocument.wordprocessingml.document,
              application/vnd.ms-excel,
              application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,
              text/plain,
              application/zip,
              application/x-zip-compressed
            "
          />

          {/* RECORDING UI */}

          {isRecording ? (
            <div className="provider-chat-recording-bar">

              <button
                type="button"
                className="provider-chat-recording-cancel"
                onClick={
                  cancelVoiceRecording
                }
                title="Cancel recording"
              >
                <X size={18} />
              </button>

              <div className="provider-chat-recording-live">

                <span className="provider-chat-recording-dot"></span>

                <span className="provider-chat-recording-time">
                  {formatRecordingTime(
                    recordingSeconds
                  )}
                </span>

              </div>

              <div className="provider-chat-recording-middle">

                <span className="provider-chat-recording-text">
                  Recording voice message
                </span>

                <div className="provider-chat-recording-wave">
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>

              </div>

              <button
                type="button"
                className="provider-chat-recording-stop"
                onClick={
                  stopVoiceRecording
                }
                title="Send voice message"
              >
                <Send size={17} />
              </button>

            </div>
          ) : uploadingVoice ? (
            <div className="provider-chat-recording-bar provider-chat-uploading">

              <Loader2
                size={18}
                className="patient-chat-spinner"
              />

              <span className="provider-chat-recording-text">
                Sending voice message...
              </span>

            </div>
          ) : (
            <>

              {/* EMOJI */}

              <div className="provider-chat-emoji-wrapper">

                <button
                  type="button"
                  className="patient-chat-composer-icon"
                  title="Emoji"
                  onClick={() => {
                    setShowMoreMenu(false);

                    setShowEmojiPicker(
                      (current) =>
                        !current
                    );
                  }}
                  disabled={
                    !conversation ||
                    sending ||
                    sendingFile
                  }
                >
                  <Smile size={20} />
                </button>

                {showEmojiPicker && (
                  <div className="provider-chat-emoji-picker">

                    <div className="provider-chat-emoji-header">

                      <span>
                        Emojis
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setShowEmojiPicker(
                            false
                          )
                        }
                        title="Close"
                      >
                        <X size={15} />
                      </button>

                    </div>

                    <div className="provider-chat-emoji-grid">

                      {emojis.map(
                        (
                          emoji,
                          index
                        ) => (
                          <button
                            type="button"
                            key={`${emoji}-${index}`}
                            onClick={() =>
                              handleEmojiClick(
                                emoji
                              )
                            }
                          >
                            {emoji}
                          </button>
                        )
                      )}

                    </div>

                  </div>
                )}

              </div>

              {/* ATTACHMENT */}

              <button
                type="button"
                className="patient-chat-composer-icon"
                title={
                  sendingFile
                    ? "Uploading..."
                    : "Attach file"
                }
                onClick={
                  handleAttachFile
                }
                disabled={
                  !conversation ||
                  sending ||
                  sendingFile
                }
              >
                {sendingFile ? (
                  <Loader2
                    size={19}
                    className="patient-chat-spinner"
                  />
                ) : (
                  <Paperclip
                    size={19}
                  />
                )}
              </button>

              {/* MESSAGE INPUT */}

              <input
                type="text"
                placeholder={
                  sendingFile
                    ? "Uploading file..."
                    : "Type a message..."
                }
                value={
                  message
                }
                onChange={(
                  event
                ) =>
                  setMessage(
                    event.target.value
                  )
                }
                onKeyDown={
                  handleMessageKeyDown
                }
                disabled={
                  !conversation ||
                  sending ||
                  sendingFile
                }
              />

              {/* SEND / VOICE */}

              {message.trim() ? (
                <button
                  type="submit"
                  className="patient-chat-send-button"
                  disabled={
                    !conversation ||
                    sending ||
                    sendingFile
                  }
                  title="Send message"
                >
                  {sending ? (
                    <Loader2
                      size={18}
                      className="patient-chat-spinner"
                    />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  className="patient-chat-composer-icon provider-chat-voice-button"
                  title="Record voice message"
                  onClick={
                    startVoiceRecording
                  }
                  disabled={
                    !conversation ||
                    sending ||
                    sendingFile ||
                    uploadingVoice
                  }
                >
                  <Mic size={19} />
                </button>
              )}

            </>
          )}
        </form>

        {/* =========================================
            USER DETAILS MODAL
        ========================================= */}

        {showPatientInfo && (
          <div
            className="provider-chat-modal-overlay"
            onClick={() =>
              setShowPatientInfo(
                false
              )
            }
          >

            <div
              className="provider-chat-patient-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <div className="provider-chat-modal-header">

                <div>
                  <span>
                    {recipient?.role ===
                    "ORGANIZATION_ADMIN"
                      ? "Admin"
                      : "Patient"}
                  </span>

                  <h3>
                    User Details
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowPatientInfo(
                      false
                    )
                  }
                  title="Close"
                >
                  <X size={18} />
                </button>

              </div>

              <div className="provider-chat-patient-profile">

                <div className="provider-chat-patient-large-avatar">
                  <UserRound size={30} />
                </div>

                <strong>
                  {recipient?.name ||
                    "User"}
                </strong>

                <span>
                  {recipient?.email ||
                    "Email not available"}
                </span>

              </div>

              <div className="provider-chat-patient-details">

                <div>
                  <span>
                    Name
                  </span>

                  <strong>
                    {recipient?.name ||
                      "Not available"}
                  </strong>
                </div>

                <div>
                  <span>
                    Email
                  </span>

                  <strong>
                    {recipient?.email ||
                      "Not available"}
                  </strong>
                </div>

                <div>
                  <span>
                    Phone
                  </span>

                  <strong>
                    {recipient?.phone ||
                      "Not available"}
                  </strong>
                </div>

                <div>
                  <span>
                    Role
                  </span>

                  <strong>
                    {recipient?.role ===
                    "ORGANIZATION_ADMIN"
                      ? "Admin"
                      : "Patient"}
                  </strong>
                </div>

              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default ProviderChatWindow;