<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChatRoom extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'type',
        'is_public',
    ];

    protected function casts(): array
    {
        return [
            'is_public' => 'boolean',
        ];
    }

    /**
     * 聊天室擁有者（個人專屬房間）
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * 聊天室成員（多對多）
     */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'chat_room_user')
            ->withTimestamps();
    }

    /**
     * 聊天室訊息
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    /**
     * 檢查用戶是否為成員
     */
    public function hasMember(int $userId): bool
    {
        return $this->members()->where('user_id', $userId)->exists();
    }

    /**
     * 檢查用戶是否為擁有者
     */
    public function isOwner(int $userId): bool
    {
        return $this->user_id === $userId;
    }
}
