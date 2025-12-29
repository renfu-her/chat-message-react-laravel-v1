<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\ChatRoom;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use App\Services\ImageService;

class UserController extends Controller
{
    /**
     * 獲取所有用戶（排除當前用戶和已經是朋友的）
     */
    public function index(Request $request): JsonResponse
    {
        $currentUser = $request->user();
        
        // 獲取當前用戶參與的所有個人聊天室
        $friendRoomIds = $currentUser->chatRooms()
            ->where('type', 'personal')
            ->pluck('chat_rooms.id')
            ->toArray();
        
        // 獲取這些個人聊天室中的所有成員（排除當前用戶），這些就是朋友
        $friendIds = DB::table('chat_room_user')
            ->whereIn('chat_room_id', $friendRoomIds)
            ->where('user_id', '!=', $currentUser->id)
            ->pluck('user_id')
            ->unique()
            ->toArray();
        
        // 獲取所有用戶，排除當前用戶和已經是朋友的用戶
        $allUsers = User::where('id', '!=', $currentUser->id)
            ->whereNotIn('id', $friendIds)
            ->select('id', 'name', 'email', 'avatar_path')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar_url' => ImageService::getImageUrl($user->avatar_path),
                ];
            });
        
        return response()->json([
            'users' => $allUsers,
        ]);
    }
    
    /**
     * 添加朋友（創建個人聊天室）
     */
    public function addFriend(Request $request, int $userId): JsonResponse
    {
        $currentUser = $request->user();
        
        // 檢查目標用戶是否存在
        $targetUser = User::findOrFail($userId);
        
        if ($targetUser->id === $currentUser->id) {
            return response()->json(['error' => 'Cannot add yourself as a friend'], 400);
        }
        
        // 檢查是否已經是朋友（檢查是否在同一個個人聊天室中）
        $existingRoom = ChatRoom::where('type', 'personal')
            ->whereHas('members', function ($query) use ($currentUser, $userId) {
                $query->whereIn('user_id', [$currentUser->id, $userId]);
            })
            ->get()
            ->filter(function ($room) use ($currentUser, $userId) {
                return $room->hasMember($currentUser->id) && $room->hasMember($userId);
            })
            ->first();
        
        if ($existingRoom) {
            return response()->json(['error' => 'Already friends'], 400);
        }
        
        DB::beginTransaction();
        try {
            // 創建個人聊天室
            $chatRoom = ChatRoom::create([
                'user_id' => $currentUser->id,
                'name' => $targetUser->name, // 使用目標用戶的名字作為房間名
                'type' => 'personal',
                'is_public' => false,
            ]);
            
            // 添加目標用戶為成員
            $chatRoom->members()->attach([$currentUser->id, $targetUser->id]);
            
            DB::commit();
            
            $chatRoom->load(['owner', 'members']);
            
            return response()->json([
                'message' => 'Friend added successfully',
                'chat_room' => $chatRoom,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to add friend'], 500);
        }
    }
}

