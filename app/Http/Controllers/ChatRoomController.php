<?php

namespace App\Http\Controllers;

use App\Models\ChatRoom;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ChatRoomController extends Controller
{
    /**
     * 取得用戶的聊天室列表
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // 個人專屬房間（擁有者）
        $ownedRooms = $user->ownedChatRooms()
            ->where('type', 'personal')
            ->with(['owner', 'messages' => function ($query) {
                $query->latest()->limit(1);
            }])
            ->get();

        // 參與的私人/公開房間
        $memberRooms = $user->chatRooms()
            ->whereIn('type', ['private', 'public'])
            ->with(['owner', 'members', 'messages' => function ($query) {
                $query->latest()->limit(1);
            }])
            ->get();

        // 所有公開房間（用戶尚未加入的）
        $publicRooms = ChatRoom::where('type', 'public')
            ->whereDoesntHave('members', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->with(['owner'])
            ->get();

        return response()->json([
            'owned_rooms' => $ownedRooms,
            'member_rooms' => $memberRooms,
            'public_rooms' => $publicRooms,
        ]);
    }

    /**
     * 建立聊天室
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:personal,private,public',
            'member_ids' => 'nullable|array',
            'member_ids.*' => 'exists:users,id',
        ]);

        $user = $request->user();

        DB::beginTransaction();
        try {
            $chatRoom = ChatRoom::create([
                'user_id' => $request->type === 'personal' ? $user->id : null,
                'name' => $request->name,
                'type' => $request->type,
                'is_public' => $request->type === 'public',
            ]);

            // 如果不是個人專屬房間，添加成員
            if ($request->type !== 'personal') {
                $memberIds = $request->member_ids ?? [];
                // 確保創建者也在成員列表中
                if (!in_array($user->id, $memberIds)) {
                    $memberIds[] = $user->id;
                }
                $chatRoom->members()->attach($memberIds);
            }

            DB::commit();

            $chatRoom->load(['owner', 'members']);

            return response()->json($chatRoom, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to create chat room'], 500);
        }
    }

    /**
     * 取得聊天室詳情
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $chatRoom = ChatRoom::with(['owner', 'members', 'messages.user'])
            ->findOrFail($id);

        // 權限檢查
        if ($chatRoom->type === 'personal' && !$chatRoom->isOwner($user->id)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        if ($chatRoom->type === 'private' && !$chatRoom->hasMember($user->id)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        return response()->json($chatRoom);
    }

    /**
     * 加入公開聊天室
     */
    public function join(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $chatRoom = ChatRoom::findOrFail($id);

        if ($chatRoom->type !== 'public') {
            return response()->json(['error' => 'Only public rooms can be joined'], 400);
        }

        if ($chatRoom->hasMember($user->id)) {
            return response()->json(['error' => 'Already a member'], 400);
        }

        $chatRoom->members()->attach($user->id);

        return response()->json(['message' => 'Joined successfully']);
    }

    /**
     * 離開聊天室
     */
    public function leave(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $chatRoom = ChatRoom::findOrFail($id);

        if (!$chatRoom->hasMember($user->id)) {
            return response()->json(['error' => 'Not a member'], 400);
        }

        // 如果是擁有者，不能離開個人專屬房間
        if ($chatRoom->type === 'personal' && $chatRoom->isOwner($user->id)) {
            return response()->json(['error' => 'Cannot leave personal room'], 400);
        }

        $chatRoom->members()->detach($user->id);

        return response()->json(['message' => 'Left successfully']);
    }

    /**
     * 刪除聊天室（僅擁有者）
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $chatRoom = ChatRoom::findOrFail($id);

        if (!$chatRoom->isOwner($user->id)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $chatRoom->delete();

        return response()->json(['message' => 'Chat room deleted']);
    }
}
