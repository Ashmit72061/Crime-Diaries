import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { Bell, User, LogOut, Settings, Award, Shield } from "lucide-react";
import useAuthStore from "../../store/authStore.js";
import { useAuth } from "../../hooks/useAuth.js";
import { findNodeById } from "../../utils/hierarchyData.js";

export default function PoliceNavbar({ notifications, removeNotification }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const location = useLocation();
  const { logoutMutation } = useAuth();
  const { user, activeNodeId, setActiveNodeId } = useAuthStore();

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
    }
    
    return crumbs;
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="navbar-header" aria-label="Main Header">
      <div className="navbar-left">
        <nav aria-label="Breadcrumb" className="breadcrumbs-nav">
          <ol className="breadcrumbs-list">
            {getBreadcrumbs().map((crumb, idx, arr) => (
              <li key={crumb.to} className="breadcrumb-item">
                {idx < arr.length - 1 ? (
                  <>
                    <Link to={crumb.to}>
                      {crumb.label}
                    </Link>
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
        {/* Terminal Authorization Scope Badge (Read-Only) */}
        <div className="console-switcher-container">
          <Shield size={14} className="text-amber-500" />
          <span className="console-switcher-label" translate="no">Authorized Terminal:</span>
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200" translate="no">
            {findNodeById(activeNodeId)?.name || "Secure Terminal"}
          </span>
        </div>

        {/* Localized Time Display */}
        <div className="time-display tabular-numbers" aria-live="off" translate="no">
          {currentTime}
        </div>

        {/* Notifications Dropdown */}
        <div className="nav-dropdown-wrapper">
          <button
            type="button"
            className="nav-icon-btn"
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setProfileOpen(false);
            }}
            aria-label={`View ${notifications.length} alerts`}
            aria-expanded={notificationsOpen}
          >
            <Bell size={20} aria-hidden="true" />
            {notifications.length > 0 && (
              <span className="badge-count tabular-numbers">{notifications.length}</span>
            )}
          </button>
          
          {notificationsOpen && (
            <div className="dropdown-panel notifications-panel" role="region" aria-label="Notifications Panel">
              <div className="dropdown-panel-header">
                <h3>Notifications</h3>
              </div>
              <div className="dropdown-panel-body">
                {notifications.length === 0 ? (
                  <div className="empty-state">No Active Alerts</div>
                ) : (
                  notifications.map((notif) => (
                    <div key={notif.id} className="notification-item">
                      <div className="notif-content">
                        <p>{notif.text}</p>
                        <span className="notif-time">{notif.time}</span>
                      </div>
                      <button
                        type="button"
                        className="notif-close-btn"
                        onClick={(e) => removeNotification(notif.id, e)}
                        aria-label="Dismiss alert"
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Officer Profile Dropdown */}
        <div className="nav-dropdown-wrapper">
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
            <div className="officer-details text-left font-sans">
              <span className="officer-name block text-sm font-semibold">{user?.username || "HC Ramesh Kumar"}</span>
              <span className="officer-rank block text-xs text-slate-400">
                {user?.rank || "Station Operator"}{user?.stationName ? ` (PS ${user.stationName})` : user?.districtKey ? ` (${user.districtKey})` : ""}
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
