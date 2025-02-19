<?php
header('Content-Type: application/json');
require_once '../config/database.php';

// Enable CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

function validateToken($token) {
    try {
        $payload = json_decode(base64_decode($token), true);
        if ($payload && isset($payload['exp']) && $payload['exp'] > time()) {
            return $payload['user_id'];
        }
    } catch (Exception $e) {
        return false;
    }
    return false;
}

$action = $_GET['action'] ?? 'list';

switch ($action) {
    case 'list':
        $investments = $db->investments->find(
            ['status' => 'open'],
            ['sort' => ['created_at' => -1]]
        )->toArray();

        // Convert MongoDB objects to arrays and format dates
        $formatted = array_map(function($investment) {
            return [
                'id' => (string)$investment->_id,
                'title' => $investment->title,
                'description' => $investment->description,
                'minimum_investment' => $investment->minimum_investment,
                'target_return' => $investment->target_return,
                'status' => $investment->status,
                'created_at' => $investment->created_at->toDateTime()->format('c')
            ];
        }, $investments);

        echo json_encode(['success' => true, 'investments' => $formatted]);
        break;

    case 'invest':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit;
        }

        $headers = getallheaders();
        $token = str_replace('Bearer ', '', $headers['Authorization'] ?? '');
        $userId = validateToken($token);

        if (!$userId) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            exit;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        
        try {
            $result = $db->user_investments->insertOne([
                'user_id' => new MongoDB\BSON\ObjectId($userId),
                'investment_id' => new MongoDB\BSON\ObjectId($data['investment_id']),
                'amount' => (float)$data['amount'],
                'status' => 'pending',
                'created_at' => new MongoDB\BSON\UTCDateTime(),
                'updated_at' => new MongoDB\BSON\UTCDateTime()
            ]);

            echo json_encode(['success' => true, 'message' => 'Investment submitted successfully']);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['error' => 'Failed to submit investment']);
        }
        break;

    case 'my-investments':
        $headers = getallheaders();
        $token = str_replace('Bearer ', '', $headers['Authorization'] ?? '');
        $userId = validateToken($token);

        if (!$userId) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            exit;
        }

        // Using MongoDB aggregation to join user_investments with investments
        $pipeline = [
            ['$match' => ['user_id' => new MongoDB\BSON\ObjectId($userId)]],
            ['$lookup' => [
                'from' => 'investments',
                'localField' => 'investment_id',
                'foreignField' => '_id',
                'as' => 'investment'
            ]],
            ['$unwind' => '$investment'],
            ['$sort' => ['created_at' => -1]]
        ];

        $userInvestments = $db->user_investments->aggregate($pipeline)->toArray();

        // Format the results
        $formatted = array_map(function($item) {
            return [
                'id' => (string)$item->_id,
                'amount' => $item->amount,
                'status' => $item->status,
                'created_at' => $item->created_at->toDateTime()->format('c'),
                'investment' => [
                    'id' => (string)$item->investment->_id,
                    'title' => $item->investment->title,
                    'description' => $item->investment->description
                ]
            ];
        }, $userInvestments);
        
        echo json_encode(['success' => true, 'investments' => $formatted]);
        break;

    default:
        http_response_code(404);
        echo json_encode(['error' => 'Invalid action']);
        break;
}
