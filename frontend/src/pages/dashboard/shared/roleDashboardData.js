export const roleDashboardData = {
  sacco_admin: {
    portalName: 'SACCO Admin',
    summary: 'Oversee SACCO routes, approve drivers, coordinate queues, and manage public transport operations.',
    stats: [
      { label: 'Pending Driver Approvals', key: 'pending_driver_approvals', tone: 'amber' },
      { label: 'Routes Registered', key: 'active_routes', tone: 'teal' },
      { label: 'Drivers Waiting in Queue', key: 'queue_waiting', tone: 'green' },
      { label: 'Open Complaints', key: 'open_complaints', tone: 'danger' },
    ],
    highlights: [
      'Approve new drivers and confirm the SACCO they belong to.',
      'Set route fares and coordinate queue management.',
      'Assign transport support to schools where needed.',
    ],
  },
  sacco_driver: {
    portalName: 'SACCO Driver',
    summary: 'Track fares, announce arrivals, manage passenger drop-offs, and support student transport duties.',
    stats: [
      { label: 'Fare Prompts', key: 'fare_prompts', tone: 'teal' },
      { label: 'Uncleared Fare Records', key: 'pending_dropoffs', tone: 'green' },
      { label: 'Queue Entries', key: 'queue_alerts', tone: 'amber' },
      { label: 'School Assignments', key: 'school_assignments', tone: 'danger' },
    ],
    highlights: [
      'View fares set for your assigned routes.',
      'Alert the SACCO admin on arrival at the stage.',
      'Track passenger and student drop-off progress.',
    ],
  },
  school_admin: {
    portalName: 'School Admin',
    summary: 'Monitor school transport, approve drivers, organize student trips, and communicate with SACCO operators.',
    stats: [
      { label: 'Drivers Awaiting Approval', key: 'pending_drivers', tone: 'teal' },
      { label: 'Published Trips', key: 'published_trips', tone: 'green' },
      { label: 'Payments Awaiting Review', key: 'pending_payments', tone: 'amber' },
      { label: 'Open Transport Alerts', key: 'open_alerts', tone: 'danger' },
    ],
    highlights: [
      'Approve or reject school driver requests.',
      'Assign students to trips and track route readiness.',
      'Coordinate with SACCOs for transport support.',
    ],
  },
  school_driver: {
    portalName: 'School Driver',
    summary: 'Handle assigned school trips, follow admin instructions, and support student pickup and drop-off visibility.',
    stats: [
      { label: 'Assigned Trips', key: 'assigned_trips', tone: 'teal' },
      { label: 'Assigned Students', key: 'assigned_students', tone: 'green' },
      { label: 'Alerts Sent to Admin', key: 'alerts_sent', tone: 'amber' },
    ],
    highlights: [
      'Review assigned school trips and route plans.',
      'Follow admin instructions and alert requirements.',
      'Keep track of student transport stages for the day.',
    ],
  },
  parent: {
    portalName: 'Parent Portal',
    summary: 'Follow your child’s school transport, review routes, receive notifications, and track payments.',
    stats: [
      { label: 'Student Profile', key: 'student_profile', tone: 'teal' },
      { label: 'Available School Trips', key: 'available_trips', tone: 'green' },
      { label: 'Payments Awaiting Review', key: 'pending_payments', tone: 'amber' },
      { label: 'Trip Assignments', key: 'assignments', tone: 'danger' },
    ],
    highlights: [
      'Register children and attach their school details.',
      'View organized trips and route assignments.',
      'Receive transport notifications from drivers and schools.',
    ],
  },
  booking_admin: {
    portalName: 'Booking Admin',
    summary: 'Manage booking companies, route fares, buses, drivers, and passenger operations.',
    stats: [
      { label: 'Companies in Booking Catalog', key: 'companies', tone: 'teal' },
      { label: 'Routes in Booking Catalog', key: 'routes', tone: 'green' },
      { label: 'Trips in Booking Catalog', key: 'trips', tone: 'amber' },
      { label: 'Open Booking Complaints', key: 'open_complaints', tone: 'danger' },
    ],
    highlights: [
      'Approve booking drivers and review bus assignments.',
      'Upload routes, fares, and availability.',
      'Monitor complaints and company passenger flow.',
    ],
  },
  booking_driver: {
    portalName: 'Booking Driver',
    summary: 'See assigned trips, passenger manifests, and notify booking admins when you arrive for reassignment.',
    stats: [
      { label: 'Assigned Trips', key: 'assigned_trips', tone: 'teal' },
      { label: 'Passengers Listed', key: 'passengers', tone: 'green' },
      { label: 'Routes Assigned', key: 'route_assignments', tone: 'amber' },
    ],
    highlights: [
      'Check all trips assigned to you.',
      'Review passenger lists and route timing.',
      'Notify booking admin on arrival at the departure point.',
    ],
  },
  passenger: {
    portalName: 'Passenger Portal',
    summary: 'Browse booking companies, compare routes and fares, choose seats, and manage ticket activity.',
    stats: [
      { label: 'Companies Available', key: 'companies', tone: 'teal' },
      { label: 'Routes Available', key: 'routes', tone: 'green' },
      { label: 'Trips Available', key: 'trips', tone: 'amber' },
      { label: 'Bookings Stored for Account', key: 'stored_bookings', tone: 'danger' },
    ],
    highlights: [
      'Explore registered booking companies and fares.',
      'Choose trip times and free seats.',
      'Complete payments and manage ticket history.',
    ],
  },
};

export function getRoleDashboard(role) {
  return roleDashboardData[role] || {
    portalName: 'Transport Portal',
    summary: 'Manage your role-specific transport operations from one place.',
    stats: [],
    highlights: [],
  };
}
