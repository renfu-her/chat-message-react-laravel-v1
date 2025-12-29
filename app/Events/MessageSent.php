<?php

namespace App\Events;

use App\Models\ChatRoom;
use App\Models\Message;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Message $message;
    public ChatRoom $chatRoom;

    /**
     * Create a new event instance.
     */
    public function __construct(Message $message, ChatRoom $chatRoom)
    {
        $this->message = $message;
        $this->chatRoom = $chatRoom;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return match ($this->chatRoom->type) {
            'personal' => [
                new PrivateChannel('private-user.' . $this->chatRoom->user_id),
            ],
            'private' => [
                new PrivateChannel('private-chat-room.' . $this->chatRoom->id),
            ],
            'public' => [
                new PresenceChannel('public-chat-room.' . $this->chatRoom->id),
            ],
            default => [
                new PrivateChannel('private-chat-room.' . $this->chatRoom->id),
            ],
        };
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'message.sent';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'message' => [
                'id' => $this->message->id,
                'chat_room_id' => $this->message->chat_room_id,
                'user_id' => $this->message->user_id,
                'content' => $this->message->content,
                'attachment_path' => $this->message->attachment_path,
                'created_at' => $this->message->created_at->toISOString(),
                'user' => [
                    'id' => $this->message->user->id,
                    'name' => $this->message->user->name,
                    'email' => $this->message->user->email,
                ],
            ],
        ];
    }
}
