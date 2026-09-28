import PublicLayout from "./layouts/PublicLayout";
import AppRoutes from "./routes/AppRoutes";

function App() {
  return (
    <PublicLayout>
      <AppRoutes />
    </PublicLayout>
  );
}

export default App;