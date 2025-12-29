<?php

namespace App\Http\Controllers;

use App\Events\MessageSent;
use App\Models\ChatRoom;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

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
            'attachment' => 'nullable|image|max:10240', // 10MB max
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
            $file = $request->file('attachment');
            
            // 生成 UUID 檔案名
            $uuid = Str::uuid();
            $filename = $uuid . '.webp';
            
            // 讀取原始圖片
            $imageData = file_get_contents($file->getRealPath());
            $sourceImage = imagecreatefromstring($imageData);
            
            if ($sourceImage === false) {
                return response()->json(['error' => 'Invalid image file'], 400);
            }
            
            // 轉換為 WebP
            $webpPath = sys_get_temp_dir() . '/' . $uuid . '.webp';
            imagewebp($sourceImage, $webpPath, 90);
            imagedestroy($sourceImage);
            
            // 儲存到 public disk
            $webpData = file_get_contents($webpPath);
            Storage::disk('public')->put('attachments/' . $filename, $webpData);
            unlink($webpPath); // 清理臨時文件
            
            $attachmentPath = 'attachments/' . $filename;
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
