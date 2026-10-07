<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\ParentController;
use App\Http\Controllers\Api\PublicController;
use App\Http\Controllers\Api\SaccoAdminController;
use App\Http\Controllers\Api\SaccoDriverController;
use App\Http\Controllers\Api\SchoolAdminController;
use App\Http\Controllers\Api\SchoolDriverController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::get('/health', [PublicController::class, 'health']);
Route::get('/homepage', [PublicController::class, 'homepage']);
Route::prefix('booking')->group(function () {
    Route::get('/companies', [BookingController::class, 'companies']);
    Route::get('/companies/{slug}', [BookingController::class, 'company']);
    Route::get('/routes/{routeId}', [BookingController::class, 'route']);
    Route::get('/trips/{tripId}', [BookingController::class, 'trip']);
    Route::post('/trips/{tripId}/book', [BookingController::class, 'bookTrip']);
    Route::get('/driver/{driverId}/overview', [BookingController::class, 'driverOverview']);
    Route::post('/trips/{tripId}/notify-arrival', [BookingController::class, 'notifyArrival']);
});

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

Route::prefix('sacco-admin')->middleware('auth:sanctum')->group(function () {
    Route::get('/overview', [SaccoAdminController::class, 'overview']);
    Route::get('/drivers', [SaccoAdminController::class, 'drivers']);
    Route::post('/drivers/{driverId}/approve', [SaccoAdminController::class, 'approveDriver']);
    Route::get('/routes', [SaccoAdminController::class, 'routes']);
    Route::post('/routes', [SaccoAdminController::class, 'storeRoute']);
    Route::get('/fares', [SaccoAdminController::class, 'fares']);
    Route::post('/fares', [SaccoAdminController::class, 'storeFare']);
    Route::get('/queue', [SaccoAdminController::class, 'queue']);
    Route::post('/queue/{entryId}/dispatch', [SaccoAdminController::class, 'dispatchQueueEntry']);
    Route::post('/queue/{entryId}/left', [SaccoAdminController::class, 'markQueueLeft']);
    Route::get('/school-requests', [SaccoAdminController::class, 'schoolRequests']);
    Route::post('/school-requests/{requestId}/assign', [SaccoAdminController::class, 'assignSchoolDrivers']);
    Route::get('/complaints', [SaccoAdminController::class, 'complaints']);
    Route::post('/complaints/{complaintId}/respond', [SaccoAdminController::class, 'respondComplaint']);
    Route::get('/reports/revenue', [\App\Http\Controllers\Api\ReportsController::class, 'saccoRevenue']);
});

Route::prefix('sacco-driver')->middleware('auth:sanctum')->group(function () {
    Route::get('/overview', [SaccoDriverController::class, 'overview']);
    Route::get('/arrival-status', [SaccoDriverController::class, 'arrivalStatus']);
    Route::post('/arrival-notify', [SaccoDriverController::class, 'notifyArrival']);
    Route::get('/fares', [SaccoDriverController::class, 'fares']);
    Route::post('/fare-prompts', [SaccoDriverController::class, 'createFarePrompt']);
    Route::get('/dropoffs', [SaccoDriverController::class, 'dropoffs']);
    Route::post('/dropoffs/{paymentId}/clear', [SaccoDriverController::class, 'clearDropoff']);
    Route::get('/school-transport', [SaccoDriverController::class, 'schoolTransport']);
    Route::post('/school-updates', [SaccoDriverController::class, 'sendSchoolUpdate']);
});

Route::prefix('school-admin')->middleware('auth:sanctum')->group(function () {
    Route::get('/drivers', [SchoolAdminController::class, 'drivers']);
    Route::post('/drivers/{driverId}/approve', [SchoolAdminController::class, 'approveDriver']);
    Route::get('/notifications', [SchoolAdminController::class, 'notifications']);
    Route::get('/trips', [SchoolAdminController::class, 'trips']);
    Route::post('/routes', [SchoolAdminController::class, 'storeRoute']);
    Route::post('/daily-trips', [SchoolAdminController::class, 'storeDailyTrip']);
    Route::post('/daily-trips/{tripId}/assign', [SchoolAdminController::class, 'assignDailyTripStudents']);
    Route::post('/educational-trips', [SchoolAdminController::class, 'storeEducationalTrip']);
    Route::post('/closing-trips', [SchoolAdminController::class, 'storeClosingTrip']);
    Route::post('/closing-trips/{tripId}/fares', [SchoolAdminController::class, 'storeClosingFare']);
    Route::get('/closing-assignments', [SchoolAdminController::class, 'closingAssignments']);
    Route::post('/closing-trips/{tripId}/assign', [SchoolAdminController::class, 'assignClosingStudents']);
    Route::get('/payments', [SchoolAdminController::class, 'payments']);
    Route::post('/payments/{paymentId}/approve', [SchoolAdminController::class, 'approvePayment']);
    Route::get('/sacco-directory', [SchoolAdminController::class, 'saccoDirectory']);
    Route::post('/sacco-requests', [SchoolAdminController::class, 'createSaccoRequest']);
    Route::post('/sacco-messages', [SchoolAdminController::class, 'sendSaccoMessage']);
    Route::get('/complaints', [SchoolAdminController::class, 'complaints']);
    Route::post('/complaints/{id}/respond', [SchoolAdminController::class, 'respondComplaint']);
    Route::get('/reports/payments', [\App\Http\Controllers\Api\ReportsController::class, 'schoolPayments']);
});

Route::prefix('school-driver')->middleware('auth:sanctum')->group(function () {
    Route::get('/trips', [SchoolDriverController::class, 'trips']);
    Route::get('/alerts', [SchoolDriverController::class, 'alerts']);
    Route::post('/alerts', [SchoolDriverController::class, 'sendAlert']);
});

Route::post('/mpesa/callback', [\App\Http\Controllers\Api\DarajaController::class, 'callback']);

Route::prefix('parent')->middleware('auth:sanctum')->group(function () {
    Route::get('/child', [ParentController::class, 'child']);
    Route::get('/trips', [ParentController::class, 'trips']);
    Route::get('/payments', [ParentController::class, 'payments']);
    Route::post('/payments', [ParentController::class, 'makePayment']);
    Route::get('/notifications', [ParentController::class, 'notifications']);
});

Route::prefix('booking-admin')->middleware('auth:sanctum')->group(function () {
    Route::get('/complaints', [BookingController::class, 'complaints']);
    Route::post('/complaints/{id}/respond', [BookingController::class, 'respondComplaint']);
    Route::get('/reports/manifest', [\App\Http\Controllers\Api\ReportsController::class, 'bookingManifest']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/reports/driver-activity', [\App\Http\Controllers\Api\ReportsController::class, 'driverActivity']);
    Route::get('/reports/user-activity', [\App\Http\Controllers\Api\ReportsController::class, 'userActivity']);
});
