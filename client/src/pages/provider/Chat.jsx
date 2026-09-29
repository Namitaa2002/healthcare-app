import { useEffect, useState } from "react";

import {
  Loader2,
  MessageCircle,
  Search,
  UserRound,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import api from "../../services/api";

import "../../styles/providerChat.css";

function ProviderChat() {
  const navigate = useNavigate();

  const [conversations, setConversations] =
    useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/chat");

        setConversations(
          response.data?.data || []
        );
      } catch (error) {
        console.error(
          "Fetch provider conversations error:",
          error
        );

        setConversations([]);

        setError(
          error.response?.data?.message ||
            "Unable to load conversations."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  // Get the other user from conversation
  // It can be a PATIENT or an ADMIN.
  const getRecipient = (conversation) => {
    return conversation.participants?.find(
      (participant) =>
        participant.user?.role !== "PROVIDER"
    )?.user;
  };

  const getRecipientLabel = (recipient) => {
    if (
      recipient?.role === "ORGANIZATION_ADMIN" ||
      recipient?.role === "BRANCH_ADMIN"
    ) {
      return "Admin";
    }

    if (recipient?.role === "PATIENT") {
      return "Patient";
    }

    return "User";
  };

  const filteredConversations =
    conversations.filter((conversation) => {
      const recipient =
        getRecipient(conversation);

      const searchText =
        search.trim().toLowerCase();

      if (!searchText) {
        return true;
      }

      const name =
        recipient?.name?.toLowerCase() || "";

      const email =
        recipient?.email?.toLowerCase() || "";

      return (
        name.includes(searchText) ||
        email.includes(searchText)
      );
    });

  const handleConversationClick = (
    conversation
  ) => {
    const recipient =
      getRecipient(conversation);

    if (!recipient?.id) {
      setError(
        "Unable to open this conversation."
      );
      return;
    }

    navigate(
      `/provider/chat/user/${recipient.id}`
    );
  };

  const formatMessageTime = (date) => {
    if (!date) {
      return "";
    }

    return new Date(date).toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const getLastMessage = (conversation) => {
    const message =
      conversation.messages?.[0];

    if (!message) {
      return "No messages yet";
    }

    if (
      message.messageType === "IMAGE"
    ) {
      return "📷 Image";
    }

    if (
      message.messageType === "FILE"
    ) {
      return "📎 File";
    }

    if (
      message.messageType === "AUDIO"
    ) {
      return "🎵 Voice message";
    }

    return message.content || "Attachment";
  };

  if (loading) {
    return (
      <div className="provider-chat-page">
        <div className="provider-chat-loading">
          <Loader2
            size={22}
            className="provider-chat-loading-icon"
          />

          <span>
            Loading conversations...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="provider-chat-page">
      <div className="provider-chat-header">
        <div>
          <span className="provider-chat-eyebrow">
            Messages
          </span>

          <h1>Chat</h1>

          <p>
            Communicate directly with your
            patients and admin.
          </p>
        </div>

        <div className="provider-chat-title-icon">
          <MessageCircle size={23} />
        </div>
      </div>

      {error && (
        <div className="provider-chat-error">
          {error}
        </div>
      )}

      <div className="provider-chat-card">
        <div className="provider-chat-toolbar">
          <div className="provider-chat-search">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search patients or admin..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          <span className="provider-chat-count">
            {filteredConversations.length}{" "}
            {filteredConversations.length === 1
              ? "conversation"
              : "conversations"}
          </span>
        </div>

        {filteredConversations.length === 0 ? (
          <div className="provider-chat-empty">
            <div className="provider-chat-empty-icon">
              <MessageCircle size={28} />
            </div>

            <strong>
              No conversations found
            </strong>

            <span>
              Your conversations will appear
              here when you start or receive
              a chat.
            </span>
          </div>
        ) : (
          <div className="provider-chat-list">
            {filteredConversations.map(
              (conversation) => {
                const recipient =
                  getRecipient(conversation);

                const lastMessage =
                  conversation.messages?.[0];

                const unread =
                  lastMessage &&
                  lastMessage.senderId ===
                    recipient?.id &&
                  !lastMessage.isRead;

                const recipientLabel =
                  getRecipientLabel(
                    recipient
                  );

                return (
                  <button
                    type="button"
                    key={conversation.id}
                    className={`provider-chat-item ${
                      unread ? "unread" : ""
                    }`}
                    onClick={() =>
                      handleConversationClick(
                        conversation
                      )
                    }
                  >
                    <div className="provider-chat-avatar">
                      <UserRound size={23} />
                    </div>

                    <div className="provider-chat-item-content">
                      <div className="provider-chat-item-top">
                        <strong>
                          {recipient?.name ||
                            recipientLabel}
                        </strong>

                        <span>
                          {formatMessageTime(
                            lastMessage?.createdAt
                          )}
                        </span>
                      </div>

                      <div className="provider-chat-item-bottom">
                        <p>
                          {getLastMessage(
                            conversation
                          )}
                        </p>

                        <span className="provider-chat-role">
                          {recipientLabel}
                        </span>

                        {unread && (
                          <span className="provider-chat-unread">
                            New
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              }
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProviderChat;