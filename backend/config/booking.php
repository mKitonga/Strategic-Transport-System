<?php

return [
    'companies' => [
        [
            'id' => 1,
            'slug' => 'ena-coach',
            'name' => 'Ena Coach',
            'location' => 'Nairobi CBD',
            'contact_phone' => '+254700111222',
            'contact_email' => 'bookings@enacoach.co.ke',
            'routes' => [
                [
                    'id' => 101,
                    'name' => 'Nairobi to Mombasa',
                    'departure' => 'Nairobi',
                    'destination' => 'Mombasa',
                    'fare' => 1500,
                    'trips' => [
                        [
                            'id' => 1001,
                            'time' => '06:00 AM',
                            'fare' => 1500,
                            'driver_id' => 501,
                            'driver_name' => 'Peter Omondi',
                            'major_departure_point' => 'Machakos Country Bus',
                            'seats' => [
                                ['number' => '01', 'available' => false],
                                ['number' => '02', 'available' => false],
                                ['number' => '03', 'available' => true],
                                ['number' => '04', 'available' => true],
                                ['number' => '05', 'available' => true],
                                ['number' => '06', 'available' => true],
                                ['number' => '07', 'available' => false],
                                ['number' => '08', 'available' => true],
                            ],
                            'passengers' => [
                                ['id' => 1, 'name' => 'Alice Wanjiku', 'seat' => '01', 'phone' => '+254711000001', 'status' => 'Boarded'],
                                ['id' => 2, 'name' => 'Brian Kiprotich', 'seat' => '02', 'phone' => '+254722000002', 'status' => 'Pending'],
                            ],
                        ],
                        [
                            'id' => 1002,
                            'time' => '10:00 PM',
                            'fare' => 1450,
                            'driver_id' => 502,
                            'driver_name' => 'Samuel Mwangi',
                            'major_departure_point' => 'Machakos Country Bus',
                            'seats' => [
                                ['number' => '01', 'available' => true],
                                ['number' => '02', 'available' => true],
                                ['number' => '03', 'available' => true],
                                ['number' => '04', 'available' => false],
                                ['number' => '05', 'available' => true],
                                ['number' => '06', 'available' => true],
                                ['number' => '07', 'available' => true],
                                ['number' => '08', 'available' => false],
                            ],
                            'passengers' => [],
                        ],
                    ],
                ],
                [
                    'id' => 102,
                    'name' => 'Nairobi to Kisumu',
                    'departure' => 'Nairobi',
                    'destination' => 'Kisumu',
                    'fare' => 1200,
                    'trips' => [
                        [
                            'id' => 1003,
                            'time' => '08:30 AM',
                            'fare' => 1200,
                            'driver_id' => 501,
                            'driver_name' => 'Peter Omondi',
                            'major_departure_point' => 'Tea Room',
                            'seats' => [
                                ['number' => '01', 'available' => true],
                                ['number' => '02', 'available' => true],
                                ['number' => '03', 'available' => false],
                                ['number' => '04', 'available' => true],
                                ['number' => '05', 'available' => true],
                                ['number' => '06', 'available' => false],
                            ],
                            'passengers' => [
                                ['id' => 3, 'name' => 'Mercy Atieno', 'seat' => '03', 'phone' => '+254733120120', 'status' => 'Paid'],
                                ['id' => 4, 'name' => 'Kevin Bett', 'seat' => '06', 'phone' => '+254798100100', 'status' => 'Paid'],
                            ],
                        ],
                    ],
                ],
            ],
        ],
        [
            'id' => 2,
            'slug' => 'tahmeed-coach',
            'name' => 'Tahmeed Coach',
            'location' => 'River Road',
            'contact_phone' => '+254712333444',
            'contact_email' => 'support@tahmeedcoach.co.ke',
            'routes' => [
                [
                    'id' => 201,
                    'name' => 'Nairobi to Malindi',
                    'departure' => 'Nairobi',
                    'destination' => 'Malindi',
                    'fare' => 1800,
                    'trips' => [
                        [
                            'id' => 2001,
                            'time' => '07:15 PM',
                            'fare' => 1800,
                            'driver_id' => 601,
                            'driver_name' => 'Yusuf Ahmed',
                            'major_departure_point' => 'River Road Terminus',
                            'seats' => [
                                ['number' => '01', 'available' => true],
                                ['number' => '02', 'available' => false],
                                ['number' => '03', 'available' => true],
                                ['number' => '04', 'available' => true],
                            ],
                            'passengers' => [
                                ['id' => 5, 'name' => 'Fatma Noor', 'seat' => '02', 'phone' => '+254701800900', 'status' => 'Boarded'],
                            ],
                        ],
                    ],
                ],
            ],
        ],
    ],
];
