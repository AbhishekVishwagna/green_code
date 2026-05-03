import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import ClickSpark from "@/components/ClickSpark";
import DarkVeil from "@/components/DarkVeil";
import Landing from "@/pages/Landing";
import Audit from "@/pages/Audit";
import Scan from "@/pages/Scan";
import BadgePreview from "@/pages/BadgePreview";
import Dashboard from "@/pages/Dashboard";
import About from "@/pages/About";
import Learn from "@/pages/Learn";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/"             element={<Landing />}      />
        <Route path="/audit"        element={<Audit />}        />
        <Route path="/scan"         element={<Scan />}         />
        <Route path="/dashboard"    element={<Dashboard />}    />
        <Route path="/badge-preview"element={<BadgePreview />} />
        <Route path="/about"        element={<About />}        />
        <Route path="/learn"        element={<Learn />}        />
        <Route path="*"             element={<NotFound />}     />
      </Routes>
    </AnimatePresence>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <ClickSpark
        sparkColor="#00e887"
        sparkSize={12}
        sparkRadius={22}
        sparkCount={10}
        duration={460}
        extraScale={1.1}
      >
        <div className="darkveil-layer">
          <DarkVeil
            hueShift={18}
            noiseIntensity={0.035}
            scanlineIntensity={0.035}
            scanlineFrequency={2.2}
            speed={0.25}
            warpAmount={0.42}
            resolutionScale={0.8}
          />
        </div>
        <div className="relative z-10">
          <Navbar />
          <AnimatedRoutes />
        </div>
      </ClickSpark>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
