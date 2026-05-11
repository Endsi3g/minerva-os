import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './Landing';
import SignUp from './SignUp';
import Login from './Login';
import Platform from './Platform';
import Modules from './Modules';
import ClientPortal from './ClientPortal';
import Security from './Security';
import Insights from './Insights';
import AppShell from './components/layout/AppShell';
import Dashboard from './pages/app/Dashboard';
import Pipeline from './pages/app/Pipeline';
import Clients from './pages/app/Clients';
import Projects from './pages/app/Projects';
import Tasks from './pages/app/Tasks';
import Approvals from './pages/app/Approvals';
import Files from './pages/app/Files';
import Billing from './pages/app/Billing';
import Reports from './pages/app/Reports';
import AppSettings from './pages/app/AppSettings';

export default function App() {
  return (
    <Routes>
      {/* Marketing */}
      <Route path="/"         element={<Landing />} />
      <Route path="/signup"   element={<SignUp />} />
      <Route path="/login"    element={<Login />} />
      <Route path="/platform" element={<Platform />} />
      <Route path="/modules"  element={<Modules />} />
      <Route path="/portal"   element={<ClientPortal />} />
      <Route path="/security" element={<Security />} />
      <Route path="/insights" element={<Insights />} />

      {/* App shell */}
      <Route path="/app" element={<AppShell />}>
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="pipeline"  element={<Pipeline />} />
        <Route path="clients"   element={<Clients />} />
        <Route path="projects"  element={<Projects />} />
        <Route path="tasks"     element={<Tasks />} />
        <Route path="approvals" element={<Approvals />} />
        <Route path="files"     element={<Files />} />
        <Route path="billing"   element={<Billing />} />
        <Route path="reports"   element={<Reports />} />
        <Route path="settings"  element={<AppSettings />} />
      </Route>
    </Routes>
  );
}
