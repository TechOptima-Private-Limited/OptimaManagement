import React from 'react';

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { QueryClient, QueryClientProvider } from 'react-query';

import { ToastContainer } from 'react-toastify';

import 'react-toastify/dist/ReactToastify.css';



// Auth Components

import Login from './components/auth/Login';

import Register from './components/auth/Register';

import ForceChangePassword from './components/auth/ForceChangePassword';



// Main App Components

import EmployeeList from './components/employees/EmployeeList';

import EmployeeDetail from './components/employees/EmployeeDetail';

import AttendanceTracker from './components/attendance/AttendanceTracker';

import BiometricIntegration from './components/attendance/BiometricIntegration';

import Dashboard from './components/dashboard/Dashboard';

import MyTeam from './components/team/MyTeam';

import Layout from './components/layout/Layout';

import UserProfile from './components/profile/UserProfile';

import UsersAuthManagement from './components/admin/UsersAuthManagement';

import UsersAuthHome from './components/admin/UsersAuthHome';

import UsersAuthAddUser from './components/admin/UsersAuthAddUser';

import GroupsManagement from './components/admin/GroupsManagement';

import GroupForm from './components/admin/GroupForm';

import PermissionsManagement from './components/admin/PermissionsManagement';

import PermissionDetail from './components/admin/PermissionDetail';

import Settings from './components/settings/Settings';



// Leave Management Components

import LeaveManagement from './components/leave/LeaveManagement';



// Onboarding Components (Admin/HR)

import OnboardingManagement from './components/onboarding/OnboardingManagement';

import OffboardingManagement from './components/onboarding/OffboardingManagement';

import AssetManagement from './components/onboarding/AssetManagement';



// Public Onboarding Components (Employee Self-Service)

import EmployeeOnboardingRouter from './components/onboarding/EmployeeOnboardingRouter';

import OnboardingSuccessPage from './components/onboarding/OnboardingSuccessPage';

import OnboardingLinkGenerator from './components/onboarding/OnboardingLinkGenerator';



// Support 24/7 Components

import ResourceManagement from './components/resourcemanagement/ResourceManagement';

import HolidayManagement from './components/admin/HolidayManagement';

import MyAssets from './components/assets/MyAssets';
import CompanyDocuments from './components/documents/CompanyDocuments';

import { AuthProvider } from './context/AuthContext';

import { ThemeProvider } from './context/ThemeContext';



// Utils

import { isAuthenticated } from './utils/auth';

import WorkFromHomeRequests from './components/attendance/WorkFromHomeRequests';



// Protected Route component for authenticated users

const ProtectedRoute = ({ children }) => {

  return isAuthenticated() ? <Layout>{children}</Layout> : <Navigate to="/login" />;

};



// Public Route component for employee onboarding (no authentication required)

const PublicRoute = ({ children }) => {

  return <div>{children}</div>;

};



// Create a client

const queryClient = new QueryClient({

  defaultOptions: {

    queries: {

      retry: 1,

      refetchOnWindowFocus: false,

      staleTime: 5 * 60 * 1000, // 5 minutes

    },

  },

});



