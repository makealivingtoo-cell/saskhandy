import { useEffect, useRef } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AddToHomeScreen } from "./components/AddToHomeScreen";

// Pages
import Home from "./pages/Home";
import AboutPage from "./pages/AboutPage";
import BlogPage from "./pages/BlogPage";
import BlogArticlePage from "./pages/BlogArticlePage";
import SaskatchewanHandymanServicesPage from "./pages/SaskatchewanHandymanServices";
import SaskatoonHandymanServicesPage from "./pages/SaskatoonHandymanServices";
import ReginaHandymanServicesPage from "./pages/ReginaHandymanServices";
import FurnitureAssemblySaskatchewanPage from "./pages/FurnitureAssemblySaskatchewan";
import TvMountingSaskatchewanPage from "./pages/TvMountingSaskatchewan";
import PlumbingRepairsSaskatchewanPage from "./pages/PlumbingRepairsSaskatchewan";
import ElectricalHelpSaskatchewanPage from "./pages/ElectricalHelpSaskatchewan";
import YardWorkSaskatchewanPage from "./pages/YardWorkSaskatchewan";
import DrywallPaintingSaskatchewanPage from "./pages/DrywallPaintingSaskatchewan";
import MooseJawHandymanServicesPage from "./pages/MooseJawHandymanServices";
import PrinceAlbertHandymanServicesPage from "./pages/PrinceAlbertHandymanServices";
import WarmanHandymanServicesPage from "./pages/WarmanHandymanServices";
import MartensvilleHandymanServicesPage from "./pages/MartensvilleHandymanServices";
import {
  BaseboardAndTrimInstallationSaskatoonPage,
  BbqAssemblyServiceSaskatoonPage,
  BestTvWallMountSaskatoonPage,
  BlindsAndCurtainRodInstallationSaskatoonPage,
  CaulkingRepairBathtubShowerSaskatoonPage,
  CeilingDrywallWaterDamageRepairSaskatoonPage,
  DeadboltAndDoorLockReplacementSaskatoonPage,
  DeckRepairSaskatoonPage,
  DiyVsProfessionalDoorbellInstallationSaskatoonPage,
  DoorbellSecuritySaskatoonPage,
  DrywallRepairAndPatchingSaskatoonPage,
  FaucetRepairAndInstallationSaskatoonPage,
  FencePostReplacementSaskatoonPage,
  FenceRepairAndGateFixSaskatoonPage,
  IkeaFurnitureAssemblySaskatoonPage,
  InteriorDoorHangingServiceSaskatoonPage,
  InteriorPaintingHandymanSaskatoonPage,
  LeakyToiletRepairServiceSaskatoonPage,
  LocalHandymanServicesSaskatoonPage,
  LocalSeoSaskatoonServicesPage,
  MinorPlumbingHandymanSaskatoonPage,
  ProfessionalDeckStainingSaskatoonPage,
  ProfessionalTvMountingSaskatoonPage,
  RingDoorbellInstallationSaskatoonPage,
  SmartDoorbellInstallationSaskatoonPage,
  SmartHomeDoorbellIntegrationSaskatoonPage,
  TvInstallationServiceSaskatoonPage,
  TvMountingSaskatoonPage,
  WallHangingMirrorAndArtInstallationSaskatoonPage,
  WayfairFurnitureAssemblerSaskatoonPage,
} from "./pages/SaskatoonSeoPages";
import {
  DeckRepairReginaPage,
  DrywallRepairReginaPage,
  FenceRepairReginaPage,
  FurnitureAssemblyReginaPage,
  InteriorPaintingHandymanReginaPage,
  LocalHandymanServicesReginaPage,
  MinorPlumbingHandymanReginaPage,
  RingDoorbellInstallationReginaPage,
  TvMountingReginaPage,
} from "./pages/ReginaSeoPages";
import RoleSelect from "./pages/RoleSelect";
import HandymanOnboarding from "./pages/HandymanOnboarding";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmailPage from "./pages/VerifyEmail";
import SupportPage from "./pages/Support";
import SupportTicketPage from "./pages/SupportTicket";
import AdminSupportPage from "./pages/AdminSupport";
import TermsPage from "./pages/Terms";
import PrivacyPage from "./pages/Privacy";
import OpenJobsSaskatoonPage from "./pages/OpenJobsSaskatoon";

