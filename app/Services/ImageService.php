<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImageService
{
    /**
     * 將上傳的圖片轉換為 WebP 格式並儲存
     *
     * @param UploadedFile $file 上傳的圖片檔案
     * @param string $directory 儲存目錄（例如：'avatars' 或 'attachments'）
     * @param int $quality WebP 品質 (1-100，預設 90)
     * @return string 儲存的檔案路徑
     * @throws \Exception 當圖片無法處理時
     */
    public static function convertToWebP(UploadedFile $file, string $directory, int $quality = 90): string
    {
        // 驗證檔案類型
        $allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
        $mimeType = $file->getMimeType();
        
        if (!in_array($mimeType, $allowedMimes)) {
            throw new \Exception('Invalid image file. Supported formats: JPEG, PNG, GIF, BMP, WEBP');
        }
        
        // 生成 UUID 檔案名（強制使用 .webp 擴展名）
        $uuid = Str::uuid();
        $filename = $uuid . '.webp';
        
        // 讀取原始圖片（無論原始格式是什麼，都會重新處理）
        $imageData = file_get_contents($file->getRealPath());
        $sourceImage = imagecreatefromstring($imageData);
        
        if ($sourceImage === false) {
            throw new \Exception('Failed to read image file. Please ensure the file is a valid image.');
        }
        
        // 強制轉換為 WebP（即使原始檔案已經是 WebP，也會重新處理以確保格式統一）
        $webpPath = sys_get_temp_dir() . '/' . $uuid . '.webp';
        $result = imagewebp($sourceImage, $webpPath, $quality);
        imagedestroy($sourceImage);
        
        if (!$result) {
            throw new \Exception('Failed to convert image to WebP format. Please check if WebP support is enabled.');
        }
        
        // 驗證轉換後的 WebP 檔案
        if (!file_exists($webpPath) || filesize($webpPath) === 0) {
            throw new \Exception('Failed to generate WebP image file.');
        }
        
        // 儲存到 public disk（強制儲存為 .webp 格式）
        $webpData = file_get_contents($webpPath);
        Storage::disk('public')->put($directory . '/' . $filename, $webpData);
        unlink($webpPath); // 清理臨時文件
        
        // 確保儲存的檔案路徑以 .webp 結尾
        return $directory . '/' . $filename;
    }

    /**
     * 刪除圖片檔案
     *
     * @param string|null $path 圖片路徑
     * @return bool 是否成功刪除
     */
    public static function deleteImage(?string $path): bool
    {
        if (!$path) {
            return false;
        }

        if (Storage::disk('public')->exists($path)) {
            return Storage::disk('public')->delete($path);
        }

        return false;
    }

    /**
     * 取得圖片的完整 URL
     *
     * @param string|null $path 圖片路徑
     * @return string|null 完整的 URL
     */
    public static function getImageUrl(?string $path): ?string
    {
        if (!$path) {
            return null;
        }

        return url(Storage::url($path));
    }
}
