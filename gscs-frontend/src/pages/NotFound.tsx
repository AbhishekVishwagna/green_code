import PageWrapper from "@/components/PageWrapper";
import { Link } from "react-router-dom";

const NotFound = () => (
  <PageWrapper>
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
      <h1 className="font-mono text-6xl font-bold text-primary mb-4">404</h1>
      <p className="font-mono text-muted-foreground mb-6">Page not found</p>
      <Link to="/" className="px-6 py-2 rounded-md font-mono text-sm border text-foreground glow-hover press-effect" style={{ borderColor: "hsl(120 33% 16%)" }}>
        Go Home
      </Link>
    </div>
  </PageWrapper>
);

export default NotFound;
