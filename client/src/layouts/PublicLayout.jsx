
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function PublicLayout({ children }) {
  return (
    <div className="public-layout">
      <Navbar />

      <main>{children}</main>

      <Footer />
    </div>
  );
}

export default PublicLayout;

