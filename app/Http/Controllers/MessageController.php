<?php

namespace App\Http\Controllers;

use App\Events\MessageSent;
use App\Models\ChatRoom;
use App\Models\Message;
use App\Services\ImageService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class MessageController extends Controller
{
    /**
     * 取得聊天室訊息
     */
    public function index(Request $request, int $chatRoomId): JsonResponse
    {
        $user = $request->user();
        $chatRoom = ChatRoom::findOrFail($chatRoomId);

        // 權限檢查
        if ($chatRoom->type === 'personal' && !$chatRoom->isOwner($user->id)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        if ($chatRoom->type === 'private' && !$chatRoom->hasMember($user->id)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $messages = $chatRoom->messages()
            ->with('user')
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json($messages);
    }

    /**
     * 發送訊息
     */
    public function store(Request $request, int $chatRoomId): JsonResponse
    {
        $request->validate([
            'content' => 'nullable|string',
            'attachment' => 'nullable|image|mimes:jpeg,jpg,png,gif,bmp,webp|max:10240', // 10MB max, 強制轉換為 WebP
        ]);

        $user = $request->user();
        $chatRoom = ChatRoom::findOrFail($chatRoomId);

        // 權限檢查
        if ($chatRoom->type === 'personal' && !$chatRoom->isOwner($user->id)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        if ($chatRoom->type === 'private' && !$chatRoom->hasMember($user->id)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        if ($chatRoom->type === 'public' && !$chatRoom->hasMember($user->id)) {
            return response()->json(['error' => 'Must be a member to send messages'], 403);
        }

        $attachmentPath = null;

        // 處理檔案上傳（圖片轉 WebP，UUID 命名）
        if ($request->hasFile('attachment')) {
            try {
                $file = $request->file('attachment');
                $attachmentPath = ImageService::convertToWebP($file, 'attachments', 90);
            } catch (\Exception $e) {
                return response()->json(['error' => $e->getMessage()], 400);
            }
        }

        $message = Message::create([
            'chat_room_id' => $chatRoomId,
            'user_id' => $user->id,
            'content' => $request->content,
            'attachment_path' => $attachmentPath,
        ]);

        $message->load('user');

        // 觸發廣播事件
        event(new MessageSent($message, $chatRoom));

        return response()->json($message, 201);
    }

    /**
     * 標記訊息已讀
     */
    public function markAsRead(Request $request, int $chatRoomId, int $messageId): JsonResponse
    {
        $user = $request->user();
        $chatRoom = ChatRoom::findOrFail($chatRoomId);
        $message = Message::findOrFail($messageId);

        // 權限檢查
        if ($message->chat_room_id !== $chatRoomId) {
            return response()->json(['error' => 'Message does not belong to this chat room'], 400);
        }

        // 這裡可以添加已讀記錄表，目前先返回成功
        return response()->json(['message' => 'Marked as read']);
    }
}
