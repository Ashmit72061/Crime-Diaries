import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import PoliceSidebar from "./PoliceSidebar.jsx";
import PoliceNavbar from "./PoliceNavbar.jsx";
import ReportModal from "../ui/ReportModal.jsx";

export default function DashboardLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: "New PCR call assigned to PS Parliament Street", time: "2m ago" },
    { id: 2, text: "Arrest report pending DCP approval", time: "15m ago" },
  ]);
  
  // Report Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalData, setModalData] = useState({});
  const [modalType, setModalType] = useState("");

  const addNotification = (text, time = "Just now") => {
    setNotifications((prev) => [
      { id: Date.now(), text, time },
      ...prev,
    ]);
  };

  const removeNotification = (id, e) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const onSubmitReport = (title, data, type) => {
    setModalTitle(title);
    setModalData(data);
    setModalType(type);
    setModalOpen(true);
    addNotification(`Report generated: ${title}`, "Just now");
  };

  return (
    <div className="app-container">
      <PoliceSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className="main-content">
        <PoliceNavbar 
          notifications={notifications} 
          removeNotification={removeNotification} 
        />
        <main className="page-wrapper">
          <Outlet context={{ onSubmitReport, addNotification }} />
        </main>
      </div>

      <ReportModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title={modalTitle} 
        data={modalData} 
        type={modalType} 
      />
    </div>
  );
}
