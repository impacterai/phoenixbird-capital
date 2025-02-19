<?php
header('Content-Type: application/json');
require_once '../config/database.php';

// Enable CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

function generateToken($userId) {
    $payload = [
        'user_id' => (string)$userId,
        'exp' => time() + (60 * 60 * 24) // 24 hours expiration
    ];
    return base64_encode(json_encode($payload));
}

function hashPassword($password) {
    return password_hash($password, PASSWORD_DEFAULT);
}

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'register':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        
        try {
            $result = $db->users->insertOne([
                'email' => $data['email'],
                'password' => hashPassword($data['password']),
                'firstName' => $data['firstName'],
                'lastName' => $data['lastName'],
                'phone' => $data['phone'],
                'isAccredited' => $data['isAccredited'],
                'created_at' => new MongoDB\BSON\UTCDateTime(),
                'updated_at' => new MongoDB\BSON\UTCDateTime()
            ]);
            
            echo json_encode(['success' => true, 'message' => 'User registered successfully']);
        } catch (MongoDB\Driver\Exception\BulkWriteException $e) {
            if ($e->getCode() == 11000) { // Duplicate key error
                http_response_code(400);
                echo json_encode(['error' => 'Email already exists']);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Registration failed']);
            }
        }
        break;

    case 'login':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        
        $user = $db->users->findOne(['email' => $data['email']]);

        if ($user && password_verify($data['password'], $user->password)) {
            $token = generateToken($user->_id);
            echo json_encode([
                'success' => true,
                'token' => $token,
                'user' => [
                    'id' => (string)$user->_id,
                    'email' => $user->email,
                    'firstName' => $user->firstName,
                    'lastName' => $user->lastName
                ]
            ]);
        } else {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid credentials']);
        }
        break;

    case 'reset-password':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        
        $user = $db->users->findOne(['email' => $data['email']]);

        if ($user) {
            // Generate reset token
            $resetToken = bin2hex(random_bytes(32));
            $resetExpiry = new MongoDB\BSON\UTCDateTime(strtotime('+1 hour') * 1000);
            
            $db->users->updateOne(
                ['_id' => $user->_id],
                ['$set' => [
                    'reset_token' => $resetToken,
                    'reset_token_expiry' => $resetExpiry,
                    'updated_at' => new MongoDB\BSON\UTCDateTime()
                ]]
            );

            // In a real application, send email with reset link
            // For demo, just return success
            echo json_encode([
                'success' => true,
                'message' => 'Password reset instructions sent to your email'
            ]);
        } else {
            // For security, don't reveal if email exists
            echo json_encode([
                'success' => true,
                'message' => 'If an account exists with this email, you will receive password reset instructions'
            ]);
        }
        break;

    default:
        http_response_code(404);
        echo json_encode(['error' => 'Invalid action']);
        break;
}
