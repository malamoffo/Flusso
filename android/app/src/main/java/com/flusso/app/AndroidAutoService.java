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
import android.support.v4.media.MediaMetadataCompat;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;
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
    private static AndroidAutoService instance;
    private MediaSessionCompat proxySession;
    private boolean isBound = false;

    public static AndroidAutoService getInstance() {
        return instance;
    }

    public static void notifyQueueChanged() {
        if (instance != null) {
            instance.notifyChildrenChanged(QUEUE_ID);
            instance.notifyChildrenChanged(FAVORITES_ID);
        }
    }

    public void updateSessionState(String title, String artist, String album, String artwork, String artworkFilename, Double duration, Double position, Boolean isPlaying) {
        if (proxySession == null) return;

        MediaMetadataCompat.Builder metaBuilder = new MediaMetadataCompat.Builder()
                .putString(MediaMetadataCompat.METADATA_KEY_TITLE, title)
                .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, artist)
                .putString(MediaMetadataCompat.METADATA_KEY_ALBUM, album);

        boolean iconSet = false;
        if (artworkFilename != null && !artworkFilename.isEmpty()) {
            java.io.File imageFile = new java.io.File(this.getFilesDir(), "image_cache/" + artworkFilename);
            if (imageFile.exists()) {
                Uri contentUri = androidx.core.content.FileProvider.getUriForFile(
                        this, 
                        this.getPackageName() + ".fileprovider", 
                        imageFile);
                metaBuilder.putString(MediaMetadataCompat.METADATA_KEY_ALBUM_ART_URI, contentUri.toString());
                iconSet = true;
            }
        }
        
        if (!iconSet && artwork != null && !artwork.isEmpty()) {
            metaBuilder.putString(MediaMetadataCompat.METADATA_KEY_ALBUM_ART_URI, artwork);
        }

        if (duration != null) {
            metaBuilder.putLong(MediaMetadataCompat.METADATA_KEY_DURATION, (long) (duration * 1000));
        }

        proxySession.setMetadata(metaBuilder.build());

        PlaybackStateCompat.Builder stateBuilder = new PlaybackStateCompat.Builder()
                .setActions(PlaybackStateCompat.ACTION_PLAY | PlaybackStateCompat.ACTION_PAUSE |
                        PlaybackStateCompat.ACTION_SKIP_TO_NEXT | PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS |
                        PlaybackStateCompat.ACTION_STOP | PlaybackStateCompat.ACTION_SEEK_TO);

        int state = isPlaying ? PlaybackStateCompat.STATE_PLAYING : PlaybackStateCompat.STATE_PAUSED;
        stateBuilder.setState(state, (long) (position * 1000), 1.0f);
        proxySession.setPlaybackState(stateBuilder.build());
    }

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
                        Log.d(TAG, "Found Capgo MediaSession via reflection.");

                        // REGISTRAZIONE NEL REGISTRY
                        MediaSessionRegistry.getInstance().setSessionToken(mediaSession.getSessionToken());
                        
                        // IMPOSTAZIONE NEL SERVIZIO
                        setSessionToken(mediaSession.getSessionToken());
                        
                        Log.d(TAG, "Token registrato e impostato con successo.");
                    }
                }
            } catch (Exception e) {
                Log.e(TAG, "Errore nel ServiceConnection", e);
            }
        }

        @Override
        public void onServiceDisconnected(ComponentName arg0) {
            isBound = false;
        }
    };

    private JSONObject findTrackById(String id) {
        JSArray[] queues = {
            QueuePlugin.getStaticQueue(this),
            QueuePlugin.getStaticRecent(this),
            QueuePlugin.getStaticFavorites(this)
        };
        for (JSArray queue : queues) {
            if (queue == null) continue;
            for (int i = 0; i < queue.length(); i++) {
                JSONObject item = queue.optJSONObject(i);
                if (item != null && id.equals(item.optString("id"))) {
                    return item;
                }
            }
        }
        return null;
    }

    private void updateProxyMetadata(JSONObject track) {
        if (proxySession == null) return;
        
        MediaMetadataCompat.Builder builder = new MediaMetadataCompat.Builder()
            .putString(MediaMetadataCompat.METADATA_KEY_MEDIA_ID, track.optString("id"))
            .putString(MediaMetadataCompat.METADATA_KEY_TITLE, track.optString("title"))
            .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, track.optString("artist"))
            .putString(MediaMetadataCompat.METADATA_KEY_ALBUM, track.optString("album"));
        
        String artwork = track.optString("artwork");
        String artworkFilename = track.optString("artworkFilename");
        
        boolean iconSet = false;
        if (artworkFilename != null && !artworkFilename.isEmpty()) {
            java.io.File imageFile = new java.io.File(this.getFilesDir(), "image_cache/" + artworkFilename);
            if (imageFile.exists()) {
                Uri contentUri = androidx.core.content.FileProvider.getUriForFile(
                        this, 
                        this.getPackageName() + ".fileprovider", 
                        imageFile);
                builder.putString(MediaMetadataCompat.METADATA_KEY_ALBUM_ART_URI, contentUri.toString());
                iconSet = true;
            }
        }
        
        if (!iconSet && artwork != null && !artwork.isEmpty()) {
            builder.putString(MediaMetadataCompat.METADATA_KEY_ALBUM_ART_URI, artwork);
        }
        
        long duration = track.optLong("duration", 0);
        if (duration > 0) {
            builder.putLong(MediaMetadataCompat.METADATA_KEY_DURATION, duration * 1000);
        }
        
        proxySession.setMetadata(builder.build());
        proxySession.setPlaybackState(new PlaybackStateCompat.Builder()
            .setActions(PlaybackStateCompat.ACTION_PLAY | PlaybackStateCompat.ACTION_PAUSE | PlaybackStateCompat.ACTION_SKIP_TO_NEXT | PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS | PlaybackStateCompat.ACTION_SEEK_TO)
            .setState(PlaybackStateCompat.STATE_BUFFERING, 0, 1.0f)
            .build());
    }

    private void startAppWithMediaId(String mediaId) {
        QueuePlugin.setPendingMediaId(mediaId);
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        intent.putExtra("play_media_id", mediaId);
        try {
            startActivity(intent);
        } catch (Exception e) {
            Log.e(TAG, "Failed to start activity", e);
        }
    }

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
        Log.d(TAG, "onCreate - Inizializzazione servizio Android Auto via Registry");
        
        // 1. Otenzione Token tramite Registry
        MediaSessionCompat.Token token = MediaSessionRegistry.getInstance().getSessionToken();
        
        if (token != null) {
            setSessionToken(token);
            Log.d(TAG, "Token caricato dal Registry");
        } else {
            // 2. Logic Robust Cold Start:
            // Se non c'è token, l'auto è partita prima della app. Forza avvio app.
            Log.w(TAG, "Token non disponibile. Avvio MainActivity...");
            Intent intent = new Intent(this, MainActivity.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            startActivity(intent);
        }
    }

    @Override
    public void onDestroy() {
        Log.d(TAG, "onDestroy - Pulizia risorse");
        instance = null;
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
        Bundle extras = new Bundle();
        extras.putBoolean(BrowserRoot.EXTRA_RECENT, true);
        extras.putBoolean(BrowserRoot.EXTRA_OFFLINE, true);
        extras.putBoolean(BrowserRoot.EXTRA_SUGGESTED, true);
        return new BrowserRoot(ROOT_ID, extras);
    }

    @Override
    public void onLoadChildren(@NonNull final String parentId, @NonNull final Result<List<MediaBrowserCompat.MediaItem>> result) {
        Log.d(TAG, "onLoadChildren: " + parentId);
        result.detach();
        
        new Thread(new Runnable() {
            @Override
            public void run() {
                List<MediaBrowserCompat.MediaItem> mediaItems = new ArrayList<>();

                if (ROOT_ID.equals(parentId)) {
                    // Add folders at the root
                    mediaItems.add(new MediaBrowserCompat.MediaItem(
                            new MediaDescriptionCompat.Builder()
                                    .setMediaId(QUEUE_ID)
                                    .setTitle("In riproduzione")
                                    .setSubtitle("L'episodio in riproduzione")
                                    .build(), 
                            MediaBrowserCompat.MediaItem.FLAG_BROWSABLE));
                            
                    mediaItems.add(new MediaBrowserCompat.MediaItem(
                            new MediaDescriptionCompat.Builder()
                                    .setMediaId(FAVORITES_ID)
                                    .setTitle("Preferiti")
                                    .setSubtitle("I tuoi episodi preferiti")
                                    .build(), 
                            MediaBrowserCompat.MediaItem.FLAG_BROWSABLE));
                } else if (QUEUE_ID.equals(parentId) || FAVORITES_ID.equals(parentId)) {
                    // Fetch queue or favorites from our custom plugin using the static method
                    JSArray itemsArray = QUEUE_ID.equals(parentId) ? 
                        QueuePlugin.getStaticQueue(AndroidAutoService.this) : 
                        QueuePlugin.getStaticFavorites(AndroidAutoService.this);
                    
                    if (itemsArray != null) {
                        Log.d(TAG, "Items size for " + parentId + ": " + itemsArray.length());
                        try {
                            for (int i = 0; i < itemsArray.length(); i++) {
                                JSONObject item = itemsArray.getJSONObject(i);
                                String id = item.optString("id");
                                if (id == null || id.isEmpty()) {
                                    id = "unknown_" + i;
                                }
                                String title = item.optString("title");
                                if (title == null || title.isEmpty()) {
                                    title = "Sconosciuto";
                                }
                                String subtitle = item.optString("artist"); // Use artist for subtitle
                                String imageUrl = item.optString("artwork"); // Use artwork for icon
                                String artworkFilename = item.optString("artworkFilename");

                                MediaDescriptionCompat.Builder descriptionBuilder = new MediaDescriptionCompat.Builder()
                                        .setMediaId(id)
                                        .setTitle(title)
                                        .setSubtitle(subtitle);

                                boolean iconSet = false;
                                if (artworkFilename != null && !artworkFilename.isEmpty()) {
                                    java.io.File imageFile = new java.io.File(AndroidAutoService.this.getFilesDir(), "image_cache/" + artworkFilename);
                                    if (imageFile.exists()) {
                                        Uri contentUri = androidx.core.content.FileProvider.getUriForFile(
                                                AndroidAutoService.this, 
                                                AndroidAutoService.this.getPackageName() + ".fileprovider", 
                                                imageFile);
                                        descriptionBuilder.setIconUri(contentUri);
                                        iconSet = true;
                                    }
                                }
                                
                                if (!iconSet && imageUrl != null && !imageUrl.isEmpty()) {
                                    descriptionBuilder.setIconUri(Uri.parse(imageUrl));
                                }
                                
                                MediaDescriptionCompat description = descriptionBuilder.build();
                                mediaItems.add(new MediaBrowserCompat.MediaItem(description, MediaBrowserCompat.MediaItem.FLAG_PLAYABLE));
                            }
                        } catch (Exception e) {
                            Log.e(TAG, "Error parsing items for " + parentId, e);
                        }
                    } else {
                        Log.d(TAG, "Items array is null for " + parentId);
                    }
                }
                
                result.sendResult(mediaItems);
            }
        }).start();
    }

    @Override
    public void onLoadChildren(@NonNull String parentId, @NonNull Result<List<MediaBrowserCompat.MediaItem>> result, @NonNull Bundle options) {
        // Android Auto sometimes calls this version
        onLoadChildren(parentId, result);
    }

    @Override
    public void onSearch(@NonNull String query, Bundle extras, @NonNull Result<List<MediaBrowserCompat.MediaItem>> result) {
        result.sendResult(new ArrayList<>());
    }
}
