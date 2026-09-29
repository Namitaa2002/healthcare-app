import { Outlet } from "react-router-dom";

import AdminSidebar from "../components/AdminSidebar";

function AdminLayout() {
  return (
    <div className="admin-layout">
      <AdminSidebar />

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;