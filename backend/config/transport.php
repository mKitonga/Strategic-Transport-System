<?php

return [
    'homepage_links' => [
        'Traffic updates',
        'All registered SACCOs and their routes',
        'All registered schools and their locations',
        'Terms and conditions',
        'Privacy policy',
        'Help',
        'Registration and login',
        'Booking sector',
        'All booking services',
    ],
    'common_registration_fields' => [
        'Full name',
        'Phone number',
        'Email address',
        'Password',
        'Password confirmation',
        'Role',
    ],
    'concepts' => [
        'One school can be in many locations.',
        'A SACCO can operate across many stations and routes.',
    ],
    'deferred_note' => 'Booking sector authentication will be handled later.',
    'roles' => [
        'sacco_admin' => [
            'label' => 'SACCO Admin',
            'default_status' => 'active',
            'dashboard_path' => '/dashboard/admin/approve-drivers',
            'registration_fields' => [
                'route_name' => 'Route name',
                'sacco_name' => 'SACCO name',
                'location' => 'Location/Station',
            ],
        ],
        'sacco_driver' => [
            'label' => 'SACCO Driver',
            'default_status' => 'pending_approval',
            'dashboard_path' => '/dashboard/driver/arrival',
            'registration_fields' => [
                'sacco_name' => 'SACCO name',
                'number_plate' => 'Number plate',
                'matatu_name' => 'Matatu name',
            ],
        ],
        'school_admin' => [
            'label' => 'School Admin',
            'default_status' => 'active',
            'dashboard_path' => '/dashboard/school-admin/approve',
            'registration_fields' => [
                'school_name' => 'School name',
                'location' => 'Location',
            ],
        ],
        'school_driver' => [
            'label' => 'School Driver',
            'default_status' => 'pending_approval',
            'dashboard_path' => '/dashboard/school-driver/trips',
            'registration_fields' => [
                'school_name' => 'School name',
                'location' => 'Location',
            ],
        ],
        'parent' => [
            'label' => 'Parent',
            'default_status' => 'active',
            'dashboard_path' => '/dashboard/parent/register',
            'registration_fields' => [
                'student_name' => 'Student name',
                'grade' => 'Grade',
                'school_name' => 'School name',
                'location' => 'Location',
                'admission_number' => 'Admission number',
            ],
        ],
        'booking_admin' => [
            'label' => 'Booking Admin',
            'default_status' => 'active',
            'dashboard_path' => '/dashboard/booking-admin/drivers',
            'registration_fields' => [
                'company_name' => 'Booking company name',
                'location' => 'Location',
            ],
        ],
        'booking_driver' => [
            'label' => 'Booking Driver',
            'default_status' => 'pending_approval',
            'dashboard_path' => '/dashboard/booking-driver/trips',
            'registration_fields' => [
                'company_name' => 'Booking company name',
                'number_plate' => 'Number plate',
                'bus_capacity' => 'Bus capacity',
            ],
        ],
        'passenger' => [
            'label' => 'Passenger',
            'default_status' => 'active',
            'dashboard_path' => '/booking',
            'registration_fields' => [],
        ],
    ],
];
