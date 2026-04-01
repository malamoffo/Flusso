package com.flusso.app;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.net.Uri;
import android.os.Bundle;
import android.os.IBinder;
import android.support.v4.media.MediaBrowserCompat;
import android.support.v4.media.MediaDescriptionCompat;
import android.support.v4.media.session.MediaSessionCompat;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.media.MediaBrowserServiceCompat;

import com.capgo.mediasession.MediaSessionService;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;

import org.json.JSONObject;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.List;

public class AndroidAutoService extends MediaBrowserServiceCompat {

    private static final String TAG = "AndroidAutoService";
    private static final String ROOT_ID = "root";
    private static final String QUEUE_ID = "queue";
    private static final String RECENT_ID = "recent";
    private static final String FAVORITES_ID = "favorites";
    private boolean isBound = false;

    private ServiceConnection connection = new ServiceConnection() {
        @Override
        public void onServiceConnected(ComponentName className, IBinder service) {
            try {
                // Get the MediaSessionService instance from the binder
                Method getServiceMethod = service.getClass().getDeclaredMethod("getService");
                getServiceMethod.setAccessible(true);
                Object mediaSessionService = getServiceMethod.invoke(service);
                
                // Helper to find field in hierarchy
                Field field = null;
                Class<?> current = mediaSessionService.getClass();
                while (current != null && field == null) {
                    try {
                        field = current.getDeclaredField("mediaSession");
                    } catch (NoSuchFieldException e) {
                        current = current.getSuperclass();
                    }
                }
                
                if (field != null) {
                    field.setAccessible(true);
                    MediaSessionCompat mediaSession = (MediaSessionCompat) field.get(mediaSessionService);
                    
                    if (mediaSession != null) {
                        setSessionToken(mediaSession.getSessionToken());
                        Log.d(TAG, "Successfully attached MediaSessionToken");
                        
                        // Get the plugin instance to delegate callbacks
                        Field pluginField = null;
                        current = mediaSessionService.getClass();
                        while (current != null && pluginField == null) {
                            try {
                                pluginField = current.getDeclaredField("plugin");
                            } catch (NoSuchFieldException e) {
                                current = current.getSuperclass();
                            }
                        }

                        if (pluginField != null) {
                            pluginField.setAccessible(true);
                            final Object plugin = pluginField.get(mediaSessionService);
                            
                            final Method actionCallbackMethod = plugin.getClass().getDeclaredMethod("actionCallback", String.class);
                            actionCallbackMethod.setAccessible(true);

                            final Method actionCallbackWithDataMethod = plugin.getClass().getDeclaredMethod("actionCallback", String.class, JSObject.class);
                            actionCallbackWithDataMethod.setAccessible(true);

                            // Add a callback to handle play from media id and delegate others
                            mediaSession.setCallback(new MediaSessionCompat.Callback() {
                        @Override
                        public void onPlayFromMediaId(String mediaId, Bundle extras) {
                            super.onPlayFromMediaId(mediaId, extras);
                            Log.d(TAG, "onPlayFromMediaId: " + mediaId);
                            QueuePlugin queuePlugin = QueuePlugin.getInstance();
                            if (queuePlugin != null) {
                                queuePlugin.triggerPlayRequest(mediaId);
                            } else {
                                Log.e(TAG, "QueuePlugin instance is null, cannot send playRequest directly, but queue is static");
                                // We can't notify listeners if the plugin isn't loaded, 
                                // but we could potentially store the request or use another way.
                                // However, usually the plugin IS loaded if the app is running.
                            }
                        }

                        @Override
                        public void onPlay() {
                            try { actionCallbackMethod.invoke(plugin, "play"); } catch (Exception e) { Log.e(TAG, "Error invoking play", e); }
                        }

                        @Override
                        public void onPause() {
                            try { actionCallbackMethod.invoke(plugin, "pause"); } catch (Exception e) { Log.e(TAG, "Error invoking pause", e); }
                        }

                        @Override
                        public void onSeekTo(long pos) {
                            try {
                                JSObject data = new JSObject();
                                data.put("seekTime", (double) pos / 1000.0);
                                actionCallbackWithDataMethod.invoke(plugin, "seekto", data);
                            } catch (Exception e) { Log.e(TAG, "Error invoking seekto", e); }
                        }

                        @Override
                        public void onRewind() {
                            try { actionCallbackMethod.invoke(plugin, "seekbackward"); } catch (Exception e) { Log.e(TAG, "Error invoking seekbackward", e); }
                        }

                        @Override
                        public void onFastForward() {
                            try { actionCallbackMethod.invoke(plugin, "seekforward"); } catch (Exception e) { Log.e(TAG, "Error invoking seekforward", e); }
                        }

                        @Override
                        public void onSkipToPrevious() {
                            try { actionCallbackMethod.invoke(plugin, "previoustrack"); } catch (Exception e) { Log.e(TAG, "Error invoking previoustrack", e); }
                        }

                        @Override
                        public void onSkipToNext() {
                            try { actionCallbackMethod.invoke(plugin, "nexttrack"); } catch (Exception e) { Log.e(TAG, "Error invoking nexttrack", e); }
                        }

                        @Override
                        public void onStop() {
                            try { actionCallbackMethod.invoke(plugin, "stop"); } catch (Exception e) { Log.e(TAG, "Error invoking stop", e); }
                        }
                    });
                }
            } catch (Exception e) {
                Log.e(TAG, "Failed to get MediaSession via reflection", e);
            }
        }

        @Override
        public void onServiceDisconnected(ComponentName arg0) {
            isBound = false;
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "onCreate - Inizializzazione servizio Android Auto");
        // Bind to the Capgo MediaSessionService to get the session token
        Intent intent = new Intent(this, MediaSessionService.class);
        try {
            isBound = bindService(intent, connection, Context.BIND_AUTO_CREATE);
            if (!isBound) {
                Log.e(TAG, "Impossibile effettuare il bind al MediaSessionService. Assicurati che sia dichiarato correttamente nel Manifest.");
            } else {
                Log.d(TAG, "Binding al MediaSessionService avviato con successo.");
            }
        } catch (Exception e) {
            Log.e(TAG, "Errore critico durante il bind al servizio MediaSessionService", e);
        }
    }

    @Override
    public void onDestroy() {
        Log.d(TAG, "onDestroy - Pulizia risorse");
        if (isBound) {
            try {
                unbindService(connection);
                Log.d(TAG, "Unbind dal servizio completato.");
            } catch (IllegalArgumentException e) {
                Log.e(TAG, "Errore durante l'unbind (servizio già non legato)", e);
            }
            isBound = false;
        }
        super.onDestroy();
    }

    @Nullable
    @Override
    public BrowserRoot onGetRoot(@NonNull String clientPackageName, int clientUid, @Nullable Bundle rootHints) {
        Log.d(TAG, "onGetRoot");
        // Allow all clients to connect, but return a simple root
        return new BrowserRoot(ROOT_ID, null);
    }

    @Override
    public void onLoadChildren(@NonNull String parentId, @NonNull Result<List<MediaBrowserCompat.MediaItem>> result) {
        Log.d(TAG, "onLoadChildren: " + parentId);
        List<MediaBrowserCompat.MediaItem> mediaItems = new ArrayList<>();

        if (ROOT_ID.equals(parentId)) {
            // Add folders at the root
            mediaItems.add(new MediaBrowserCompat.MediaItem(
                    new MediaDescriptionCompat.Builder()
                            .setMediaId(QUEUE_ID)
                            .setTitle("Coda di riproduzione")
                            .setSubtitle("I tuoi podcast in coda")
                            .build(), 
                    MediaBrowserCompat.MediaItem.FLAG_BROWSABLE));
            
            mediaItems.add(new MediaBrowserCompat.MediaItem(
                    new MediaDescriptionCompat.Builder()
                            .setMediaId(RECENT_ID)
                            .setTitle("Recenti")
                            .setSubtitle("Ultimi episodi pubblicati")
                            .build(), 
                    MediaBrowserCompat.MediaItem.FLAG_BROWSABLE));

            mediaItems.add(new MediaBrowserCompat.MediaItem(
                    new MediaDescriptionCompat.Builder()
                            .setMediaId(FAVORITES_ID)
                            .setTitle("Preferiti")
                            .setSubtitle("I tuoi podcast preferiti")
                            .build(), 
                    MediaBrowserCompat.MediaItem.FLAG_BROWSABLE));
        } else if (QUEUE_ID.equals(parentId) || RECENT_ID.equals(parentId) || FAVORITES_ID.equals(parentId)) {
            // Fetch queue from our custom plugin using the static method
            JSArray queue = null;
            if (QUEUE_ID.equals(parentId)) {
                queue = QueuePlugin.getStaticQueue();
            } else if (RECENT_ID.equals(parentId)) {
                queue = QueuePlugin.getStaticRecent();
            } else if (FAVORITES_ID.equals(parentId)) {
                queue = QueuePlugin.getStaticFavorites();
            }
            
            if (queue != null) {
                Log.d(TAG, "Queue size for " + parentId + ": " + queue.length());
                try {
                    for (int i = 0; i < queue.length(); i++) {
                        JSONObject item = queue.getJSONObject(i);
                        String id = item.optString("id");
                        String title = item.optString("title");
                        String subtitle = item.optString("artist"); // Use artist for subtitle
                        String imageUrl = item.optString("artwork"); // Use artwork for icon
                        String mediaUrl = item.optString("mediaUrl");

                        MediaDescriptionCompat.Builder descriptionBuilder = new MediaDescriptionCompat.Builder()
                                .setMediaId(id)
                                .setTitle(title)
                                .setSubtitle(subtitle);

                        if (imageUrl != null && !imageUrl.isEmpty()) {
                            descriptionBuilder.setIconUri(Uri.parse(imageUrl));
                        }
                        
                        MediaDescriptionCompat description = descriptionBuilder.build();
                        mediaItems.add(new MediaBrowserCompat.MediaItem(description, MediaBrowserCompat.MediaItem.FLAG_PLAYABLE));
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Error parsing queue", e);
                }
            } else {
                Log.d(TAG, "Queue is null");
            }
        }
        
        result.sendResult(mediaItems);
    }
}
