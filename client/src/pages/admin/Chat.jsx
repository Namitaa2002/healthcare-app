import { useEffect, useState } from "react";
import { Loader2, MessageCircle, Search, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import socket from "../../services/socket";
import { useAuth } from "../../context/AuthContext";
import "../../styles/adminChat.css";

function AdminChat() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchChatData();
  }, []);

  useEffect(() => {
  if (!user?.id) {
    return;
  }

  if (!socket.connected) {
    socket.connect();
  }

  const joinUserRoom = () => {
    socket.emit("join-user", user.id, (response) => {
      console.log("Admin user room:", response);
    });
  };

  if (socket.connected) {
    joinUserRoom();
  }

  socket.on("connect", joinUserRoom);

  return () => {
    socket.off("connect", joinUserRoom);
  };
}, [user?.id]);

  useEffect(() => {
  if (!socket.connected) {
    socket.connect();
  }

  const handleNewChatMessage = (data) => {
    const newMessage = data?.message || data;

    if (!newMessage?.conversationId) {
      return;
    }

    setConversations((currentConversations) => {
      const conversationExists = currentConversations.some(
        (conversation) =>
          String(conversation.id) ===
          String(newMessage.conversationId)
      );

      if (!conversationExists) {
        fetchChatData();
        return currentConversations;
      }

      return currentConversations.map((conversation) => {
        if (
          String(conversation.id) !==
          String(newMessage.conversationId)
        ) {
          return conversation;
        }

        const currentLatestMessage =
          conversation.messages?.[0];

        if (
          currentLatestMessage?.id &&
          String(currentLatestMessage.id) ===
            String(newMessage.id)
        ) {
          return conversation;
        }

        return {
          ...conversation,
          updatedAt:
            newMessage.createdAt ||
            newMessage.updatedAt ||
            new Date().toISOString(),
          messages: [
            newMessage,
            ...(conversation.messages || []),
          ],
          unreadCount:
            (conversation.unreadCount || 0) + 1,
        };
      });
    });
  };

  socket.on("new-chat-message", handleNewChatMessage);

  return () => {
    socket.off("new-chat-message", handleNewChatMessage);
  };
}, []);

  const fetchChatData = async () => {
    try {
      setLoading(true);
      setError("");

      const [chatResponse, providerResponse] = await Promise.all([
        api.get("/chat"),
        api.get("/providers/admin"),
      ]);

      setConversations(chatResponse.data?.data || []);
      setProviders(providerResponse.data?.data || []);
    } catch (err) {
      console.error("Admin chat loading error:", err);
      setError(
        err.response?.data?.message ||
          "Unable to load chat data."
      );
    } finally {
      setLoading(false);
    }
  };

  const getProvider = (conversation) => {
    return conversation.participants?.find(
      (participant) =>
        participant.user?.role === "PROVIDER"
    );
  };

  const filteredConversations = conversations.filter(
    (conversation) => {
      const provider = getProvider(conversation);

      if (!provider) return false;

      const name =
        provider.user?.name?.toLowerCase() || "";

      const email =
        provider.user?.email?.toLowerCase() || "";

      return (
        name.includes(search.toLowerCase()) ||
        email.includes(search.toLowerCase())
      );
    }
  );

  const conversationProviderIds = conversations
  .map((conversation) => {
    const provider = getProvider(conversation);

    return provider?.user?.id
      ? String(provider.user.id)
      : null;
  })
  .filter(Boolean);

const filteredProviders = providers.filter((provider) => {
  const providerUserId =
    provider.userId ||
    provider.user?.id ||
    provider.id;

  if (
    conversationProviderIds.includes(
      String(providerUserId)
    )
  ) {
    return false;
  }

  const name =
    provider.user?.name ||
    provider.name ||
    "";

  const email =
    provider.user?.email ||
    provider.email ||
    "";

  return (
    name.toLowerCase().includes(search.toLowerCase()) ||
    email.toLowerCase().includes(search.toLowerCase())
  );
});

  const handleProviderClick = (providerUserId) => {
    navigate(`/admin/chat/provider/${providerUserId}`);
  };

  const formatTime = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="admin-chat-page">
        <div className="admin-chat-loading">
          <Loader2 size={28} className="spin" />
          <span>Loading chats...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-chat-page">
      {/* HEADER */}
      <div className="admin-chat-header">
        <div>
          <h1>Messages</h1>
          <p>
            Communicate directly with your providers.
          </p>
        </div>

        <div className="admin-chat-header-icon">
          <MessageCircle size={24} />
        </div>
      </div>

      {/* SEARCH */}
      <div className="admin-chat-search-wrapper">
        <Search size={19} />

        <input
          type="text"
          placeholder="Search providers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && (
        <div className="admin-chat-error">
          {error}
        </div>
      )}

      {/* CHAT LIST */}
      <div className="admin-chat-list">
        {filteredConversations.map((conversation) => {
          const provider = getProvider(conversation);

          if (!provider) return null;

          const providerUserId = provider.user?.id;

          return (
            <button
              type="button"
              className="admin-chat-item"
              key={conversation.id}
              onClick={() =>
                handleProviderClick(providerUserId)
              }
            >
              <div className="admin-chat-avatar">
                <UserRound size={21} />
              </div>

              <div className="admin-chat-item-content">
                <div className="admin-chat-item-top">
                  <strong>
                    {provider.user?.name || "Provider"}
                  </strong>

                  <span>
                    {formatTime(conversation.updatedAt)}
                  </span>
                </div>

                <div className="admin-chat-item-bottom">
                  <span>
                    {conversation.messages?.[0]?.content ||
                      "Start a conversation"}
                  </span>

                  {conversation.unreadCount > 0 && (
                    <small>New</small>
                  )}
                </div>
              </div>
            </button>
          );
        })}

        {/* PROVIDERS WITHOUT CHAT */}
        {filteredProviders.map((provider) => {
          const providerUserId =
            provider.userId ||
            provider.user?.id ||
            provider.id;

          const name =
            provider.user?.name ||
            provider.name ||
            "Provider";

          const email =
            provider.user?.email ||
            provider.email ||
            "";

          return (
            <button
              type="button"
              className="admin-chat-item"
              key={providerUserId}
              onClick={() =>
                handleProviderClick(providerUserId)
              }
            >
              <div className="admin-chat-avatar">
                <UserRound size={21} />
              </div>

              <div className="admin-chat-item-content">
                <div className="admin-chat-item-top">
                  <strong>{name}</strong>
                </div>

                <div className="admin-chat-item-bottom">
                <span>{email}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {filteredConversations.length === 0 &&
        filteredProviders.length === 0 &&
        !error && (
          <div className="admin-chat-empty">
            <MessageCircle size={42} />
            <h3>No providers found</h3>
            <p>
              Providers will appear here when available.
            </p>
          </div>
        )}
    </div>
  );
}

export default AdminChat;