// Homeowner
import HomeownerDashboard from "./pages/homeowner/Dashboard";
import PostJob from "./pages/homeowner/PostJob";
import JobDetails from "./pages/homeowner/JobDetails";
import EditJob from "./pages/homeowner/EditJob";
import MessagesPage from "./pages/Messages";

// Handyman
import HandymanDashboard from "./pages/handyman/Dashboard";
import BrowseJobs from "./pages/handyman/BrowseJobs";
import HandymanJobDetails from "./pages/handyman/JobDetails";
import MyBids from "./pages/handyman/MyBids";
import HandymanProfile from "./pages/handyman/Profile";
import HandymanEarnings from "./pages/handyman/Earnings";

// Shared
import PublicProfile from "./pages/PublicProfile";
import AdminPanel from "./pages/AdminPanel";


function MetaPixelPageViewTracker() {
  const [location] = useLocation();
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    const fbq = (window as any).fbq;

    if (typeof fbq === "function") {
      fbq("track", "PageView");
    }
  }, [location]);

  return null;
}

function GoogleAnalyticsPageViewTracker() {
  const [location] = useLocation();
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    const gtag = (window as any).gtag;

    if (typeof gtag === "function") {
      gtag("config", "G-04W23ZEZM6", {
        page_path: location,
      });
    }
  }, [location]);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={AboutPage} />
      <Route path="/blog" component={BlogPage} />
      <Route path="/blog/:slug" component={BlogArticlePage} />
      <Route path="/open-jobs-saskatoon" component={OpenJobsSaskatoonPage} />

      <Route path="/saskatchewan-handyman-services" component={SaskatchewanHandymanServicesPage} />
      <Route path="/saskatoon-handyman-services" component={SaskatoonHandymanServicesPage} />
      <Route path="/regina-handyman-services" component={ReginaHandymanServicesPage} />
      {/* Regina SEO pages */}
      <Route path="/local-handyman-services-regina" component={LocalHandymanServicesReginaPage} />
      <Route path="/tv-mounting-regina" component={TvMountingReginaPage} />
      <Route path="/furniture-assembly-regina" component={FurnitureAssemblyReginaPage} />
      <Route path="/drywall-repair-regina" component={DrywallRepairReginaPage} />
      <Route path="/fence-repair-regina" component={FenceRepairReginaPage} />
      <Route path="/deck-repair-regina" component={DeckRepairReginaPage} />
      <Route path="/minor-plumbing-handyman-regina" component={MinorPlumbingHandymanReginaPage} />
      <Route path="/interior-painting-handyman-regina" component={InteriorPaintingHandymanReginaPage} />
      <Route path="/ring-doorbell-installation-regina" component={RingDoorbellInstallationReginaPage} />


      <Route path="/furniture-assembly-saskatchewan" component={FurnitureAssemblySaskatchewanPage} />
      <Route path="/tv-mounting-saskatchewan" component={TvMountingSaskatchewanPage} />
      <Route path="/plumbing-repairs-saskatchewan" component={PlumbingRepairsSaskatchewanPage} />
      <Route path="/electrical-help-saskatchewan" component={ElectricalHelpSaskatchewanPage} />
      <Route path="/yard-work-saskatchewan" component={YardWorkSaskatchewanPage} />
      <Route path="/drywall-painting-saskatchewan" component={DrywallPaintingSaskatchewanPage} />

      <Route path="/moose-jaw-handyman-services" component={MooseJawHandymanServicesPage} />
      <Route path="/prince-albert-handyman-services" component={PrinceAlbertHandymanServicesPage} />
      <Route path="/warman-handyman-services" component={WarmanHandymanServicesPage} />
      <Route path="/martensville-handyman-services" component={MartensvilleHandymanServicesPage} />

      {/* Saskatoon SEO pages */}
      <Route path="/tv-mounting-saskatoon" component={TvMountingSaskatoonPage} />
      <Route path="/professional-tv-mounting-saskatoon" component={ProfessionalTvMountingSaskatoonPage} />
      <Route path="/tv-installation-service-saskatoon" component={TvInstallationServiceSaskatoonPage} />
      <Route path="/best-tv-wall-mount-saskatoon" component={BestTvWallMountSaskatoonPage} />
      <Route path="/ring-doorbell-installation-saskatoon" component={RingDoorbellInstallationSaskatoonPage} />
      <Route path="/smart-doorbell-installation-saskatoon" component={SmartDoorbellInstallationSaskatoonPage} />
      <Route path="/smart-home-doorbell-integration-saskatoon" component={SmartHomeDoorbellIntegrationSaskatoonPage} />
      <Route path="/home-security-doorbell-installation-saskatoon" component={DoorbellSecuritySaskatoonPage} />
      <Route path="/diy-vs-professional-doorbell-installation-saskatoon" component={DiyVsProfessionalDoorbellInstallationSaskatoonPage} />
      <Route path="/local-seo-tv-mounting-doorbell-installation-saskatoon" component={LocalSeoSaskatoonServicesPage} />

      <Route path="/deck-repair-saskatoon" component={DeckRepairSaskatoonPage} />
      <Route path="/professional-deck-staining-saskatoon" component={ProfessionalDeckStainingSaskatoonPage} />
      <Route path="/fence-repair-and-gate-fix-saskatoon" component={FenceRepairAndGateFixSaskatoonPage} />
      <Route path="/fence-post-replacement-saskatoon" component={FencePostReplacementSaskatoonPage} />
      <Route path="/drywall-repair-and-patching-saskatoon" component={DrywallRepairAndPatchingSaskatoonPage} />
      <Route path="/ceiling-drywall-water-damage-repair-saskatoon" component={CeilingDrywallWaterDamageRepairSaskatoonPage} />
      <Route path="/interior-painting-handyman-saskatoon" component={InteriorPaintingHandymanSaskatoonPage} />
      <Route path="/baseboard-and-trim-installation-saskatoon" component={BaseboardAndTrimInstallationSaskatoonPage} />
      <Route path="/faucet-repair-and-installation-saskatoon" component={FaucetRepairAndInstallationSaskatoonPage} />
      <Route path="/leaky-toilet-repair-service-saskatoon" component={LeakyToiletRepairServiceSaskatoonPage} />
      <Route path="/minor-plumbing-handyman-saskatoon" component={MinorPlumbingHandymanSaskatoonPage} />
      <Route path="/caulking-repair-bathtub-shower-saskatoon" component={CaulkingRepairBathtubShowerSaskatoonPage} />
      <Route path="/ikea-furniture-assembly-saskatoon" component={IkeaFurnitureAssemblySaskatoonPage} />
      <Route path="/wayfair-furniture-assembler-saskatoon" component={WayfairFurnitureAssemblerSaskatoonPage} />
      <Route path="/bbq-assembly-service-saskatoon" component={BbqAssemblyServiceSaskatoonPage} />
      <Route path="/wall-hanging-mirror-and-art-installation-saskatoon" component={WallHangingMirrorAndArtInstallationSaskatoonPage} />
      <Route path="/blinds-and-curtain-rod-installation-saskatoon" component={BlindsAndCurtainRodInstallationSaskatoonPage} />
      <Route path="/interior-door-hanging-service-saskatoon" component={InteriorDoorHangingServiceSaskatoonPage} />
      <Route path="/deadbolt-and-door-lock-replacement-saskatoon" component={DeadboltAndDoorLockReplacementSaskatoonPage} />
      <Route path="/local-handyman-services-saskatoon" component={LocalHandymanServicesSaskatoonPage} />

      <Route path="/sign-in" component={SignIn} />
      <Route path="/sign-up" component={SignUp} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/verify-email" component={VerifyEmailPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/role-select" component={RoleSelect} />
      <Route path="/onboarding" component={HandymanOnboarding} />

      <Route path="/dashboard" component={HomeownerDashboard} />
      <Route path="/post-job" component={PostJob} />
      <Route path="/jobs/:id" component={JobDetails} />
      <Route path="/jobs/:id/edit" component={EditJob} />
      <Route path="/messages" component={MessagesPage} />
      <Route path="/support" component={SupportPage} />
      <Route path="/support/:id" component={SupportTicketPage} />

      <Route path="/handyman/dashboard" component={HandymanDashboard} />
      <Route path="/handyman/browse" component={BrowseJobs} />
      <Route path="/handyman/jobs/:id" component={HandymanJobDetails} />
      <Route path="/handyman/bids" component={MyBids} />
      <Route path="/handyman/profile" component={HandymanProfile} />
      <Route path="/handyman/earnings" component={HandymanEarnings} />
      <Route path="/handyman/messages" component={MessagesPage} />

      <Route path="/profile/:userId" component={PublicProfile} />
      <Route path="/admin" component={AdminPanel} />
      <Route path="/admin/support" component={AdminSupportPage} />

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <MetaPixelPageViewTracker />
          <GoogleAnalyticsPageViewTracker />
          <Router />
          <AddToHomeScreen />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
