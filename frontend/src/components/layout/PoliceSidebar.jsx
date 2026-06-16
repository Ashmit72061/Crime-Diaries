import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { 
  Shield,
  FileText, 
  UserX, 
  PhoneCall, 
  Fingerprint, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  ClipboardList,
  BarChart3,
  FileSpreadsheet,
  Users,
  Network,
  Settings,
  Building
} from "lucide-react";
import delhiPoliceLogo from "../../assets/delhi_police_logo.png";
import useAuthStore from "../../store/authStore.js";

export default function PoliceSidebar({ isCollapsed, setIsCollapsed }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const { user } = useAuthStore();
  const [expandedSubmenu, setExpandedSubmenu] = useState(null);

  const role = user?.role || 'PS';

  // Build navigation items based on active authorization role
  const getNavItems = () => {
    const items = [];

    // ── Head Constable (HC / PS) Desk ──────────────────────────────────────────
    if (role === 'PS' || role === 'HC') {
      items.push(
        { id: "records", label: t('nav.records', 'My Records'), icon: FileText, to: "/records" },
        { 
          id: "new-record", 
          label: t('nav.newRecord', 'New Record'), 
          icon: Plus,
          to: "/records/new/CASE",
          subItems: [
            { id: "new-case", label: t('recordTypes.CASE', 'Cases FIR'), to: "/records/new/CASE" },
            { id: "new-arrest", label: t('recordTypes.ARREST', 'Arrest Register'), to: "/records/new/ARREST" },
            { id: "new-pcr", label: t('recordTypes.PCR_CALL', 'PCR Calls'), to: "/records/new/PCR_CALL" },
            { id: "new-missing", label: t('recordTypes.MISSING', 'Missing Register'), to: "/records/new/MISSING" },
            { id: "new-uidb", label: t('recordTypes.UIDB', 'UIDB Unidentified Bodies'), to: "/records/new/UIDB" },
          ]
        }
      );
    }

    // ── Reviewer / SHO Desk ───────────────────────────────────────────────────
    if (role === 'SHO') {
      items.push(
        { id: "queue", label: t('nav.queue', 'Approval Desk'), icon: ClipboardList, to: "/queue" },
        { id: "analytics", label: t('nav.analytics', 'Analytics Console'), icon: BarChart3, to: "/analytics" }
      );
    }

    // ── District DCP Desk ─────────────────────────────────────────────────────
    if (role === 'DISTRICT' || role === 'DISTRICT_OFFICER') {
      items.push(
        { id: "district", label: t('nav.district', 'District View'), icon: Shield, to: "/district" },
        { id: "queue", label: t('nav.queue', 'Approval Desk'), icon: ClipboardList, to: "/queue" },
        { id: "compile", label: t('nav.compile', 'Compile Records'), icon: FileSpreadsheet, to: "/compile" },
        { id: "analytics", label: t('nav.analytics', 'Analytics Console'), icon: BarChart3, to: "/analytics" },
        { id: "reports", label: t('nav.reports', 'Excel Export Manager'), icon: FileSpreadsheet, to: "/reports" }
      );
    }

    // ── HQ Analyst Desk ───────────────────────────────────────────────────────
    if (role === 'HQ' || role === 'HQ_ANALYST' || role === 'HQ_ADMIN') {
      items.push(
        { id: "hq", label: t('nav.hq', 'Command Center'), icon: Building, to: "/hq" },
        { id: "analytics", label: t('nav.analytics', 'Analytics Console'), icon: BarChart3, to: "/analytics" },
        { id: "reports", label: t('nav.reports', 'Excel Export Manager'), icon: FileSpreadsheet, to: "/reports" }
      );
    }

    // ── Platform System Administrator ─────────────────────────────────────────
    if (role === 'SYSTEM_ADMIN') {
      items.push(
        { id: "admin-users", label: t('nav.adminUsers', 'Users Register'), icon: Users, to: "/admin/users" },
        { id: "admin-hierarchy", label: t('nav.adminHierarchy', 'Hierarchy Config'), icon: Network, to: "/admin/hierarchy" },
        { id: "admin-fields", label: t('nav.adminFields', 'Field Registry'), icon: Settings, to: "/admin/fields" }
      );
    }

    return items;
  };

  const navItems = getNavItems();

  const handleNavClick = (itemId, hasSubItems) => {
    if (isCollapsed) {
      setIsCollapsed(false);
    }
    if (hasSubItems) {
      setExpandedSubmenu(expandedSubmenu === itemId ? null : itemId);
    }
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    if (!isCollapsed) {
      setExpandedSubmenu(null);
    }
  };

  return (
    <aside 
      className={`sidebar-nav ${isCollapsed ? "collapsed" : "expanded"}`}
      aria-label="Primary Navigation"
    >
      <div className="sidebar-header">
        <div className="emblem-container">
          <img 
            src={delhiPoliceLogo} 
            alt="Delhi Police emblem" 
            className="w-8 h-8 object-contain flex-shrink-0" 
            style={{ filter: "drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.15))" }}
          />
          {!isCollapsed && (
            <div className="brand-text">
              <span className="brand-main">PHAROS</span>
              <span className="brand-sub" style={{ fontSize: "0.6rem" }}>DELHI POLICE</span>
            </div>
          )}
        </div>
      </div>

      <nav className="sidebar-menu">
        {navItems.map((item) => {
          const Icon = item.icon;
          const hasSubItems = !!item.subItems;
          const isSubmenuExpanded = expandedSubmenu === item.id && !isCollapsed;

          return (
            <div key={item.id} className="menu-item-group">
              {hasSubItems ? (
                <button
                  type="button"
                  className="menu-link"
                  onClick={() => handleNavClick(item.id, hasSubItems)}
                  aria-expanded={isSubmenuExpanded}
                  aria-label={`${item.label} navigation`}
                >
                  <div className="menu-link-left">
                    <Icon className="menu-icon" size={20} aria-hidden="true" />
                    {!isCollapsed && <span className="menu-text">{item.label}</span>}
                  </div>
                  {!isCollapsed && (
                    <span className={`submenu-indicator ${isSubmenuExpanded ? "open" : ""}`} aria-hidden="true">
                      ▼
                    </span>
                  )}
                </button>
              ) : (
                <NavLink
                  to={item.to}
                  end
                  className={({ isActive }) => `menu-link ${isActive ? "active" : ""}`}
                  aria-label={`${item.label} navigation`}
                >
                  <div className="menu-link-left">
                    <Icon className="menu-icon" size={20} aria-hidden="true" />
                    {!isCollapsed && <span className="menu-text">{item.label}</span>}
                  </div>
                </NavLink>
              )}

              {hasSubItems && isSubmenuExpanded && (
                <div className="submenu-list" role="menu">
                  {item.subItems.map((subItem) => {
                    return (
                      <NavLink
                        key={subItem.id}
                        to={subItem.to}
                        role="menuitem"
                        className={({ isActive }) => `submenu-link ${isActive ? "active" : ""}`}
                        aria-label={subItem.label}
                      >
                        <span className="submenu-text">{subItem.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button
          type="button"
          className="collapse-btn"
          onClick={toggleSidebar}
          aria-label={isCollapsed ? "Expand sidebar navigation" : "Collapse sidebar navigation"}
        >
          {isCollapsed ? (
            <ChevronRight size={18} aria-hidden="true" />
          ) : (
            <div className="collapse-btn-content">
              <ChevronLeft size={18} aria-hidden="true" />
              <span>Collapse Sidebar</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
