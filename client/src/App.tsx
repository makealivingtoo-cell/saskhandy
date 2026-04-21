import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Pages
import Home from "./pages/Home";
import AboutPage from "./pages/AboutPage";
import BlogPage from "./pages/BlogPage";
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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={AboutPage} />
      <Route path="/blog" component={BlogPage} />

      <Route path="/saskatchewan-handyman-services" component={SaskatchewanHandymanServicesPage} />
      <Route path="/saskatoon-handyman-services" component={SaskatoonHandymanServicesPage} />
      <Route path="/regina-handyman-services" component={ReginaHandymanServicesPage} />

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
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;