<?php

use App\Models\ChatRoom;
use Illuminate\Support\Facades\Broadcast;

// 私人用戶頻道（個人專屬房間）
Broadcast::channel('private-user.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

// 私人聊天室頻道（僅成員可訂閱）
Broadcast::channel('private-chat-room.{roomId}', function ($user, $roomId) {
    $chatRoom = ChatRoom::find($roomId);
    
    if (!$chatRoom) {
        return false;
    }
    
    // 檢查是否為成員
    return $chatRoom->hasMember($user->id);
});

// 公開聊天室頻道（所有用戶可訂閱，使用 PresenceChannel）
Broadcast::channel('public-chat-room.{roomId}', function ($user, $roomId) {
    $chatRoom = ChatRoom::find($roomId);
    
    if (!$chatRoom || $chatRoom->type !== 'public') {
        return false;
    }
    
    // PresenceChannel 需要返回用戶數據
    return [
        'id' => $user->id,
        'name' => $user->name,
        'email' => $user->email,
    ];
});
