export const roleDashboardData = {
  sacco_admin: {
    portalName: 'SACCO Admin',
    summary: 'Oversee SACCO routes, approve drivers, coordinate queues, and manage public transport operations.',
    stats: [
      { label: 'Pending Driver Approvals', value: '12', tone: 'amber' },
      { label: 'Active Routes', value: '18', tone: 'teal' },
      { label: 'Fare Reviews', value: '6', tone: 'green' },
      { label: 'Open Complaints', value: '4', tone: 'danger' },
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
      { label: 'Trips Today', value: '9', tone: 'teal' },
      { label: 'Collected Fares', value: 'KES 12,600', tone: 'green' },
      { label: 'Arrival Alerts', value: '3', tone: 'amber' },
      { label: 'Drop-off Points', value: '21', tone: 'danger' },
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
      { label: 'Assigned Drivers', value: '8', tone: 'teal' },
      { label: 'Active Student Trips', value: '14', tone: 'green' },
      { label: 'Pending Payments', value: 'KES 36,000', tone: 'amber' },
      { label: 'Driver Alerts', value: '5', tone: 'danger' },
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
      { label: 'Assigned Trips', value: '7', tone: 'teal' },
      { label: 'Students Onboard', value: '143', tone: 'green' },
      { label: 'Admin Alerts', value: '2', tone: 'amber' },
      { label: 'Route Stops', value: '16', tone: 'danger' },
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
      { label: 'Registered Children', value: '2', tone: 'teal' },
      { label: 'Trips This Week', value: '10', tone: 'green' },
      { label: 'Pending Payments', value: 'KES 4,800', tone: 'amber' },
      { label: 'Unread Notices', value: '3', tone: 'danger' },
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
      { label: 'Booking Drivers', value: '11', tone: 'teal' },
      { label: 'Published Routes', value: '23', tone: 'green' },
      { label: 'Buses Available', value: '15', tone: 'amber' },
      { label: 'Passenger Issues', value: '6', tone: 'danger' },
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
      { label: 'Assigned Trips', value: '5', tone: 'teal' },
      { label: 'Passengers Listed', value: '117', tone: 'green' },
      { label: 'Arrival Notices', value: '2', tone: 'amber' },
      { label: 'Open Seats', value: '14', tone: 'danger' },
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
      { label: 'Saved Companies', value: '4', tone: 'teal' },
      { label: 'Upcoming Trips', value: '3', tone: 'green' },
      { label: 'Pending Payments', value: '1', tone: 'amber' },
      { label: 'Tickets Booked', value: '9', tone: 'danger' },
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
