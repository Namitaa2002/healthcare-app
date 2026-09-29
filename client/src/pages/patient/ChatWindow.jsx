
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import {
  ArrowLeft,
  CheckCheck,
  FileText,
  Image as ImageIcon,
  Loader2,
  Mic,
  MoreVertical,
  Paperclip,
  Phone,
  Search,
  Send,
  Smile,
  UserRound,
  Video,
  X,
  PhoneOff,
  MicOff,
  Volume2,
  VolumeX,
} from "lucide-react";

import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import socket from "../../services/socket";
import { useAuth } from "../../context/AuthContext";

import "../../styles/patientChat.css";

const API_BASE_URL = "http://localhost:5000";

// =========================================
// STUN SERVERS
// =========================================

const RTC_CONFIG = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
    {
      urls: "stun:stun1.l.google.com:19302",
    },
  ],
};

function ChatWindow() {
  const navigate = useNavigate();
  const { providerUserId } = useParams();
  const { user } = useAuth();

  // =========================================
  // REFS
  // =========================================

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);

  const pendingIceCandidatesRef = useRef([]);

  const activeCallIdRef = useRef(null);
  const callTypeRef = useRef(null);

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

  const [provider, setProvider] = useState(null);

  const [conversation, setConversation] =
    useState(null);

  const [messages, setMessages] = useState([]);

  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(true);

  const [sending, setSending] = useState(false);

  const [sendingFile, setSendingFile] =
    useState(false);

  const [error, setError] = useState("");

  const [selectedFile, setSelectedFile] =
    useState(null);

  // =========================================
  // CHAT TOOL STATE
  // =========================================

  const [showEmojiPicker, setShowEmojiPicker] =
    useState(false);

  const [showSearch, setShowSearch] =
    useState(false);

  const [searchText, setSearchText] =
    useState("");

  const [showMoreMenu, setShowMoreMenu] =
    useState(false);

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
  // CALL STATE
  // =========================================

  const [callState, setCallState] =
    useState("IDLE");

  const [callType, setCallType] =
    useState(null);

  const [incomingCall, setIncomingCall] =
    useState(null);

  const [callMuted, setCallMuted] =
    useState(false);

  const [callSpeakerOn, setCallSpeakerOn] =
    useState(true);

  // =========================================
  // EMOJIS
  // =========================================

  const emojis = [
    "😀",
    "😂",
    "😍",
    "🥰",
    "😊",
    "🙂",
    "😉",
    "😎",
    "🤗",
    "😢",
    "😭",
    "😡",
    "😮",
    "😴",
    "🤔",
    "👍",
    "👎",
    "👏",
    "🙏",
    "❤️",
    "💙",
    "💚",
    "💯",
    "🎉",
    "✨",
    "🔥",
  ];

  // =========================================
  // SCROLL
  // =========================================

  const scrollToBottom = (
    behavior = "smooth"
  ) => {
    messagesEndRef.current?.scrollIntoView({
      behavior,
      block: "end",
    });
  };

  // =========================================
  // FIND PROVIDER
  // =========================================

  const findProvider = (providerList) => {
    return providerList.find(
      (item) =>
        item.user?.id === providerUserId ||
        item.userId === providerUserId ||
        item.id === providerUserId
    );
  };

  // =========================================
  // LOAD CHAT
  // =========================================

  const loadChat = async () => {
    try {
      setLoading(true);
      setError("");

      const providersResponse =
        await api.get("/providers/public");

      const providerList =
        providersResponse.data?.data || [];

      const selectedProvider =
        findProvider(providerList);

      if (!selectedProvider) {
        setError("Provider not found.");
        return;
      }

      setProvider(selectedProvider);

      // -----------------------------------------
      // GET / CREATE CONVERSATION
      // -----------------------------------------

      const conversationResponse =
        await api.post("/chat/conversation", {
          userId: providerUserId,
        });

      const currentConversation =
        conversationResponse.data?.data;

      if (!currentConversation) {
        setError(
          "Unable to create conversation."
        );
        return;
      }

      setConversation(currentConversation);

      // -----------------------------------------
      // GET MESSAGES
      // -----------------------------------------

      const messagesResponse =
        await api.get(
          `/chat/conversation/${currentConversation.id}/messages`
        );

      setMessages(
        messagesResponse.data?.data || []
      );

      // -----------------------------------------
      // MARK AS READ
      // -----------------------------------------

      await api.patch(
        `/chat/conversation/${currentConversation.id}/read`
      );
    } catch (error) {
      console.error(
        "Patient chat window error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to load conversation."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // INITIAL LOAD
  // =========================================

  useEffect(() => {
    if (!providerUserId) {
      return;
    }

    loadChat();
  }, [providerUserId]);

  // =========================================
  // CHAT SOCKET
  // =========================================

  useEffect(() => {
    if (!conversation?.id) {
      return;
    }

    socket.emit(
      "join-conversation",
      conversation.id
    );

    const handleNewMessage = (newMessage) => {
      if (
        newMessage.conversationId !==
        conversation.id
      ) {
        return;
      }

      setMessages((previousMessages) => {
        const exists = previousMessages.some(
          (item) => item.id === newMessage.id
        );

        if (exists) {
          return previousMessages;
        }

        return [
          ...previousMessages,
          newMessage,
        ];
      });

      if (
        newMessage.senderId !== user?.id
      ) {
        api.patch(
          `/chat/conversation/${conversation.id}/read`
        );
      }

      requestAnimationFrame(() => {
        scrollToBottom();
      });
    };

    socket.on(
      "new-message",
      handleNewMessage
    );

    return () => {
      socket.off(
        "new-message",
        handleNewMessage
      );

      socket.emit(
        "leave-conversation",
        conversation.id
      );
    };
  }, [conversation?.id, user?.id]);

  // =========================================
  // INITIAL SCROLL
  // =========================================

  useLayoutEffect(() => {
    if (!loading) {
      requestAnimationFrame(() => {
        scrollToBottom("auto");
      });
    }
  }, [loading]);

  // =========================================
  // SCROLL AFTER MESSAGE
  // =========================================

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollToBottom("auto");
    });
  }, [messages.length]);

  // =========================================
  // SEND TEXT MESSAGE
  // =========================================

  const handleSendMessage = async () => {
    const trimmedMessage =
      message.trim();

    if (
      !trimmedMessage ||
      !conversation?.id ||
      sending
    ) {
      return;
    }

    try {
      setSending(true);
      setError("");

      const response = await api.post(
        `/chat/conversation/${conversation.id}/messages`,
        {
          content: trimmedMessage,
        }
      );

      const createdMessage =
        response.data?.data;

      if (createdMessage) {
        setMessages((previousMessages) => {
          const exists =
            previousMessages.some(
              (item) =>
                item.id === createdMessage.id
            );

          if (exists) {
            return previousMessages;
          }

          return [
            ...previousMessages,
            createdMessage,
          ];
        });
      }

      setMessage("");
      setShowEmojiPicker(false);

      requestAnimationFrame(() => {
        scrollToBottom();
      });
    } catch (error) {
      console.error(
        "Send patient message error:",
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
  // ENTER KEY
  // =========================================

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  // =========================================
  // FILE ATTACHMENT
  // =========================================

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  // =========================================
  // FILE SELECT
  // =========================================

  const handleFileSelect = (event) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      file.size >
      10 * 1024 * 1024
    ) {
      setError(
        "File size must be less than 10 MB."
      );

      event.target.value = "";
      return;
    }

    setError("");
    setSelectedFile(file);

    event.target.value = "";
  };

  // =========================================
  // REMOVE FILE
  // =========================================

  const removeSelectedFile = () => {
    if (sendingFile) {
      return;
    }

    setSelectedFile(null);
  };

  // =========================================
  // SEND FILE
  // =========================================

  const handleSendFile = async () => {
    if (
      !selectedFile ||
      !conversation?.id ||
      sendingFile
    ) {
      return;
    }

    try {
      setSendingFile(true);
      setError("");

      const formData = new FormData();

      formData.append(
        "file",
        selectedFile
      );

      const response = await api.post(
        `/chat/conversation/${conversation.id}/messages/file`,
        formData
      );

      const createdMessage =
        response.data?.data;

      if (createdMessage) {
        setMessages((previousMessages) => {
          const exists =
            previousMessages.some(
              (item) =>
                item.id === createdMessage.id
            );

          if (exists) {
            return previousMessages;
          }

          return [
            ...previousMessages,
            createdMessage,
          ];
        });
      }

      setSelectedFile(null);

      requestAnimationFrame(() => {
        scrollToBottom();
      });
    } catch (error) {
      console.error(
        "Send patient file error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to send file."
      );
    } finally {
      setSendingFile(false);
    }
  };

  // =========================================
  // VOICE RECORDING
  // =========================================

  const formatRecordingTime = (
    seconds
  ) => {
    const minutes = Math.floor(
      seconds / 60
    );

    const remainingSeconds =
      seconds % 60;

    return `${String(minutes).padStart(
      2,
      "0"
    )}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  // =========================================
  // CLEAR RECORDING TIMER
  // =========================================

  const clearRecordingTimer = () => {
    if (recordingTimerRef.current) {
      clearInterval(
        recordingTimerRef.current
      );

      recordingTimerRef.current = null;
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
        .forEach((track) => {
          track.stop();
        });

      recordingStreamRef.current = null;
    }
  };

  // =========================================
  // UPLOAD VOICE MESSAGE
  // =========================================

  const uploadVoiceMessage = async (
    audioBlob
  ) => {
    if (
      !audioBlob ||
      !conversation?.id
    ) {
      return;
    }

    try {
      setUploadingVoice(true);
      setError("");

      const extension =
        audioBlob.type.includes("ogg")
          ? "ogg"
          : audioBlob.type.includes("mp4")
          ? "m4a"
          : "webm";

      const voiceFile = new File(
        [audioBlob],
        `voice-message-${Date.now()}.${extension}`,
        {
          type:
            audioBlob.type ||
            "audio/webm",
        }
      );

      const formData =
        new FormData();

      formData.append(
        "file",
        voiceFile
      );

      const response = await api.post(
        `/chat/conversation/${conversation.id}/messages/file`,
        formData
      );

      const createdMessage =
        response.data?.data;

      if (createdMessage) {
        setMessages((previousMessages) => {
          const exists =
            previousMessages.some(
              (item) =>
                item.id ===
                createdMessage.id
            );

          if (exists) {
            return previousMessages;
          }

          return [
            ...previousMessages,
            createdMessage,
          ];
        });
      }

      requestAnimationFrame(() => {
        scrollToBottom();
      });
    } catch (error) {
      console.error(
        "Upload voice message error:",
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

  if (!window.MediaRecorder) {
  setError(
    "Voice recording is not supported by this browser."
  );
  return;
}

  const startVoiceRecording = async () => {
    if (
      isRecording ||
      uploadingVoice ||
      !conversation?.id
    ) {
      return;
    }

    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setError(
        "Voice recording is not supported by this browser."
      );
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

      recordingStreamRef.current =
        stream;

      recordingChunksRef.current =
        [];

      let mimeType = "";

      const supportedMimeTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/ogg",
        "audio/mp4",
      ];

      for (
        const type of supportedMimeTypes
      ) {
        if (
          MediaRecorder.isTypeSupported(
            type
          )
        ) {
          mimeType = type;
          break;
        }
      }

      const mediaRecorder =
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
        mediaRecorder;

      mediaRecorder.ondataavailable = (
        event
      ) => {
        if (
          event.data &&
          event.data.size > 0
        ) {
          recordingChunksRef.current.push(
            event.data
          );
        }
      };

      mediaRecorder.onstop = async () => {
        const actualMimeType =
          mediaRecorder.mimeType ||
          mimeType ||
          "audio/webm";

        const audioBlob =
          new Blob(
            recordingChunksRef.current,
            {
              type: actualMimeType,
            }
          );

        recordingChunksRef.current =
          [];

        stopRecordingStream();
        clearRecordingTimer();

        mediaRecorderRef.current =
          null;

        setIsRecording(false);
        setRecordingSeconds(0);

        if (audioBlob.size > 0) {
          await uploadVoiceMessage(
            audioBlob
          );
        }
      };

      mediaRecorder.onerror = (
        event
      ) => {
        console.error(
          "MediaRecorder error:",
          event
        );

        setError(
          "Voice recording failed. Please try again."
        );

        stopRecordingStream();
        clearRecordingTimer();

        mediaRecorderRef.current =
          null;

        setIsRecording(false);
        setRecordingSeconds(0);
      };

      mediaRecorder.start();

      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current =
        setInterval(() => {
          setRecordingSeconds(
            (previous) =>
              previous + 1
          );
        }, 1000);
    } catch (error) {
      console.error(
        "Start voice recording error:",
        error
      );

      stopRecordingStream();
      clearRecordingTimer();

      if (
        error.name ===
        "NotAllowedError"
      ) {
        setError(
          "Please allow microphone access to record a voice message."
        );
      } else if (
        error.name ===
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

      setIsRecording(false);
      setRecordingSeconds(0);
    }
  };

  // =========================================
  // STOP VOICE RECORDING
  // =========================================

  const stopVoiceRecording = () => {
    const recorder =
      mediaRecorderRef.current;

    if (
      !recorder ||
      recorder.state ===
        "inactive"
    ) {
      return;
    }

    clearRecordingTimer();

    recorder.stop();
  };

  // =========================================
  // CANCEL VOICE RECORDING
  // =========================================

  const cancelVoiceRecording = () => {
    const recorder =
      mediaRecorderRef.current;

    clearRecordingTimer();

    if (
      recorder &&
      recorder.state !== "inactive"
    ) {
      recorder.ondataavailable =
        null;

      recorder.onstop = null;
      recorder.onerror = null;

      recorder.stop();
    }

    recordingChunksRef.current =
      [];

    mediaRecorderRef.current =
      null;

    stopRecordingStream();

    setIsRecording(false);
    setRecordingSeconds(0);
    setUploadingVoice(false);
  };

  // =========================================
  // BACK
  // =========================================

  const handleBack = () => {
    navigate("/patient/chat");
  };

  // =========================================
  // PROVIDER NAME
  // =========================================

  const getProviderName = () => {
    if (!provider) {
      return "Provider";
    }

    return (
      provider.user?.name ||
      provider.name ||
      "Provider"
    );
  };

  // =========================================
  // PROVIDER SPECIALIZATION
  // =========================================

  const getProviderSpecialization = () => {
    return (
      provider?.specialization ||
      provider?.qualification ||
      "Healthcare Provider"
    );
  };

  // =========================================
  // MESSAGE TIME
  // =========================================

  const formatMessageTime = (date) => {
    if (!date) {
      return "";
    }

    return new Date(
      date
    ).toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // =========================================
  // FILE SIZE
  // =========================================

  const formatFileSize = (size) => {
    if (!size) {
      return "";
    }

    if (size < 1024) {
      return `${size} B`;
    }

    if (
      size <
      1024 * 1024
    ) {
      return `${Math.round(
        size / 1024
      )} KB`;
    }

    return `${(
      size /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  };

  // =========================================
  // ATTACHMENT URL
  // =========================================

  const getAttachmentUrl = (url) => {
    if (!url) {
      return "";
    }

    if (url.startsWith("http")) {
      return url;
    }

    return `${API_BASE_URL}${url}`;
  };

  // =========================================
  // MESSAGE CONTENT
  // =========================================

  const renderMessageContent = (
    currentMessage
  ) => {
    // -----------------------------------------
    // IMAGE
    // -----------------------------------------

    if (
      currentMessage.messageType ===
      "IMAGE"
    ) {
      const imageUrl =
        getAttachmentUrl(
          currentMessage.attachmentUrl
        );

      return (
        <a
          href={imageUrl}
          target="_blank"
          rel="noreferrer"
          className="patient-chat-image-message-link"
        >
          <img
            src={imageUrl}
            alt={
              currentMessage.attachmentName ||
              "Image"
            }
            className="patient-chat-image-message"
          />
        </a>
      );
    }

    // -----------------------------------------
    // AUDIO
    // -----------------------------------------

    if (
      currentMessage.messageType ===
        "AUDIO" ||
      currentMessage.attachmentType?.startsWith(
        "audio/"
      )
    ) {
      const audioUrl =
        getAttachmentUrl(
          currentMessage.attachmentUrl
        );

      return (
        <div className="patient-chat-audio-message">
          <audio
            controls
            preload="metadata"
            src={audioUrl}
            className="patient-chat-audio-player"
          >
            Your browser does not support
            audio playback.
          </audio>
        </div>
      );
    }

    // -----------------------------------------
    // FILE
    // -----------------------------------------

    if (
      currentMessage.messageType ===
      "FILE"
    ) {
      return (
        <a
          href={getAttachmentUrl(
            currentMessage.attachmentUrl
          )}
          target="_blank"
          rel="noreferrer"
          className="patient-chat-file-message"
          download
        >
          <div className="patient-chat-file-icon">
            <FileText size={19} />
          </div>

          <div className="patient-chat-file-info">
            <strong>
              {currentMessage.attachmentName ||
                "Attachment"}
            </strong>

            <span>
              {formatFileSize(
                currentMessage.attachmentSize
              )}
            </span>
          </div>
        </a>
      );
    }

    // -----------------------------------------
    // TEXT
    // -----------------------------------------

    return (
      <p>{currentMessage.content}</p>
    );
  };

  // =========================================
  // EMOJI
  // =========================================

  const handleEmojiClick = (emoji) => {
    setMessage(
      (previousMessage) =>
        previousMessage + emoji
    );
  };

  // =========================================
  // SEARCH
  // =========================================

  const filteredMessages =
    searchText.trim()
      ? messages.filter((item) =>
          item.content
            ?.toLowerCase()
            .includes(
              searchText
                .trim()
                .toLowerCase()
            )
        )
      : messages;

  // =========================================
  // CLOSE CHAT MENUS
  // =========================================

  const closeChatMenus = () => {
    setShowEmojiPicker(false);
    setShowMoreMenu(false);
  };

  // =========================================
  // DOWNLOAD CHAT
  // =========================================

  const handleDownloadChat = () => {
    const chatText = messages
      .map((item) => {
        const sender =
          item.senderId === user?.id
            ? "You"
            : getProviderName();

        return `${sender}: ${
          item.content ||
          item.attachmentName ||
          "[Attachment]"
        }`;
      })
      .join("\n");

    const blob = new Blob(
      [chatText],
      {
        type: "text/plain",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const anchor =
      document.createElement("a");

    anchor.href = url;

    anchor.download =
      `chat-${getProviderName()
        .replace(/\s+/g, "-")
        .toLowerCase()}.txt`;

    anchor.click();

    URL.revokeObjectURL(url);

    setShowMoreMenu(false);
  };

  // =========================================
  // WEBRTC
  // CREATE PEER CONNECTION
  // =========================================

  const createPeerConnection = (
    targetUserId,
    currentCallId
  ) => {
    const peerConnection =
      new RTCPeerConnection(
        RTC_CONFIG
      );

    peerConnection.onicecandidate = (
      event
    ) => {
      if (!event.candidate) {
        return;
      }

      socket.emit(
        "ice-candidate",
        {
          to: targetUserId,
          callId: currentCallId,
          candidate:
            event.candidate,
        }
      );
    };

    peerConnection.ontrack = (
      event
    ) => {
      const [remoteStream] =
        event.streams;

      if (!remoteStream) {
        return;
      }

      remoteStreamRef.current =
        remoteStream;

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject =
          remoteStream;
      }
    };

    peerConnection.onconnectionstatechange =
  () => {
    const state =
      peerConnection.connectionState;

    console.log(
      "WebRTC connection state:",
      state
    );

    if (
      state === "failed" ||
      state === "closed"
    ) {
      cleanupCall(false);
    }
  };

    peerConnectionRef.current =
      peerConnection;

    return peerConnection;
  };

  // =========================================
  // GET MEDIA
  // =========================================

  const getLocalMedia = async (
    selectedCallType
  ) => {
    const constraints = {
      audio: true,
      video:
        selectedCallType ===
        "VIDEO",
    };

    const stream =
      await navigator.mediaDevices.getUserMedia(
        constraints
      );

    localStreamRef.current =
      stream;

    if (localVideoRef.current) {
      localVideoRef.current.srcObject =
        stream;
    }

    return stream;
  };

  // =========================================
  // START CALL
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

    const currentCallId =
      `${user?.id}-${Date.now()}`;

    try {
      setError("");
      setCallState("CALLING");
      setCallType(
        selectedCallType
      );

      activeCallIdRef.current =
        currentCallId;

      callTypeRef.current =
        selectedCallType;

      pendingIceCandidatesRef.current =
        [];

      const localStream =
        await getLocalMedia(
          selectedCallType
        );

      const peerConnection =
        createPeerConnection(
          providerUserId,
          currentCallId
        );

      localStream
        .getTracks()
        .forEach((track) => {
          peerConnection.addTrack(
            track,
            localStream
          );
        });

      const offer =
        await peerConnection.createOffer();

      await peerConnection.setLocalDescription(
        offer
      );

      socket.emit(
        "call-user",
        {
          to: providerUserId,
          callId:
            currentCallId,
          callType:
            selectedCallType,
          offer,
          caller: {
            id: user?.id,
            name: user?.name,
            role: user?.role,
          },
        }
      );

      console.log(
        "Outgoing call sent:",
        selectedCallType
      );
    } catch (error) {
      console.error(
        "Start call error:",
        error
      );

      setError(
        error.name ===
          "NotAllowedError"
          ? "Please allow microphone/camera access to make a call."
          : "Unable to start the call."
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
      console.log(
        "Incoming call received:",
        data
      );

      if (
        !data?.callId ||
        !data?.offer ||
        !data?.callType
      ) {
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

      setCallType(
        data.callType
      );

      activeCallIdRef.current =
        data.callId;

      callTypeRef.current =
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

      try {
        setError("");

        const {
          callId,
          callType: incomingType,
          offer,
          from,
        } = incomingCall;

        setCallState(
          "CONNECTED"
        );

        setCallType(
          incomingType
        );

        activeCallIdRef.current =
          callId;

        callTypeRef.current =
          incomingType;

        pendingIceCandidatesRef.current =
          [];

        const localStream =
          await getLocalMedia(
            incomingType
          );

        const peerConnection =
          createPeerConnection(
            from,
            callId
          );

        localStream
          .getTracks()
          .forEach((track) => {
            peerConnection.addTrack(
              track,
              localStream
            );
          });

        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(
            offer
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
            to: from,
            callId,
            answer,
          }
        );

        setIncomingCall(null);

        for (
          const candidate of
            pendingIceCandidatesRef.current
        ) {
          try {
            await peerConnection.addIceCandidate(
              new RTCIceCandidate(
                candidate
              )
            );
          } catch (error) {
            console.error(
              "Queued ICE candidate error:",
              error
            );
          }
        }

        pendingIceCandidatesRef.current =
          [];
      } catch (error) {
        console.error(
          "Accept call error:",
          error
        );

        setError(
          error.name ===
            "NotAllowedError"
            ? "Please allow microphone/camera access to answer the call."
            : "Unable to answer the call."
        );

        setIncomingCall(null);

        cleanupCall(false);
      }
    };

  // =========================================
  // REJECT INCOMING CALL
  // =========================================

  const rejectIncomingCall =
    () => {
      if (!incomingCall) {
        return;
      }

      socket.emit(
        "reject-call",
        {
          to: incomingCall.from,
          callId:
            incomingCall.callId,
          reason:
            "Call rejected by patient",
        }
      );

      setIncomingCall(null);

      activeCallIdRef.current =
        null;

      callTypeRef.current =
        null;

      setCallType(null);
      setCallState("IDLE");
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

          setCallState(
            "CONNECTED"
          );

          for (
            const candidate of
              pendingIceCandidatesRef.current
          ) {
            try {
              await peerConnection.addIceCandidate(
                new RTCIceCandidate(
                  candidate
                )
              );
            } catch (error) {
              console.error(
                "Queued ICE candidate error:",
                error
              );
            }
          }

          pendingIceCandidatesRef.current =
            [];
        } catch (error) {
          console.error(
            "Call accepted error:",
            error
          );

          setError(
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
            activeCallIdRef.current
        ) {
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
        } catch (error) {
          console.error(
            "ICE candidate error:",
            error
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

        setError(
          data.reason ||
            "The call was rejected."
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

        setError(
          "The provider is currently on another call."
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
  }, []);

  // =========================================
  // REMOTE CALL ENDED
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
  // REMOTE CALL CANCELLED
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

        setIncomingCall(null);

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
    notifyRemote = true
  ) => {
    const currentCallId =
      activeCallIdRef.current;

    if (
      notifyRemote &&
      currentCallId &&
      providerUserId
    ) {
      socket.emit(
        "end-call",
        {
          to: providerUserId,
          callId:
            currentCallId,
        }
      );
    }

    // -----------------------------------------
    // STOP LOCAL STREAM
    // -----------------------------------------

    if (localStreamRef.current) {
      localStreamRef.current
        .getTracks()
        .forEach((track) =>
          track.stop()
        );

      localStreamRef.current =
        null;
    }

    // -----------------------------------------
    // CLOSE PEER CONNECTION
    // -----------------------------------------

    if (
      peerConnectionRef.current
    ) {
      peerConnectionRef.current.close();

      peerConnectionRef.current =
        null;
    }

    // -----------------------------------------
    // CLEAR VIDEO
    // -----------------------------------------

    if (localVideoRef.current) {
      localVideoRef.current.srcObject =
        null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject =
        null;
    }

    remoteStreamRef.current =
      null;

    pendingIceCandidatesRef.current =
      [];

    activeCallIdRef.current =
      null;

    callTypeRef.current =
      null;

    setCallState("IDLE");
    setCallType(null);
    setIncomingCall(null);
    setCallMuted(false);
    setCallSpeakerOn(true);
  };

  // =========================================
  // END CALL BUTTON
  // =========================================

  const handleEndCall = () => {
    cleanupCall(true);
  };

  // =========================================
  // CANCEL OUTGOING CALL
  // =========================================

  const handleCancelCall = () => {
    if (
      activeCallIdRef.current &&
      providerUserId
    ) {
      socket.emit(
        "cancel-call",
        {
          to: providerUserId,
          callId:
            activeCallIdRef.current,
        }
      );
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

    const audioTracks =
      stream.getAudioTracks();

    audioTracks.forEach(
      (track) => {
        track.enabled =
          !track.enabled;
      }
    );

    setCallMuted(
      !callMuted
    );
  };

  // =========================================
  // SPEAKER
  // =========================================

  const handleToggleSpeaker = () => {
    if (!remoteVideoRef.current) {
      return;
    }

    remoteVideoRef.current.muted =
      callSpeakerOn;

    setCallSpeakerOn(
      !callSpeakerOn
    );
  };

  // =========================================
  // PAGE CLEANUP
  // =========================================

  useEffect(() => {
    return () => {
      clearRecordingTimer();
      stopRecordingStream();

      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !==
          "inactive"
      ) {
        try {
          mediaRecorderRef.current.stop();
        } catch (error) {
          console.error(
            "Recorder cleanup error:",
            error
          );
        }
      }

      cleanupCall(false);
    };
  }, []);

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <div className="patient-chat-window-page">
        <div className="patient-chat-main-card">
          <div className="patient-chat-window-body">
            <div className="patient-chat-window-loading">
              <Loader2
                size={20}
                className="patient-chat-spinner"
              />
              Loading conversation...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================
  // ERROR WITHOUT PROVIDER
  // =========================================

  if (error && !provider) {
    return (
      <div className="patient-chat-window-page">
        <div className="patient-chat-main-card">
          <div className="patient-chat-window-body">
            <div className="patient-chat-window-error">
              {error}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================
  // MAIN
  // =========================================

  return (
    <div className="patient-chat-window-page">
      <div className="patient-chat-main-card">

        {/* =====================================
            HEADER
        ===================================== */}

        <div className="patient-chat-header-bar">
          <div className="patient-chat-header-left">

            <button
              type="button"
              className="patient-chat-back-icon"
              onClick={handleBack}
              aria-label="Back"
              title="Back"
            >
              <ArrowLeft size={19} />
            </button>

            <div className="patient-chat-header-avatar">
              <UserRound size={23} />
            </div>

            <div className="patient-chat-header-info">
              <strong>
                {getProviderName()}
              </strong>

              <span>
                <i className="patient-chat-online-dot"></i>
                {getProviderSpecialization()}
              </span>
            </div>
          </div>

          {/* =====================================
              HEADER ACTIONS
          ===================================== */}

          <div className="patient-chat-header-actions">

            {/* AUDIO CALL */}

            <button
              type="button"
              title="Audio call"
              aria-label="Audio call"
              onClick={() =>
                startCall("AUDIO")
              }
              disabled={
                callState !== "IDLE"
              }
            >
              <Phone size={18} />
            </button>

            {/* VIDEO CALL */}

            <button
              type="button"
              title="Video call"
              aria-label="Video call"
              onClick={() =>
                startCall("VIDEO")
              }
              disabled={
                callState !== "IDLE"
              }
            >
              <Video size={18} />
            </button>

            {/* SEARCH */}

            <button
              type="button"
              title="Search messages"
              aria-label="Search messages"
              onClick={() => {
                setShowSearch(
                  (previous) =>
                    !previous
                );

                setShowMoreMenu(false);
                setShowEmojiPicker(false);
              }}
            >
              <Search size={18} />
            </button>

            {/* MORE */}

            <button
              type="button"
              title="More"
              aria-label="More"
              onClick={() => {
                setShowMoreMenu(
                  (previous) =>
                    !previous
                );

                setShowSearch(false);
                setShowEmojiPicker(false);
              }}
            >
              <MoreVertical size={18} />
            </button>

            {/* MORE MENU */}

            {showMoreMenu && (
              <div className="patient-chat-more-menu">

                <button
                  type="button"
                  onClick={() => {
                    setShowSearch(true);
                    setShowMoreMenu(false);
                  }}
                >
                  <Search size={16} />
                  Search messages
                </button>

                <button
                  type="button"
                  onClick={
                    handleDownloadChat
                  }
                >
                  <FileText size={16} />
                  Download chat
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                  }}
                >
                  <Volume2 size={16} />
                  Notifications on
                </button>

              </div>
            )}
          </div>
        </div>

        {/* =====================================
            SEARCH BAR
        ===================================== */}

        {showSearch && (
          <div className="patient-chat-search-bar">
            <Search size={17} />

            <input
              type="text"
              value={searchText}
              onChange={(event) =>
                setSearchText(
                  event.target.value
                )
              }
              placeholder="Search messages..."
              autoFocus
            />

            {searchText && (
              <span>
                {
                  filteredMessages.length
                }{" "}
                result
                {filteredMessages.length ===
                1
                  ? ""
                  : "s"}
              </span>
            )}

            <button
              type="button"
              onClick={() => {
                setSearchText("");
                setShowSearch(false);
              }}
              aria-label="Close search"
              title="Close search"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* =====================================
            BODY
        ===================================== */}

        <div className="patient-chat-window-body">
          <div className="patient-chat-messages">

            {/* INLINE ERROR */}

            {error && (
              <div className="patient-chat-inline-error">
                {error}
              </div>
            )}

            {/* =================================
                NO MESSAGES
            ================================= */}

            {filteredMessages.length ===
            0 ? (
              <div className="patient-chat-no-messages">

                <div className="patient-chat-no-messages-icon">
                  <UserRound size={27} />
                </div>

                <strong>
                  {searchText
                    ? "No messages found"
                    : "Start your conversation"}
                </strong>

                <span>
                  {searchText
                    ? "Try a different search term."
                    : `Send a message to Dr. ${getProviderName()}.`}
                </span>

              </div>
            ) : (

              /* =================================
                 MESSAGES
              ================================= */

              filteredMessages.map(
                (currentMessage) => {
                  const isMine =
                    currentMessage.senderId ===
                    user?.id;

                  return (
                    <div
                      key={
                        currentMessage.id
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
                            size={15}
                          />
                        </div>
                      )}

                      <div className="patient-chat-message">

                        {renderMessageContent(
                          currentMessage
                        )}

                        <div className="patient-chat-message-meta">

                          <span>
                            {formatMessageTime(
                              currentMessage.createdAt
                            )}
                          </span>

                          {isMine && (
                            <span className="patient-chat-message-status">
                              <CheckCheck
                                size={13}
                              />
                            </span>
                          )}

                        </div>
                      </div>
                    </div>
                  );
                }
              )
            )}

            <div
              ref={messagesEndRef}
              className="patient-chat-scroll-target"
            />

          </div>
        </div>

        {/* =====================================
            INCOMING CALL POPUP
        ===================================== */}

        {incomingCall && (
          <div className="patient-chat-call-overlay">

            <div className="patient-chat-incoming-call">

              <div className="patient-chat-call-avatar">
                <UserRound size={34} />
              </div>

              <span className="patient-chat-call-label">
                Incoming{" "}
                {incomingCall.callType ===
                "VIDEO"
                  ? "video"
                  : "audio"}{" "}
                call
              </span>

              <strong>
                {incomingCall.caller?.name ||
                  getProviderName()}
              </strong>

              <p>
                {incomingCall.callType ===
                "VIDEO"
                  ? "Video call is incoming"
                  : "Audio call is incoming"}
              </p>

              <div className="patient-chat-incoming-actions">

                <button
                  type="button"
                  className="patient-chat-call-reject"
                  onClick={
                    rejectIncomingCall
                  }
                  title="Reject"
                >
                  <PhoneOff size={19} />
                </button>

                <button
                  type="button"
                  className="patient-chat-call-accept"
                  onClick={
                    acceptIncomingCall
                  }
                  title="Accept"
                >
                  {incomingCall.callType ===
                  "VIDEO" ? (
                    <Video size={19} />
                  ) : (
                    <Phone size={19} />
                  )}
                </button>

              </div>
            </div>
          </div>
        )}

        {/* =====================================
            ACTIVE CALL
        ===================================== */}

        {callState !== "IDLE" &&
          !incomingCall && (
            <div className="patient-chat-call-overlay">

              <div
                className={`patient-chat-active-call ${
                  callType === "VIDEO"
                    ? "video-call"
                    : "audio-call"
                }`}
              >

                {/* VIDEO AREA */}

                {callType === "VIDEO" ? (
                  <div className="patient-chat-video-area">

                    <video
                      ref={
                        remoteVideoRef
                      }
                      autoPlay
                      playsInline
                      className="patient-chat-remote-video"
                    />

                    <video
                      ref={
                        localVideoRef
                      }
                      autoPlay
                      muted
                      playsInline
                      className="patient-chat-local-video"
                    />

                  </div>
                ) : (
                  <div className="patient-chat-audio-area">

                    <div className="patient-chat-call-avatar large">
                      <UserRound
                        size={40}
                      />
                    </div>

                    <strong>
                      {getProviderName()}
                    </strong>

                    <span>
                      {callState ===
                      "CALLING"
                        ? "Calling..."
                        : "Audio call"}
                    </span>

                  </div>
                )}

                {/* CALL STATUS */}

                {callState ===
                  "CALLING" && (
                  <div className="patient-chat-call-status">
                    Calling{" "}
                    {getProviderName()}...
                  </div>
                )}

                {/* CALL CONTROLS */}

                <div className="patient-chat-call-controls">

                  {callState ===
                    "CONNECTED" && (
                    <>
                      <button
                        type="button"
                        onClick={
                          handleToggleMute
                        }
                        title={
                          callMuted
                            ? "Unmute"
                            : "Mute"
                        }
                      >
                        {callMuted ? (
                          <MicOff
                            size={18}
                          />
                        ) : (
                          <Mic
                            size={18}
                          />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={
                          handleToggleSpeaker
                        }
                        title={
                          callSpeakerOn
                            ? "Turn speaker off"
                            : "Turn speaker on"
                        }
                      >
                        {callSpeakerOn ? (
                          <Volume2
                            size={18}
                          />
                        ) : (
                          <VolumeX
                            size={18}
                          />
                        )}
                      </button>
                    </>
                  )}

                  {callState ===
                  "CALLING" ? (
                    <button
                      type="button"
                      className="patient-chat-call-end"
                      onClick={
                        handleCancelCall
                      }
                      title="Cancel call"
                    >
                      <PhoneOff
                        size={19}
                      />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="patient-chat-call-end"
                      onClick={
                        handleEndCall
                      }
                      title="End call"
                    >
                      <PhoneOff
                        size={19}
                      />
                    </button>
                  )}

                </div>
              </div>
            </div>
          )}

        {/* =====================================
            FILE PREVIEW
        ===================================== */}

        {selectedFile && (
          <div className="patient-chat-file-preview">

            <div className="patient-chat-file-preview-icon">
              {selectedFile.type.startsWith(
                "image/"
              ) ? (
                <ImageIcon size={18} />
              ) : (
                <FileText size={18} />
              )}
            </div>

            <div className="patient-chat-file-preview-info">

              <strong>
                {selectedFile.name}
              </strong>

              <span>
                {formatFileSize(
                  selectedFile.size
                )}
              </span>

            </div>

            <button
              type="button"
              className="patient-chat-file-remove"
              onClick={
                removeSelectedFile
              }
              disabled={sendingFile}
              title="Remove attachment"
              aria-label="Remove attachment"
            >
              <X size={16} />
            </button>

            <button
              type="button"
              className="patient-chat-file-send"
              onClick={
                handleSendFile
              }
              disabled={sendingFile}
              title="Send attachment"
              aria-label="Send attachment"
            >
              {sendingFile ? (
                <Loader2
                  size={16}
                  className="patient-chat-spinner"
                />
              ) : (
                <Send size={16} />
              )}
            </button>

          </div>
        )}

        {/* =====================================
            EMOJI PICKER
        ===================================== */}

        {showEmojiPicker && (
          <div className="patient-chat-emoji-picker">

            {emojis.map((emoji) => (
              <button
                type="button"
                key={emoji}
                onClick={() =>
                  handleEmojiClick(
                    emoji
                  )
                }
              >
                {emoji}
              </button>
            ))}

          </div>
        )}

        {/* =====================================
            COMPOSER
        ===================================== */}

        <div className="patient-chat-composer">

          {!isRecording ? (
            <>
              {/* ATTACHMENT */}

              <button
                type="button"
                className="patient-chat-composer-icon"
                onClick={
                  handleAttachmentClick
                }
                disabled={
                  sendingFile ||
                  uploadingVoice
                }
                title="Attach file"
                aria-label="Attach file"
              >
                <Paperclip size={19} />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                hidden
                accept={[
                  "image/jpeg",
                  "image/png",
                  "image/webp",
                  "image/gif",
                  "application/pdf",
                  "application/msword",
                  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                  "application/vnd.ms-excel",
                  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                  "text/plain",
                  "application/zip",
                  "application/x-zip-compressed",
                ].join(",")}
                onChange={
                  handleFileSelect
                }
              />

              {/* EMOJI */}

              <button
                type="button"
                className="patient-chat-composer-icon"
                title="Emoji"
                aria-label="Emoji"
                onClick={() => {
                  setShowEmojiPicker(
                    (previous) =>
                      !previous
                  );

                  setShowMoreMenu(false);
                }}
                disabled={
                  uploadingVoice
                }
              >
                <Smile size={19} />
              </button>

              {/* MESSAGE INPUT */}

              <input
                type="text"
                value={message}
                onChange={(event) =>
                  setMessage(
                    event.target.value
                  )
                }
                onKeyDown={
                  handleKeyDown
                }
                placeholder="Type a message..."
                disabled={
                  sending ||
                  uploadingVoice
                }
              />

              {/* VOICE */}

              {message.trim() ? (
                <button
                  type="button"
                  className="patient-chat-send-button"
                  onClick={
                    handleSendMessage
                  }
                  disabled={
                    sending ||
                    uploadingVoice
                  }
                  title="Send message"
                  aria-label="Send message"
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
                  className="patient-chat-composer-icon"
                  title="Record voice message"
                  aria-label="Record voice message"
                  onClick={
                    startVoiceRecording
                  }
                  disabled={
                    uploadingVoice
                  }
                >
                  {uploadingVoice ? (
                    <Loader2
                      size={19}
                      className="patient-chat-spinner"
                    />
                  ) : (
                    <Mic size={19} />
                  )}
                </button>
              )}
            </>
          ) : (
            <>
              {/* CANCEL RECORDING */}

              <button
                type="button"
                className="patient-chat-composer-icon"
                onClick={
                  cancelVoiceRecording
                }
                title="Cancel recording"
                aria-label="Cancel recording"
              >
                <X size={19} />
              </button>

              {/* RECORDING STATUS */}

              <div className="patient-chat-recording-status">

                <span className="patient-chat-recording-dot"></span>

                <strong>
                  Recording
                </strong>

                <span>
                  {formatRecordingTime(
                    recordingSeconds
                  )}
                </span>

              </div>

              {/* STOP AND SEND */}

              <button
                type="button"
                className="patient-chat-send-button"
                onClick={
                  stopVoiceRecording
                }
                title="Stop and send voice message"
                aria-label="Stop and send voice message"
              >
                <Send size={18} />
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

export default ChatWindow;

