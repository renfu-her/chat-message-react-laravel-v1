<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

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
            'avatar_url' => $user->avatar_path 
                ? url(Storage::url($user->avatar_path))
                : null,
        ]);
    }

    /**
     * 更新個人資料
     */
    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255|unique:users,email,' . $request->user()->id,
            'avatar' => 'sometimes|image|max:5120', // 5MB max
        ]);

        $user = $request->user();

        // 更新名稱
        if ($request->has('name')) {
            $user->name = $request->name;
        }

        // 更新電子郵件
        if ($request->has('email')) {
            $user->email = $request->email;
        }

        // 處理頭像上傳（圖片轉 WebP，UUID 命名）
        if ($request->hasFile('avatar')) {
            // 刪除舊的頭像
            if ($user->avatar_path && Storage::disk('public')->exists($user->avatar_path)) {
                Storage::disk('public')->delete($user->avatar_path);
            }

            $file = $request->file('avatar');
            
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
            Storage::disk('public')->put('avatars/' . $filename, $webpData);
            unlink($webpPath); // 清理臨時文件
            
            $user->avatar_path = 'avatars/' . $filename;
        }

        $user->save();

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'avatar_path' => $user->avatar_path,
            'avatar_url' => $user->avatar_path 
                ? url(Storage::url($user->avatar_path))
                : null,
        ]);
    }
}
