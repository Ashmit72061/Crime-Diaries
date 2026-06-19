import React, { useState, useEffect, useRef } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { Bell, User, LogOut, Settings, Award, Shield, CheckCheck, RefreshCw, Wifi, WifiOff } from "lucide-react";
import useAuthStore from "../../store/authStore.js";
import { useAuth } from "../../hooks/useAuth.js";
import LanguageToggle from "../ui/LanguageToggle.jsx";

export default function PoliceNavbar({
  notifications = [],
  unreadCount = 0,
  isConnected = false,
  markRead,
  markAllRead,
  refreshNotifications,
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notifPanelRef = useRef(null);
  const profilePanelRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { logoutMutation } = useAuth();
  const { user, jurisdiction } = useAuthStore();

  // Live localized clock as per i18n instructions
  useEffect(() => {
    const updateTime = () => {
      const formatter = new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "medium",
        timeStyle: "medium",
      });
      setCurrentTime(formatter.format(new Date()));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifPanelRef.current && !notifPanelRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
      if (profilePanelRef.current && !profilePanelRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute breadcrumbs dynamically from current pathname
  const getBreadcrumbs = () => {
    const path = location.pathname;
    const crumbs = [{ label: "Command Center", to: "/dashboard" }];
    if (path === "/dashboard" || path === "/dashboard/") {
      crumbs.push({ label: "Dashboard", to: "/dashboard" });
    } else if (path.includes("/case-management")) {
      crumbs.push({ label: "Case Management", to: "/dashboard/case-management" });
    } else if (path.includes("/arrest-management")) {
      crumbs.push({ label: "Arrest Management", to: "/dashboard/arrest-management" });
    } else if (path.includes("/pcr-calls")) {
      crumbs.push({ label: "PCR Calls", to: "/dashboard/pcr-calls" });
    } else if (path.includes("/uidb-management")) {
      crumbs.push({ label: "UIDB Management", to: "/dashboard/uidb-management" });
    } else if (path.includes("/missing-persons")) {
      crumbs.push({ label: "Missing Persons", to: "/dashboard/missing-persons" });
    } else if (path.includes("/records")) {
      crumbs.push({ label: "Records", to: "/records" });
    } else if (path.includes("/queue")) {
      crumbs.push({ label: "Approval Queue", to: "/queue" });
    } else if (path.includes("/district")) {
      crumbs.push({ label: "District", to: "/district" });
    } else if (path.includes("/hq")) {
      crumbs.push({ label: "Headquarters", to: "/hq" });
    }
    return crumbs;
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleMarkRead = (id, e) => {
    e?.stopPropagation();
    markRead?.(id);
  };

  const handleMarkAllRead = (e) => {
    e?.stopPropagation();
    markAllRead?.();
  };

  const handleRefresh = (e) => {
    e?.stopPropagation();
    refreshNotifications?.();
  };

  const formatRelativeTime = (isoString) => {
    if (!isoString) return "";
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <header className="navbar-header" aria-label="Main Header">
      <div className="navbar-left">
        <nav aria-label="Breadcrumb" className="breadcrumbs-nav">
          <ol className="breadcrumbs-list">
            {getBreadcrumbs().map((crumb, idx, arr) => (
              <li key={`${crumb.to}-${idx}`} className="breadcrumb-item">
                {idx < arr.length - 1 ? (
                  <>
                    <Link to={crumb.to}>{crumb.label}</Link>
                    <span className="crumb-separator" aria-hidden="true">/</span>
                  </>
                ) : (
                  <span className="crumb-current" aria-current="page">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>

      <div className="navbar-right">
        {/* Terminal Authorization Scope Badge */}
        <div className="console-switcher-container cursor-default" style={{ borderColor: 'var(--border-light)' }}>
          <Shield size={14} className="text-amber-500" />
          <span className="text-xs font-bold text-amber-600 tracking-wide uppercase select-none" style={{ fontFamily: 'var(--font-sans)' }}>
            {(() => {
              if (!user) return "";
              const roleUpper = user.role.toUpperCase();
              if (roleUpper === 'SYSTEM_ADMIN') return "SYSTEM ADMIN VIEW";
              if (roleUpper === 'HQ_ANALYST' || roleUpper === 'HQ_ADMIN') return "HEADQUARTERS VIEW | DELHI POLICE HQ";
              if (roleUpper === 'HC' || roleUpper === 'SHO') {
                return `PS VIEW | ${jurisdiction?.station?.name_en?.toUpperCase() || 'POLICE STATION'}`;
              }
              if (roleUpper === 'ACP') {
                return `SUB-DIVISION VIEW | ${jurisdiction?.sub_division?.name_en?.toUpperCase() || 'SUB-DIVISION'}`;
              }
              if (roleUpper === 'DISTRICT_OFFICER') {
                return `DISTRICT VIEW | ${jurisdiction?.district?.name_en?.toUpperCase() || 'DISTRICT'}`;
              }
              return "VIEW | UNKNOWN JURISDICTION";
            })()}
          </span>
        </div>

        {/* SSE Live Indicator */}
        <div
          title={isConnected ? "Live feed connected" : "Connecting to live feed…"}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.05em',
            color: isConnected ? '#22c55e' : '#94a3b8',
            opacity: 0.85,
          }}
        >
          {isConnected
            ? <Wifi size={12} />
            : <WifiOff size={12} />}
          <span className="hidden sm:inline">{isConnected ? "LIVE" : "—"}</span>
        </div>

        {/* Localized Time Display */}
        <div className="time-display tabular-numbers" aria-live="off" translate="no">
          {currentTime}
        </div>

        {/* EN ↔ हिन्दी Toggle */}
        <LanguageToggle variant="pill" />

        {/* Notifications Dropdown */}
        <div className="nav-dropdown-wrapper" ref={notifPanelRef}>
          <button
            type="button"
            id="notifications-btn"
            className="nav-icon-btn"
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setProfileOpen(false);
            }}
            aria-label={`View ${unreadCount} unread alerts`}
            aria-expanded={notificationsOpen}
          >
            <Bell size={20} aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="badge-count tabular-numbers">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </button>

          {notificationsOpen && (
            <div
              className="dropdown-panel notifications-panel"
              role="region"
              aria-label="Notifications Panel"
              style={{ minWidth: '340px', maxWidth: '400px' }}
            >
              {/* Panel Header */}
              <div className="dropdown-panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <h3 style={{ margin: 0 }}>Notifications {unreadCount > 0 && <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 700 }}>({unreadCount} unread)</span>}</h3>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      title="Mark all as read"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#60a5fa', padding: '2px 4px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}
                    >
                      <CheckCheck size={13} /> All read
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleRefresh}
                    title="Refresh"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px 4px', borderRadius: '4px' }}
                  >
                    <RefreshCw size={12} />
                  </button>
                </div>
              </div>

              {/* Panel Body */}
              <div className="dropdown-panel-body" style={{ maxHeight: '360px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div className="empty-state" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                    <Bell size={24} style={{ marginBottom: '8px', opacity: 0.4 }} />
                    <p style={{ margin: 0, fontSize: '13px' }}>No notifications</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="notification-item"
                      style={{
                        padding: '12px 14px',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        background: notif.is_read ? 'transparent' : 'rgba(96, 165, 250, 0.05)',
                        borderLeft: notif.is_read ? 'none' : '3px solid #60a5fa',
                        transition: 'background 0.2s',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            margin: '0 0 4px 0',
                            fontSize: '13px',
                            fontWeight: notif.is_read ? 400 : 600,
                            color: notif.is_read ? '#94a3b8' : '#f1f5f9',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}>
                            {notif.title_en || notif.message_en || 'Notification'}
                          </p>
                          {notif.message_en && notif.title_en && (
                            <p style={{
                              margin: '0 0 6px 0',
                              fontSize: '11px',
                              color: '#64748b',
                              lineHeight: '1.4',
                            }}>
                              {notif.message_en}
                            </p>
                          )}
                          <span style={{ fontSize: '10px', color: '#475569' }}>
                            {formatRelativeTime(notif.created_at)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }}>
                          {!notif.is_read && (
                            <button
                              type="button"
                              onClick={(e) => handleMarkRead(notif.id, e)}
                              title="Mark as read"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#60a5fa', padding: '2px', borderRadius: '3px' }}
                            >
                              <CheckCheck size={14} />
                            </button>
                          )}
                          {notif.record_id && (
                            <button
                              type="button"
                              onClick={() => { navigate('/queue'); setNotificationsOpen(false); }}
                              title="Go to queue"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px', fontSize: '10px', borderRadius: '3px' }}
                            >
                              →
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Officer Profile Dropdown */}
        <div className="nav-dropdown-wrapper" ref={profilePanelRef}>
          <button
            type="button"
            className="officer-profile-btn"
            onClick={() => {
              setProfileOpen(!profileOpen);
              setNotificationsOpen(false);
            }}
            aria-expanded={profileOpen}
            aria-label="Officer Profile menu"
          >
            <div className="officer-avatar" aria-hidden="true">
              <User size={16} />
            </div>
            <div className="officer-details text-left font-sans flex flex-col justify-center leading-tight">
              <span className="officer-name block text-sm font-semibold">{user?.username || "HC Ramesh Kumar"}</span>
              <span className="officer-rank block text-[11px] text-slate-400 font-medium">{user?.rank || "Station Operator"}</span>
              <span className="officer-jurisdiction block text-[10px] text-amber-500 font-bold uppercase tracking-wider mt-0.5">
                {user?.role === 'SYSTEM_ADMIN' ? 'Central Administration' :
                 user?.role === 'HQ_ANALYST' || user?.role === 'HQ_ADMIN' ? 'Delhi Police HQ' :
                 user?.role === 'DISTRICT_OFFICER' ? jurisdiction?.district?.name_en :
                 user?.role === 'ACP' ? jurisdiction?.sub_division?.name_en :
                 jurisdiction?.station?.name_en}
              </span>
            </div>
          </button>

          {profileOpen && (
            <div className="dropdown-panel profile-panel" role="menu">
              <div className="profile-panel-header">
                <Award size={24} className="badge-icon text-amber-500" aria-hidden="true" />
                <div>
                  <h4 translate="no">{user?.pis || "PIS-28160942"}</h4>
                  <p>{user?.rank || "Station Operator"}</p>
                </div>
              </div>
              <ul className="profile-menu-list">
                <li role="menuitem">
                  <button type="button" onClick={() => alert("Settings panel simulation…")}>
                    <Settings size={16} aria-hidden="true" />
                    <span>System Settings</span>
                  </button>
                </li>
                <li role="menuitem">
                  <button type="button" className="btn-danger-link" onClick={handleLogout}>
                    <LogOut size={16} aria-hidden="true" />
                    <span>Sign Out Session</span>
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
