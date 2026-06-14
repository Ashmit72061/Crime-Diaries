import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  FileText, 
  UserX, 
  PhoneCall, 
  Fingerprint, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Plus
} from "lucide-react";
import delhiPoliceLogo from "../../assets/delhi_police_logo.png";

export default function PoliceSidebar({ isCollapsed, setIsCollapsed }) {
  const [expandedSubmenu, setExpandedSubmenu] = useState(null);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
    { 
      id: "case-management", 
      label: "Case Management", 
      icon: FileText,
      to: "/dashboard/case-management",
      subItems: [{ id: "case-management-new", label: "New Case Entry", icon: Plus, to: "/dashboard/case-management" }]
    },
    { 
      id: "arrest-management", 
      label: "Arrest Management", 
      icon: UserX,
      to: "/dashboard/arrest-management",
      subItems: [{ id: "arrest-management-new", label: "New Arrest Entry", icon: Plus, to: "/dashboard/arrest-management" }]
    },
    { 
      id: "pcr-calls", 
      label: "PCR Calls", 
      icon: PhoneCall,
      to: "/dashboard/pcr-calls",
      subItems: [{ id: "pcr-calls-new", label: "New PCR Entry", icon: Plus, to: "/dashboard/pcr-calls" }]
    },
    { 
      id: "uidb-management", 
      label: "UIDB Management", 
      icon: Fingerprint,
      to: "/dashboard/uidb-management",
      subItems: [{ id: "uidb-management-new", label: "New UIDB Entry", icon: Plus, to: "/dashboard/uidb-management" }]
    },
    { 
      id: "missing-persons", 
      label: "Missing Persons", 
      icon: Search,
      to: "/dashboard/missing-persons",
      subItems: [{ id: "missing-persons-new", label: "New Missing Entry", icon: Plus, to: "/dashboard/missing-persons" }]
    }
  ];

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
              <span className="brand-main">DELHI POLICE</span>
              <span className="brand-sub">CRIME DIARY</span>
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
                    const SubIcon = subItem.icon;
                    return (
                      <NavLink
                        key={subItem.id}
                        to={subItem.to}
                        role="menuitem"
                        className={({ isActive }) => `submenu-link ${isActive ? "active" : ""}`}
                        aria-label={subItem.label}
                      >
                        <SubIcon size={14} aria-hidden="true" className="submenu-icon" />
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
