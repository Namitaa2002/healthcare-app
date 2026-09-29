
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowRight,
  Loader2,
  MessageCircle,
  Search,
  UserRound,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import socket from "../../services/socket";

import "../../styles/patientChat.css";

function Chat() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [providers, setProviders] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================
  // FETCH CHAT DATA
  // =========================================

  const fetchChatData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [
        providersResponse,
        conversationsResponse,
      ] = await Promise.all([
        api.get("/providers/public"),
        api.get("/chat"),
      ]);

      const providerData =
        providersResponse.data?.data || [];

      const conversationData =
        conversationsResponse.data?.data || [];

      console.log(
        "PATIENT PROVIDERS:",
        providerData
      );

      console.log(
        "PATIENT CONVERSATIONS:",
        conversationData
      );

      setProviders(providerData);
      setConversations(conversationData);
    } catch (error) {
      console.error(
        "Fetch patient chat data error:",
        error
      );

      setProviders([]);
      setConversations([]);

      setError(
        error.response?.data?.message ||
          "Unable to load chat. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // =========================================
  // INITIAL LOAD
  // =========================================

  useEffect(() => {
    fetchChatData();
  }, [fetchChatData]);

  // =========================================
  // REFRESH WHEN PAGE GETS FOCUS
  // =========================================

  useEffect(() => {
    const handleFocus = () => {
      fetchChatData();
    };

    window.addEventListener(
      "focus",
      handleFocus
    );

    return () => {
      window.removeEventListener(
        "focus",
        handleFocus
      );
    };
  }, [fetchChatData]);

  // =========================================
  // LISTEN FOR NEW CHAT MESSAGE
  // =========================================

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    console.log(
      "Chat.jsx registering new-chat-message listener for:",
      user.id
    );

    const handleNewChatMessage = (message) => {
      console.log(
        "PATIENT RECEIVED NEW CHAT MESSAGE:",
        message
      );

      if (!message?.conversationId) {
        console.log(
          "New message ignored: conversationId missing"
        );

        return;
      }

      // Ignore messages sent by current patient.
      if (message.senderId === user.id) {
        console.log(
          "New message ignored: message sent by current patient"
        );

        return;
      }

      console.log(
        "UPDATING CONVERSATION WITH UNREAD:",
        {
          conversationId:
            message.conversationId,

          senderId: message.senderId,

          patientId: user.id,
        }
      );

      setConversations(
        (currentConversations) => {
          const conversationIndex =
            currentConversations.findIndex(
              (conversation) =>
                conversation.id ===
                message.conversationId
            );

          console.log(
            "CONVERSATION INDEX:",
            conversationIndex
          );

          // =====================================
          // CONVERSATION ALREADY EXISTS
          // =====================================

          if (conversationIndex !== -1) {
            const updatedConversations = [
              ...currentConversations,
            ];

            const currentConversation =
              updatedConversations[
                conversationIndex
              ];

            const newUnreadCount =
              Number(
                currentConversation.unreadCount ||
                  0
              ) + 1;

            console.log(
              "CURRENT CONVERSATION:",
              currentConversation
            );

            console.log(
              "NEW UNREAD COUNT:",
              newUnreadCount
            );

            updatedConversations[
              conversationIndex
            ] = {
              ...currentConversation,

              latestMessage: message,

              messages: [message],

              unreadCount: newUnreadCount,

              updatedAt:
                message.createdAt ||
                new Date().toISOString(),
            };

            // Move updated conversation to top.
            const [updatedConversation] =
              updatedConversations.splice(
                conversationIndex,
                1
              );

            return [
              updatedConversation,
              ...updatedConversations,
            ];
          }

          // =====================================
          // NEW CONVERSATION
          // =====================================

          console.log(
            "Creating new conversation from socket message"
          );

          return [
            {
              id: message.conversationId,

              participants: [
                {
                  userId: message.senderId,

                  user: message.sender || {
                    id: message.senderId,
                  },
                },

                {
                  userId: user.id,

                  user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                  },
                },
              ],

              latestMessage: message,

              messages: [message],

              unreadCount: 1,

              updatedAt:
                message.createdAt ||
                new Date().toISOString(),
            },

            ...currentConversations,
          ];
        }
      );
    };

    socket.on(
      "new-chat-message",
      handleNewChatMessage
    );

    return () => {
      console.log(
        "Chat.jsx removing new-chat-message listener"
      );

      socket.off(
        "new-chat-message",
        handleNewChatMessage
      );
    };
  }, [
    user?.id,
    user?.name,
    user?.email,
    user?.role,
  ]);

  // =========================================
  // CONVERSATION MAP
  // =========================================

  const conversationMap = useMemo(() => {
    const map = new Map();

    conversations.forEach((conversation) => {
      const participants =
        conversation.participants || [];

      console.log(
        "CONVERSATION MAP PROCESSING:",
        {
          conversationId: conversation.id,
          participants,
        }
      );

      const otherParticipant =
        participants.find((participant) => {
          const participantUserId =
            participant.userId ||
            participant.user?.id;

          return (
            participantUserId &&
            participantUserId !== user?.id
          );
        });

      if (!otherParticipant) {
        console.log(
          "No other participant found:",
          conversation.id
        );

        return;
      }

      const providerUserId =
        otherParticipant.userId ||
        otherParticipant.user?.id;

      if (!providerUserId) {
        return;
      }

      console.log(
        "CONVERSATION MAP:",
        {
          conversationId: conversation.id,

          providerUserId,

          latestMessage:
            conversation.latestMessage,

          unreadCount:
            conversation.unreadCount,
        }
      );

      map.set(
        providerUserId,
        conversation
      );
    });

    return map;
  }, [conversations, user?.id]);

  // =========================================
  // FILTER PROVIDERS
  // =========================================

  const filteredProviders = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    if (!searchValue) {
      return providers;
    }

    return providers.filter((provider) => {
      const providerName =
        provider.user?.name ||
        provider.name ||
        "";

      const specialization =
        provider.specialization || "";

      const qualification =
        provider.qualification || "";

      return (
        providerName
          .toLowerCase()
          .includes(searchValue) ||
        specialization
          .toLowerCase()
          .includes(searchValue) ||
        qualification
          .toLowerCase()
          .includes(searchValue)
      );
    });
  }, [providers, search]);

  // =========================================
  // PROVIDER USER ID
  // =========================================

  const getProviderUserId = (provider) => {
    return (
      provider.user?.id ||
      provider.userId ||
      provider.id
    );
  };

  // =========================================
  // PROVIDER NAME
  // =========================================

  const getProviderName = (provider) => {
    return (
      provider.user?.name ||
      provider.name ||
      "Provider"
    );
  };

  // =========================================
  // OPEN CHAT
  // =========================================

  const handleOpenChat = (provider) => {
    const providerUserId =
      getProviderUserId(provider);

    if (!providerUserId) {
      return;
    }

    navigate(
      `/patient/chat/provider/${providerUserId}`
    );
  };

  // =========================================
  // GET LAST MESSAGE
  // =========================================

  const getLastMessage = (conversation) => {
    return (
      conversation.latestMessage ||
      conversation.messages?.[0] ||
      null
    );
  };

  // =========================================
  // GET UNREAD COUNT
  // =========================================

  const getUnreadCount = (conversation) => {
    if (!conversation) {
      return 0;
    }

    return Number(
      conversation.unreadCount || 0
    );
  };

  // =========================================
  // MESSAGE PREVIEW
  // =========================================

  const getMessagePreview = (conversation) => {
    const latestMessage =
      getLastMessage(conversation);

    if (!latestMessage) {
      return "Start a conversation";
    }

    if (
      latestMessage.messageType ===
      "IMAGE"
    ) {
      return "📷 Image";
    }

    if (
      latestMessage.messageType ===
      "FILE"
    ) {
      return "📎 File";
    }

    return (
      latestMessage.content ||
      "Message"
    );
  };

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <div className="patient-chat-page">
        <div className="patient-chat-loading">
          <Loader2
            size={18}
            className="patient-chat-spinner"
          />

          Loading chats...
        </div>
      </div>
    );
  }

  // =========================================
  // MAIN
  // =========================================

  return (
    <div className="patient-chat-page">
      {/* =====================================
          HEADER
      ===================================== */}

      <div className="patient-chat-header">
        <div>
          <span className="patient-chat-eyebrow">
            COMMUNICATION
          </span>

          <h1>
            Chat with Providers
          </h1>

          <p>
            Connect with your healthcare
            provider securely.
          </p>
        </div>
      </div>

      {/* =====================================
          ERROR
      ===================================== */}

      {error && (
        <div className="patient-chat-error">
          {error}
        </div>
      )}

      {/* =====================================
          SEARCH
      ===================================== */}

      <div className="patient-chat-search">
        <Search size={18} />

        <input
          type="text"
          placeholder="Search providers..."
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
        />
      </div>

      {/* =====================================
          EMPTY
      ===================================== */}

      {filteredProviders.length === 0 ? (
        <div className="patient-chat-empty">
          <div className="patient-chat-empty-icon">
            <MessageCircle size={25} />
          </div>

          <strong>
            {search
              ? "No providers found"
              : "No providers available"}
          </strong>

          <span>
            {search
              ? "Try a different search."
              : "There are no providers available for chat right now."}
          </span>
        </div>
      ) : (
        /* ===================================
           PROVIDER LIST
        =================================== */

        <div className="patient-chat-provider-list">
          {filteredProviders.map(
            (provider) => {
              const providerUserId =
                getProviderUserId(
                  provider
                );

              const conversation =
                conversationMap.get(
                  providerUserId
                );

              const unreadCount =
                getUnreadCount(
                  conversation
                );

              const unread =
                unreadCount > 0;

              const providerName =
                getProviderName(
                  provider
                );

              console.log(
                "PROVIDER ROW:",
                {
                  providerUserId,
                  providerName,
                  conversationId:
                    conversation?.id,
                  unreadCount,
                  unread,
                }
              );

              return (
                <button
                  type="button"
                  key={providerUserId}
                  className={`patient-chat-provider ${
                    unread
                      ? "has-unread-message unread"
                      : ""
                  }`}
                  onClick={() =>
                    handleOpenChat(
                      provider
                    )
                  }
                >
                  {/* =========================
                      PROVIDER AVATAR
                  ========================= */}

                  <div
                    className={`patient-chat-avatar ${
                      unread
                        ? "unread"
                        : ""
                    }`}
                  >
                    <UserRound size={22} />
                  </div>

                  {/* =========================
                      PROVIDER INFO
                  ========================= */}

                  <div className="patient-chat-provider-info">
                    <div className="patient-chat-provider-name-row">
                      <strong
                        className={
                          unread
                            ? "patient-chat-provider-unread-name"
                            : ""
                        }
                      >
                        {providerName}
                      </strong>

                      {/* =====================
                          NEW BADGE
                      ===================== */}

                      {unread && (
                        <span className="patient-chat-new-badge">
                          New
                        </span>
                      )}
                    </div>

                    {/* SPECIALIZATION */}

                    {provider.specialization && (
                      <span className="patient-chat-provider-specialization">
                        {
                          provider.specialization
                        }
                      </span>
                    )}

                    {/* =====================
                        LAST MESSAGE
                    ===================== */}

                    {conversation ? (
                      <small
                        className={`patient-chat-last-message ${
                          unread
                            ? "unread"
                            : ""
                        }`}
                      >
                        {getMessagePreview(
                          conversation
                        )}
                      </small>
                    ) : provider.qualification ? (
                      <small className="patient-chat-provider-qualification">
                        {
                          provider.qualification
                        }
                      </small>
                    ) : (
                      <small>
                        Start a conversation
                      </small>
                    )}
                  </div>

                  {/* =========================
                      RIGHT SIDE
                  ========================= */}

                  <div className="patient-chat-provider-right">
                    {/* =====================
                        UNREAD COUNT
                    ===================== */}

                    {unread && (
                      <span
                        className="patient-chat-new-dot"
                        title={`${unreadCount} unread message${
                          unreadCount > 1
                            ? "s"
                            : ""
                        }`}
                      >
                        {unreadCount > 99
                          ? "99+"
                          : unreadCount}
                      </span>
                    )}

                    {/* =====================
                        ARROW
                    ===================== */}

                    <span className="patient-chat-open-icon">
                      <ArrowRight size={17} />
                    </span>
                  </div>
                </button>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}

export default Chat;

