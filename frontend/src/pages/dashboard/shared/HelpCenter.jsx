import React from 'react';
import { getStoredSession } from '../../../services/transportApi';

const helpContent = {
  sacco_admin: {
    title: "SACCO Admin Operations",
    steps: [
      { title: "Manage Drivers", desc: "Approve or reject new driver registrations from the 'Registered Drivers' tab." },
      { title: "Configure Fares", desc: "Set normal and peak prices for each route to ensure transparent pricing for passengers." },
      { title: "Queue Control", desc: "Assign queue numbers to drivers at terminals to maintain an orderly dispatch sequence." },
      { title: "Complaint Redress", desc: "Review and resolve formal complaints submitted by passengers regarding your SACCO's services." }
    ]
  },
  school_admin: {
    title: "School Transport Management",
    steps: [
      { title: "Student Onboarding", desc: "Register students and assign them to specific routes and verified drivers." },
      { title: "Safety Monitoring", desc: "Track real-time pickup and drop-off status for every student on the dashboard." },
      { title: "Fee Tracking", desc: "Monitor transport payment status for all registered students to ensure accountability." }
    ]
  },
  sacco_driver: {
    title: "SACCO Driver Dashboard",
    steps: [
      { title: "Queue Position", desc: "Check your live queue number and wait for the system to alert you when it's your turn." },
      { title: "Trip Notifications", desc: "Mark your arrival at major stages to keep the system and passengers updated." },
      { title: "Earnings Tracking", desc: "Review your daily and monthly passenger counts and earnings in the Activity Report." }
    ]
  },
  school_driver: {
    title: "School Driver Trip Guide",
    steps: [
      { title: "Student List", desc: "Access your assigned student manifest for every pickup and drop-off trip." },
      { title: "Status Marking", desc: "Click 'Mark Picked Up' or 'Mark Dropped Off' as each student boards or exits the vehicle." },
      { title: "Safety Alerts", desc: "Use the alert system to notify the School Admin of any delays or route incidents." }
    ]
  },
  parent: {
    title: "Parent Monitoring Portal",
    steps: [
      { title: "Child Registration", desc: "Add your children to the system and choose their respective school transport zones." },
      { title: "Real-time Tracking", desc: "View the exact time your child was picked up or dropped off by the school bus." },
      { title: "Easy Payments", desc: "Initiate M-Pesa STK Push payments for transport fees directly from the dashboard." }
    ]
  },
  passenger: {
    title: "Passenger Booking Guide",
    steps: [
      { title: "Search Trips", desc: "Filter inter-city trips by destination, company, and departure time." },
      { title: "Seat Selection", desc: "Use the interactive map to pick your favorite seat before checking out." },
      { title: "Instant Ticketing", desc: "Pay via M-Pesa and receive your digital ticket immediately in your 'Tickets' tab." }
    ]
  }
};

const HelpCenter = () => {
  const { user } = getStoredSession();
  const role = user?.role || 'passenger';
  const content = helpContent[role] || helpContent.passenger;

  return (
    <div className="help-container">
      <div className="section-intro">
        <p className="stage-eyebrow">Interactive Support</p>
        <h2>{content.title}</h2>
        <p>Follow these steps to master the {user?.role_label || 'Strategic Transport'} system tools.</p>
      </div>

      <div className="operations-split" style={{ marginTop: '2rem' }}>
        <div className="operations-panel">
          <div className="ops-list">
            {content.steps.map((step, index) => (
              <div className="ops-item" key={index}>
                <strong>{index + 1}. {step.title}</strong>
                <span>{step.desc}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="operations-panel accent">
          <div className="card" style={{ background: 'rgba(255,255,255,0.05)', border: '1px dashed var(--color-brand)' }}>
            <h3>Need more help?</h3>
            <p>Our transport desk is available 24/7 to resolve technical issues or coordinate route disputes.</p>
            <div style={{ marginTop: '1.5rem' }}>
              <p><strong>System Integrity:</strong> Verified by Egerton CS Dept</p>
              <p><strong>Support Email:</strong> support@sts-transport.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
