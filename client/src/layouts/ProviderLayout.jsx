
import { Outlet } from "react-router-dom";

import ProviderSidebar from "../components/ProviderSidebar";

function ProviderLayout() {
  return (
    <div className="provider-dashboard">
      <ProviderSidebar />

      <main className="provider-main">
        <Outlet />
      </main>
    </div>
  );
}

export default ProviderLayout;

