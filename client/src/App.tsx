import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Pages
import Home from "./pages/Home";
import RoleSelect from "./pages/RoleSelect";
import HandymanOnboarding from "./pages/HandymanOnboarding";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";

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
      <Route path="/sign-in" component={SignIn} />
      <Route path="/sign-up" component={SignUp} />
      <Route path="/role-select" component={RoleSelect} />
      <Route path="/onboarding" component={HandymanOnboarding} />

      <Route path="/dashboard" component={HomeownerDashboard} />
      <Route path="/post-job" component={PostJob} />
      <Route path="/jobs/:id" component={JobDetails} />
      <Route path="/jobs/:id/edit" component={EditJob} />
      <Route path="/messages" component={MessagesPage} />

      <Route path="/handyman/dashboard" component={HandymanDashboard} />
      <Route path="/handyman/browse" component={BrowseJobs} />
      <Route path="/handyman/jobs/:id" component={HandymanJobDetails} />
      <Route path="/handyman/bids" component={MyBids} />
      <Route path="/handyman/profile" component={HandymanProfile} />
      <Route path="/handyman/earnings" component={HandymanEarnings} />
      <Route path="/handyman/messages" component={MessagesPage} />

      <Route path="/profile/:userId" component={PublicProfile} />
      <Route path="/admin" component={AdminPanel} />

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