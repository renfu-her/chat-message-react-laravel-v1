<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Message extends Model
{
    protected $fillable = [
        'chat_room_id',
        'user_id',
        'content',
        'attachment_path',
    ];

    /**
     * 訊息所屬的聊天室
     */
    public function chatRoom(): BelongsTo
    {
        return $this->belongsTo(ChatRoom::class);
    }

    /**
     * 訊息發送者
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
