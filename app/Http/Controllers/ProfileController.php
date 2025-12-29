<?php

namespace App\Http\Controllers;

use App\Services\ImageService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    /**
     * 取得當前用戶的個人資料
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        
        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'avatar_path' => $user->avatar_path,
            'avatar_url' => ImageService::getImageUrl($user->avatar_path),
        ]);
    }

    /**
     * 更新個人資料
     */
    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'avatar' => 'sometimes|image|mimes:jpeg,jpg,png,gif,bmp,webp|max:5120', // 5MB max, 強制轉換為 WebP
        ]);

        $user = $request->user();

        // 更新名稱
        if ($request->has('name')) {
            $user->name = $request->name;
        }

        // 處理頭像上傳（圖片轉 WebP，UUID 命名）
        if ($request->hasFile('avatar')) {
            // 刪除舊的頭像
            ImageService::deleteImage($user->avatar_path);

            try {
                $file = $request->file('avatar');
                $user->avatar_path = ImageService::convertToWebP($file, 'avatars', 90);
            } catch (\Exception $e) {
                return response()->json(['error' => $e->getMessage()], 400);
            }
        }

        $user->save();

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'avatar_path' => $user->avatar_path,
            'avatar_url' => ImageService::getImageUrl($user->avatar_path),
        ]);
    }
}
