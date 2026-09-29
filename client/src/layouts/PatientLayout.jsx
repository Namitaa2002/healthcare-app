
import { useEffect, useRef, useState } from "react";

import { Outlet } from "react-router-dom";

import {
  BellRing,
  Check,
  CheckCheck,
  Clock3,
  MailOpen,
} from "lucide-react";

import PatientSidebar from "../components/PatientSidebar";

import socket from "../services/socket.js";

import { useAuth } from "../context/AuthContext.jsx";

import { getSettings } from "../services/settingsService";

import api from "../services/api";

import "../styles/patientNotifications.css";

function PatientLayout() {
  const { user } = useAuth();

  const [notificationsEnabled, setNotificationsEnabled] =
    useState(true);

  const [notifications, setNotifications] =
    useState([]);

  const [unreadCount, setUnreadCount] =
    useState(0);

  const [showNotifications, setShowNotifications] =
    useState(false);

  const notificationRef = useRef(null);

  // =========================================
  // SOCKET CONNECTION
  // =========================================

  useEffect(() => {
    if (!user?.id) {
      console.log(
        "Socket not connected: user.id is missing"
      );

      return;
    }

    const userId = user.id;

    console.log(
      "Preparing socket connection for user:",
      userId
    );

const handleConnect = () => {
  console.log(
    "Socket connected. Joining user room:",
    userId
  );

  socket.emit("join-user", userId, (response) => {
    console.log(
      "JOIN USER ACK FROM SERVER:",
      response
    );
  });
};

    // =========================================
    // IF SOCKET IS ALREADY CONNECTED
    // =========================================

    if (socket.connected) {
      console.log(
        "Socket already connected. Joining user room:",
        userId
      );

      socket.emit("join-user", userId);
    } else {
      // =========================================
      // CONNECT SOCKET
      // =========================================

      socket.on("connect", handleConnect);

      console.log(
        "Connecting socket for user:",
        userId
      );

      socket.connect();
    }

    // =========================================
    // CLEANUP
    // =========================================

    return () => {
      socket.off("connect", handleConnect);

      if (socket.connected) {
        socket.emit("leave-user", userId);
        socket.disconnect();
      }
    };
  }, [user?.id]);

  // =========================================
  // FETCH NOTIFICATIONS
  // =========================================

  const fetchNotifications = async () => {
    try {
      const response =
        await api.get("/notifications");

      setNotifications(
        response.data?.data || []
      );
    } catch (error) {
      console.error(
        "Fetch notifications error:",
        error
      );

      setNotifications([]);
    }
  };

  // =========================================
  // FETCH UNREAD COUNT
  // =========================================

  const fetchUnreadCount = async () => {
    try {
      const response =
        await api.get(
          "/notifications/unread-count"
        );

      setUnreadCount(
        response.data?.data?.count || 0
      );
    } catch (error) {
      console.error(
        "Fetch unread notification count error:",
        error
      );

      setUnreadCount(0);
    }
  };

  // =========================================
  // INITIAL FETCH
  // =========================================

  useEffect(() => {
    const initializePatientLayout =
      async () => {
        try {
          const response =
            await getSettings();

          if (response.data) {
            const enabled =
              response.data
                .appointmentReminders;

            setNotificationsEnabled(
              enabled
            );

            if (!enabled) {
              setShowNotifications(false);
              return;
            }
          }

          await fetchNotifications();
          await fetchUnreadCount();
        } catch (error) {
          console.error(
            "Fetch notification settings error:",
            error
          );
        }
      };

    initializePatientLayout();
  }, []);

  // =========================================
  // SYNC NOTIFICATION SETTING
  // =========================================

  useEffect(() => {
    const handleNotificationSettingChange = (
      event
    ) => {
      const enabled =
        event.detail?.enabled;

      if (typeof enabled !== "boolean") {
        return;
      }

      setNotificationsEnabled(enabled);

      if (!enabled) {
        setShowNotifications(false);
        return;
      }

      fetchNotifications();
      fetchUnreadCount();
    };

    window.addEventListener(
      "patient-notification-setting-changed",
      handleNotificationSettingChange
    );

    return () => {
      window.removeEventListener(
        "patient-notification-setting-changed",
        handleNotificationSettingChange
      );
    };
  }, []);

  // =========================================
  // CLOSE DROPDOWN ON OUTSIDE CLICK
  // =========================================

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(
          event.target
        )
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  // =========================================
  // MARK AS READ
  // =========================================

  const handleMarkAsRead = async (
    notification
  ) => {
    if (notification.isRead) {
      return;
    }

    try {
      await api.patch(
        `/notifications/${notification.id}/read`
      );

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? {
                ...item,
                isRead: true,
              }
            : item
        )
      );

      setUnreadCount((current) =>
        Math.max(current - 1, 0)
      );
    } catch (error) {
      console.error(
        "Mark notification as read error:",
        error
      );
    }
  };

  // =========================================
  // MARK AS UNREAD
  // =========================================

  const handleMarkAsUnread = async (
    notification
  ) => {
    if (!notification.isRead) {
      return;
    }

    try {
      await api.patch(
        `/notifications/${notification.id}/unread`
      );

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? {
                ...item,
                isRead: false,
              }
            : item
        )
      );

      setUnreadCount(
        (current) => current + 1
      );
    } catch (error) {
      console.error(
        "Mark notification as unread error:",
        error
      );
    }
  };

  // =========================================
  // MARK ALL AS READ
  // =========================================

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) {
      return;
    }

    try {
      await api.patch(
        "/notifications/read-all"
      );

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          isRead: true,
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error(
        "Mark all notifications as read error:",
        error
      );
    }
  };

  // =========================================
  // FORMAT TIME
  // =========================================

  const formatNotificationTime = (
    date
  ) => {
    if (!date) {
      return "";
    }

    const notificationDate =
      new Date(date);

    const now = new Date();

    const differenceInSeconds =
      Math.floor(
        (now - notificationDate) / 1000
      );

    if (differenceInSeconds < 60) {
      return "Just now";
    }

    const differenceInMinutes =
      Math.floor(
        differenceInSeconds / 60
      );

    if (differenceInMinutes < 60) {
      return `${differenceInMinutes} ${
        differenceInMinutes === 1
          ? "minute"
          : "minutes"
      } ago`;
    }

    const differenceInHours =
      Math.floor(
        differenceInMinutes / 60
      );

    if (differenceInHours < 24) {
      return `${differenceInHours} ${
        differenceInHours === 1
          ? "hour"
          : "hours"
      } ago`;
    }

    const differenceInDays =
      Math.floor(
        differenceInHours / 24
      );

    if (differenceInDays < 7) {
      return `${differenceInDays} ${
        differenceInDays === 1
          ? "day"
          : "days"
      } ago`;
    }

    return notificationDate.toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  };

  return (
    <div className="patient-dashboard">
      <PatientSidebar />

      <main className="patient-main">
        <div className="patient-topbar">
          <div className="patient-topbar-spacer"></div>

          {/* =========================================
              NOTIFICATIONS
          ========================================= */}

          {notificationsEnabled && (
            <div
              className="patient-notification-wrapper"
              ref={notificationRef}
            >
              <button
                type="button"
                className={`patient-notification-button ${
                  showNotifications
                    ? "active"
                    : ""
                }`}
                aria-label="Notifications"
                aria-expanded={
                  showNotifications
                }
                onClick={() =>
                  setShowNotifications(
                    (current) =>
                      !current
                  )
                }
              >
                <BellRing size={21} />

                {unreadCount > 0 && (
                  <span className="patient-notification-dot">
                    {unreadCount > 99
                      ? "99+"
                      : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="patient-notification-dropdown">
                  <div className="patient-notification-header">
                    <div>
                      <span>
                        Notifications
                      </span>

                      <strong>
                        {unreadCount > 0
                          ? `${unreadCount} unread`
                          : "All caught up"}
                      </strong>
                    </div>

                    {unreadCount > 0 && (
                      <button
                        type="button"
                        className="patient-mark-all-button"
                        onClick={
                          handleMarkAllAsRead
                        }
                      >
                        <CheckCheck
                          size={15}
                        />
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="patient-notification-list">
                    {notifications.length ===
                    0 ? (
                      <div className="patient-notification-empty">
                        <div className="patient-notification-empty-icon">
                          <BellRing
                            size={22}
                          />
                        </div>

                        <strong>
                          No notifications
                        </strong>

                        <span>
                          You're all caught
                          up.
                        </span>
                      </div>
                    ) : (
                      notifications.map(
                        (notification) => (
                          <div
                            key={
                              notification.id
                            }
                            className={`patient-notification-item ${
                              notification.isRead
                                ? "read"
                                : "unread"
                            }`}
                          >
                            <div className="patient-notification-item-icon">
                              {notification.isRead ? (
                                <MailOpen
                                  size={17}
                                />
                              ) : (
                                <BellRing
                                  size={17}
                                />
                              )}
                            </div>

                            <div className="patient-notification-item-content">
                              <strong>
                                {
                                  notification.title
                                }
                              </strong>

                              <p>
                                {
                                  notification.message
                                }
                              </p>

                              <span>
                                <Clock3
                                  size={12}
                                />

                                {formatNotificationTime(
                                  notification.createdAt
                                )}
                              </span>

                              <div className="patient-notification-actions">
                                {notification.isRead ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleMarkAsUnread(
                                        notification
                                      )
                                    }
                                  >
                                    <BellRing
                                      size={12}
                                    />

                                    Mark as
                                    unread
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleMarkAsRead(
                                        notification
                                      )
                                    }
                                  >
                                    <Check
                                      size={12}
                                    />

                                    Mark as
                                    read
                                  </button>
                                )}
                              </div>
                            </div>

                            {!notification.isRead && (
                              <span className="patient-notification-unread-dot"></span>
                            )}
                          </div>
                        )
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <Outlet />
      </main>
    </div>
  );
}

export default PatientLayout;

