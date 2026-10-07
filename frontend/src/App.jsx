import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import AuthLayout from './layouts/AuthLayout';
import ProtectedLayout from './layouts/ProtectedLayout';

import {
  Home, TrafficUpdates, SaccosList, SchoolsList,
  TermsConditions, PrivacyPolicy, HelpCenter, BookingServices, PassengerComplaints
} from './pages/public/PublicPages';

import {
  ApproveDrivers, RoutesTerminals, ManageFares, QueueManagement, ComplaintsAdmin, SchoolAssignments, RevenueReport
} from './pages/dashboard/saccoAdmin/AdminFeatures';

import {
  ArrivalAlert, DriverFares, PassengerDropOffs, StudentTransportDriver
} from './pages/dashboard/saccoDriver/DriverFeatures';

import { Profile, Statistics } from './pages/dashboard/shared/ProfileStats';
import ActivityReport from './pages/dashboard/shared/ActivityReport';
import DashboardHelp from './pages/dashboard/shared/HelpCenter';

import {
  ApproveDrivers as SchoolAdminApproveDrivers,
  AdminNotifications,
  ManageTrips,
  PaymentsReview,
  SaccoComm,
  SchoolComplaints,
  PaymentsReport
} from './pages/dashboard/schoolAdmin/SchoolAdminFeatures';

import {
  DriverTrips as SchoolDriverTrips,
  DriverAlerts as SchoolDriverAlerts
} from './pages/dashboard/schoolDriver/SchoolDriverFeatures';

import {
  RegisterChild, TripsAndRoutes, MpesaPayments, ParentNotifications
} from './pages/dashboard/parent/ParentFeatures';

// Booking Admin Pages
import {
  ApproveBookingDrivers, UploadRoutes, BusAvailability, PassengerList, BookingComplaints, ManifestReport
} from './pages/dashboard/bookingAdmin/BookingAdminFeatures';

// Booking Driver Pages
import {
  AssignedBookingTrips, DriverArrivalAlert
} from './pages/dashboard/bookingDriver/BookingDriverFeatures';

// Passenger Pages
import {
  PassengerBooking, MyTickets
} from './pages/dashboard/passenger/PassengerFeatures';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Dashboard Page (Placeholder for protected sections)
import DashboardHome from './pages/dashboard/DashboardHome';

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Public Routes with left dashboard */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="traffic-updates" element={<TrafficUpdates />} />
          <Route path="saccos" element={<SaccosList />} />
          <Route path="schools" element={<SchoolsList />} />
          <Route path="terms" element={<TermsConditions />} />
          <Route path="privacy" element={<PrivacyPolicy />} />
          <Route path="help" element={<HelpCenter />} />
          <Route path="booking" element={<BookingServices />} />
          <Route path="complaints" element={<PassengerComplaints />} />
        </Route>

        {/* Auth Routes */}
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
        </Route>

        {/* Protected Dashboard Routes */}
        <Route path="/dashboard" element={<ProtectedLayout />}>
          <Route index element={<DashboardHome />} />
          
          {/* Shared Protected Routes */}
          <Route path="profile" element={<Profile />} />
          <Route path="statistics" element={<Statistics />} />

          {/* Sacco Admin Routes */}
          <Route path="admin/approve-drivers" element={<ApproveDrivers />} />
          <Route path="admin/routes-terminals" element={<RoutesTerminals />} />
          <Route path="admin/fares" element={<ManageFares />} />
          <Route path="admin/queues" element={<QueueManagement />} />
          <Route path="admin/schools" element={<SchoolAssignments />} />
          <Route path="admin/complaints" element={<ComplaintsAdmin />} />
          <Route path="admin/reports" element={<ActivityReport type="admin" />} />
          <Route path="help" element={<DashboardHelp />} />

          {/* Sacco Driver Routes */}
          <Route path="driver/arrival" element={<ArrivalAlert />} />
          <Route path="driver/fares" element={<DriverFares />} />
          <Route path="driver/dropoffs" element={<PassengerDropOffs />} />
          <Route path="driver/students" element={<StudentTransportDriver />} />
          <Route path="driver/reports" element={<ActivityReport type="driver" />} />

          {/* School Admin Routes */}
          <Route path="school-admin/approve" element={<SchoolAdminApproveDrivers />} />
          <Route path="school-admin/trips" element={<ManageTrips />} />
          <Route path="school-admin/payments" element={<PaymentsReview />} />
          <Route path="school-admin/sacco" element={<SaccoComm />} />
          <Route path="school-admin/alerts" element={<AdminNotifications />} />
          <Route path="school-admin/complaints" element={<SchoolComplaints />} />
          <Route path="school-admin/reports" element={<ActivityReport type="admin" />} />

          {/* School Driver Routes */}
          <Route path="school-driver/trips" element={<SchoolDriverTrips />} />
          <Route path="school-driver/alerts" element={<SchoolDriverAlerts />} />
          <Route path="school-driver/reports" element={<ActivityReport type="driver" />} />

          {/* Parent Routes */}
          <Route path="parent/register" element={<RegisterChild />} />
          <Route path="parent/trips" element={<TripsAndRoutes />} />
          <Route path="parent/payments" element={<MpesaPayments />} />
          <Route path="parent/notifications" element={<ParentNotifications />} />
          <Route path="parent/reports" element={<ActivityReport type="user" />} />

          {/* Booking Admin Routes */}
          <Route path="booking-admin/drivers" element={<ApproveBookingDrivers />} />
          <Route path="booking-admin/routes" element={<UploadRoutes />} />
          <Route path="booking-admin/buses" element={<BusAvailability />} />
          <Route path="booking-admin/passengers" element={<PassengerList />} />
          <Route path="booking-admin/complaints" element={<BookingComplaints />} />
          <Route path="booking-admin/reports" element={<ActivityReport type="admin" />} />

          {/* Booking Driver Routes */}
          <Route path="booking-driver/trips" element={<AssignedBookingTrips />} />
          <Route path="booking-driver/arrival" element={<DriverArrivalAlert />} />
          <Route path="booking-driver/reports" element={<ActivityReport type="driver" />} />

          {/* Passenger Routes */}
          <Route path="passenger/book" element={<PassengerBooking />} />
          <Route path="passenger/tickets" element={<MyTickets />} />
          <Route path="passenger/reports" element={<ActivityReport type="user" />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
