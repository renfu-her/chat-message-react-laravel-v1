import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo;
  }
}

let echoInstance: Echo | null = null;

export function initializeEcho(token: string): Echo {
  if (echoInstance) {
    return echoInstance;
  }

  const reverbHost = import.meta.env.VITE_REVERB_HOST || 'localhost';
  const reverbPort = import.meta.env.VITE_REVERB_PORT || '8080';
  const reverbKey = import.meta.env.VITE_REVERB_APP_KEY || '';
  const reverbScheme = import.meta.env.VITE_REVERB_SCHEME || 'http';

  window.Pusher = Pusher;

  echoInstance = new Echo({
    broadcaster: 'reverb',
    key: reverbKey,
    wsHost: reverbHost,
    wsPort: reverbPort,
    wssPort: reverbPort,
    forceTLS: reverbScheme === 'https',
    enabledTransports: ['ws', 'wss'],
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
    authEndpoint: `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/broadcasting/auth`,
  });

  return echoInstance;
}

export function disconnectEcho(): void {
  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
  }
}

export function getEcho(): Echo | null {
  return echoInstance;
}

