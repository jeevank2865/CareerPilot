import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ApplicationProvider, useApplications } from './context/ApplicationContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { ApplicationsView } from './components/ApplicationsView';
import { ApplicationDetailView } from './components/ApplicationDetailView';
import { AddEditApplicationModal } from './components/AddEditApplicationModal';
import { ProfileSettingsView } from './components/ProfileSettingsView';
import { FollowUpsView } from './components/FollowUpsView';
import { SupabaseSetupModal } from './components/SupabaseSetupModal';
import { AuthView } from './components/AuthView';
import { ToastContainer } from './components/ToastContainer';
import { Application } from './types/database';
import { Loader2 } from 'lucide-react';
import { initCapacitor, registerBackButtonListener } from './lib/capacitor';

const MainLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const { selectedApplication, setSelectedApplication, showToast } = useApplications();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<Application | null>(null);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Initialize Capacitor native plugins (Status Bar, Splash Screen, Network, Deep links)
  useEffect(() => {
    initCapacitor(
      (connected) => {
        if (!connected) {
          showToast('No internet connection. Please check your connection and try again.', 'error');
        } else {
          showToast('Internet connection restored.', 'info');
        }
      },
      (url) => {
        console.log('App opened with deep link URL:', url);
        if (url.includes('access_token') || url.includes('type=recovery')) {
          showToast('Authentication session link detected.', 'info');
        }
      }
    );
  }, [showToast]);

  // Handle Android Native Back Button
  useEffect(() => {
    const removeListener = registerBackButtonListener(() => {
      // 1. Close Add/Edit modal if open
      if (isAddEditModalOpen) {
        setIsAddEditModalOpen(false);
        setEditingApplication(null);
        return true;
      }
      // 2. Close Supabase setup modal if open
      if (isSupabaseModalOpen) {
        setIsSupabaseModalOpen(false);
        return true;
      }
      // 3. Close mobile menu drawer if open
      if (mobileMenuOpen) {
        setMobileMenuOpen(false);
        return true;
      }
      // 4. Return from Application Detail View to list
      if (selectedApplication) {
        setSelectedApplication(null);
        return true;
      }
      // 5. Navigate to Dashboard if on another tab
      if (currentTab !== 'dashboard') {
        setCurrentTab('dashboard');
        return true;
      }
      // 6. On root dashboard: exit application
      return false;
    });

    return () => {
      removeListener();
    };
  }, [
    isAddEditModalOpen,
    isSupabaseModalOpen,
    mobileMenuOpen,
    selectedApplication,
    currentTab,
    setSelectedApplication,
  ]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        <p className="text-sm font-semibold text-slate-300">Loading Job & Internship Tracker...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <AuthView onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)} />
        <SupabaseSetupModal
          isOpen={isSupabaseModalOpen}
          onClose={() => setIsSupabaseModalOpen(false)}
        />
        <ToastContainer />
      </>
    );
  }

  const handleAddNew = () => {
    setEditingApplication(null);
    setIsAddEditModalOpen(true);
  };

  const handleEdit = (app: Application) => {
    setEditingApplication(app);
    setIsAddEditModalOpen(true);
  };

  const handleReplaceResume = (app: Application) => {
    setEditingApplication(app);
    setIsAddEditModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50/70 flex text-slate-800">
      {/* Desktop Sidebar (Section 20 & 21) */}
      <Sidebar
        currentTab={currentTab}
        onNavigate={(tab) => {
          setCurrentTab(tab);
          setSelectedApplication(null);
        }}
        onAddNew={handleAddNew}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          currentTab={currentTab}
          onNavigate={(tab) => {
            setCurrentTab(tab);
            setSelectedApplication(null);
          }}
          onAddNew={handleAddNew}
          onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {selectedApplication ? (
            <ApplicationDetailView
              application={selectedApplication}
              onBack={() => setSelectedApplication(null)}
              onEdit={handleEdit}
              onReplaceResume={handleReplaceResume}
            />
          ) : currentTab === 'dashboard' ? (
            <DashboardView
              onNavigateToApplications={() => setCurrentTab('applications')}
              onSelectApplication={(app) => setSelectedApplication(app)}
              onAddNew={handleAddNew}
              onNavigateToFollowUps={() => setCurrentTab('followups')}
            />
          ) : currentTab === 'applications' ? (
            <ApplicationsView
              onSelectApplication={(app) => setSelectedApplication(app)}
              onEditApplication={handleEdit}
              onAddNew={handleAddNew}
            />
          ) : currentTab === 'followups' ? (
            <FollowUpsView
              onSelectApplication={(app) => setSelectedApplication(app)}
              onEditApplication={handleEdit}
            />
          ) : currentTab === 'profile' ? (
            <ProfileSettingsView />
          ) : null}
        </main>
      </div>

      {/* Modals & Popups */}
      <AddEditApplicationModal
        isOpen={isAddEditModalOpen}
        onClose={() => {
          setIsAddEditModalOpen(false);
          setEditingApplication(null);
        }}
        applicationToEdit={editingApplication}
      />

      <SupabaseSetupModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />

      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ApplicationProvider>
        <MainLayout />
      </ApplicationProvider>
    </AuthProvider>
  );
}