function App() {

  return (

    <ThemeProvider>

      <AuthProvider>

        <QueryClientProvider client={queryClient}>

          <Router>

            <div className="App">

              <Routes>

                {/* Public Routes */}

                <Route path="/login" element={<Login />} />

                <Route path="/register" element={<Register />} />

                <Route path="/force-change-password" element={<ForceChangePassword />} />



                {/* Public Employee Onboarding Routes (No Authentication Required) */}

                <Route

                  path="/onboarding/form"

                  element={

                    <PublicRoute>

                      <EmployeeOnboardingRouter />

                    </PublicRoute>

                  }

                />

                <Route

                  path="/onboarding/form/:encodedData"

                  element={

                    <PublicRoute>

                      <EmployeeOnboardingRouter />

                    </PublicRoute>

                  }

                />

                <Route

                  path="/onboarding/success"

                  element={

                    <PublicRoute>

                      <OnboardingSuccessPage />

                    </PublicRoute>

                  }

                />



                {/* Protected Routes (Authentication Required) */}



                {/* Dashboard */}

                <Route

                  path="/dashboard"

                  element={

                    <ProtectedRoute>

                      <Dashboard />

                    </ProtectedRoute>

                  }

                />



                {/* Groups management */}

                <Route
                  path="/users-auth/groups"

                  element={

                    <ProtectedRoute>

                      <GroupsManagement />

                    </ProtectedRoute>

                  }

                />

                <Route

                  path="/users-auth/groups/add"

                  element={

                    <ProtectedRoute>

                      <GroupForm />

                    </ProtectedRoute>

                  }

                />

                <Route

                  path="/users-auth/groups/:id"

                  element={

                    <ProtectedRoute>

                      <GroupForm />

                    </ProtectedRoute>

                  }

                />



                {/* Permissions management */}

                <Route

                  path="/users-auth/permissions"

                  element={

                    <ProtectedRoute>

                      <PermissionsManagement />

                    </ProtectedRoute>

                  }

                />

                <Route

                  path="/users-auth/permissions/:id"

                  element={

                    <ProtectedRoute>

                      <PermissionDetail />

                    </ProtectedRoute>

                  }

                />



                {/* Users and Authentication - Home menu */}

                <Route

                  path="/users-auth"

                  element={

                    <ProtectedRoute>

                      <UsersAuthHome />

                    </ProtectedRoute>

                  }

                />



                {/* Users and Authentication - Users detail page */}

                <Route

                  path="/users-auth/users"

                  element={

                    <ProtectedRoute>

                      <UsersAuthManagement />

                    </ProtectedRoute>

                  }

                />



                {/* Add User (Users and Authentication) */}

                <Route

                  path="/users-auth/add"

                  element={

                    <ProtectedRoute>

                      <UsersAuthAddUser />

                    </ProtectedRoute>

                  }

                />



                {/* User Profile */}

                <Route

                  path="/profile"

                  element={

                    <ProtectedRoute>

                      <UserProfile />

                    </ProtectedRoute>

                  }

                />

                {/* Settings */}

                <Route

                  path="/settings"

                  element={

                    <ProtectedRoute>

                      <Settings />

                    </ProtectedRoute>

                  }

                />

                {/* My Team */}

                <Route

                  path="/my-team"

                  element={

                    <ProtectedRoute>

                      <MyTeam />

                    </ProtectedRoute>

                  }

                />



                {/* Employee Management */}

                <Route

                  path="/employees"

                  element={

                    <ProtectedRoute>

                      <EmployeeList />

                    </ProtectedRoute>

                  }

                />

                <Route

                  path="/employees/:id"

                  element={

                    <ProtectedRoute>

                      <EmployeeDetail />

                    </ProtectedRoute>

                  }

                />



                {/* HR Onboarding Management (Protected) */}

                <Route

                  path="/onboarding/employees"

                  element={

                    <ProtectedRoute>

                      <OnboardingManagement />

                    </ProtectedRoute>

                  }

                />

                <Route

                  path="/onboarding/link-generator"

                  element={

                    <ProtectedRoute>

                      <OnboardingLinkGenerator />

                    </ProtectedRoute>

                  }

                />

                <Route

                  path="/onboarding/assets"

                  element={

                    <ProtectedRoute>

                      <AssetManagement />

                    </ProtectedRoute>

                  }

                />

                <Route

                  path="/assets/repairs"

                  element={

                    <ProtectedRoute>

                      <AssetManagement />

                    </ProtectedRoute>

                  }

                />

                <Route

                  path="/assets/repairs/:id"

                  element={

                    <ProtectedRoute>

                      <AssetManagement />

                    </ProtectedRoute>

                  }

                />

                <Route

                  path="/onboarding/offboarding"

                  element={

                    <ProtectedRoute>

                      <OffboardingManagement />

                    </ProtectedRoute>

                  }

                />



                {/* Work From Home */}

                <Route

                  path="/work-from-home"

                  element={

                    <ProtectedRoute>

                      <WorkFromHomeRequests />

                    </ProtectedRoute>

                  }

                />



                {/* Attendance Management */}

                <Route

                  path="/attendance"

                  element={

                    <ProtectedRoute>

                      <AttendanceTracker />

                    </ProtectedRoute>

                  }

                />

                <Route

                  path="/attendance/biometric"

                  element={

                    <ProtectedRoute>

                      <BiometricIntegration />

                    </ProtectedRoute>

                  }

                />



                <Route
                  path="/leave/*"

                  element={

                    <ProtectedRoute>

                      <LeaveManagement />

                    </ProtectedRoute>

                  }

                />



                {/* Support 24/7 */}

                <Route

                  path="/resource-management/*"

                  element={

                    <ProtectedRoute>

                      <ResourceManagement />

                    </ProtectedRoute>

                  }

                />

                {/* My Assets */}

                <Route

                  path="/my-assets"

                  element={

                    <ProtectedRoute>

                      <MyAssets />

                    </ProtectedRoute>

                  }

                />

                <Route
                  path="/documents"
                  element={
                    <ProtectedRoute>
                      <CompanyDocuments />
                    </ProtectedRoute>
                  }
                />



                {/* Holiday Management */}

                <Route

                  path="/holidays"

                  element={

                    <ProtectedRoute>

                      <HolidayManagement />

                    </ProtectedRoute>

                  }

                />



                {/* Backward compatibility routes */}

                <Route

                  path="/leave/approval"

                  element={<Navigate to="/leave" replace />}

                />

                <Route

                  path="/leave/balance"

                  element={<Navigate to="/leave" replace />}

                />



                {/* Default Routes */}

                <Route path="/" element={<Navigate to="/dashboard" />} />



                {/* Catch all route */}

                <Route path="*" element={<Navigate to="/dashboard" />} />

              </Routes>



              {/* Toast notifications */}

              <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
              />

            </div>

          </Router>

        </QueryClientProvider>

      </AuthProvider>

    </ThemeProvider>

  );

}



export default App;