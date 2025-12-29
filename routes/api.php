<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ChatRoomController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// 認證路由（無需認證）
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// 需要認證的路由
Route::middleware('auth:sanctum')->group(function () {
    // 認證相關
    Route::get('/auth/user', function (Request $request) {
        return $request->user();
    });
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // 聊天室路由
    Route::get('/chat-rooms', [ChatRoomController::class, 'index']);
    Route::post('/chat-rooms', [ChatRoomController::class, 'store']);
    Route::get('/chat-rooms/{id}', [ChatRoomController::class, 'show']);
    Route::post('/chat-rooms/{id}/join', [ChatRoomController::class, 'join']);
    Route::post('/chat-rooms/{id}/leave', [ChatRoomController::class, 'leave']);
    Route::delete('/chat-rooms/{id}', [ChatRoomController::class, 'destroy']);

    // 訊息路由
    Route::get('/chat-rooms/{chatRoomId}/messages', [MessageController::class, 'index']);
    Route::post('/chat-rooms/{chatRoomId}/messages', [MessageController::class, 'store']);
    Route::post('/chat-rooms/{chatRoomId}/messages/{messageId}/read', [MessageController::class, 'markAsRead']);

    // 個人資料路由
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);

    // 用戶路由
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users/{userId}/add-friend', [UserController::class, 'addFriend']);
});
