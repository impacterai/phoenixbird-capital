<?php
require_once __DIR__ . '/../vendor/autoload.php';

use MongoDB\Client;

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->safeLoad();

$mongoUri = getenv('MONGODB_URI') ?: 'mongodb://localhost:27017';
$dbName = getenv('MONGODB_DB') ?: 'phoenixbird';

try {
    $client = new Client($mongoUri);
    $db = $client->selectDatabase($dbName);
    
    // Create collections if they don't exist
    if (!in_array('users', $db->listCollectionNames())) {
        $db->createCollection('users');
        $db->users->createIndex(['email' => 1], ['unique' => true]);
    }
    
    if (!in_array('investments', $db->listCollectionNames())) {
        $db->createCollection('investments');
    }
    
    if (!in_array('user_investments', $db->listCollectionNames())) {
        $db->createCollection('user_investments');
        $db->user_investments->createIndex(['user_id' => 1]);
        $db->user_investments->createIndex(['investment_id' => 1]);
    }

} catch (Exception $e) {
    error_log("MongoDB connection failed: " . $e->getMessage());
    die("Could not connect to the database. Please try again later.");
}
