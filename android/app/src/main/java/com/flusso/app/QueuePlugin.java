package com.flusso.app;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "QueuePlugin")
public class QueuePlugin extends Plugin {

    private static QueuePlugin instance;
    private static JSArray currentQueue = new JSArray();
    private static JSArray recentQueue = new JSArray();
    private static JSArray favoritesQueue = new JSArray();
    private static String pendingMediaId = null;

    public static void setPendingMediaId(String mediaId) {
        pendingMediaId = mediaId;
    }

    @PluginMethod
    public void getPendingMediaId(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("mediaId", pendingMediaId);
        call.resolve(ret);
        pendingMediaId = null; // Clear after reading
    }

    public QueuePlugin() {
        super();
        instance = this;
    }

    @Override
    public void load() {
        super.load();
        instance = this;
    }

    public static QueuePlugin getInstance() {
        return instance;
    }

    @PluginMethod
    public void setQueue(PluginCall call) {
        JSArray queue = call.getArray("queue");
        JSArray recent = call.getArray("recent");
        JSArray favorites = call.getArray("favorites");
        
        android.content.SharedPreferences prefs = getContext().getSharedPreferences("QueuePrefs", android.content.Context.MODE_PRIVATE);
        android.content.SharedPreferences.Editor editor = prefs.edit();

        if (queue != null) {
            currentQueue = queue;
            editor.putString("queue", queue.toString());
        }
        if (recent != null) {
            recentQueue = recent;
            editor.putString("recent", recent.toString());
        }
        if (favorites != null) {
            favoritesQueue = favorites;
            editor.putString("favorites", favorites.toString());
        }
        
        editor.apply();
        AndroidAutoService.notifyQueueChanged();
        call.resolve();
    }

    public static JSArray getStaticQueue(android.content.Context context) {
        if (currentQueue.length() == 0 && context != null) {
            try {
                String json = context.getSharedPreferences("QueuePrefs", android.content.Context.MODE_PRIVATE).getString("queue", "[]");
                currentQueue = new JSArray(json);
            } catch (Exception e) {}
        }
        return currentQueue;
    }

    public static JSArray getStaticRecent(android.content.Context context) {
        if (recentQueue.length() == 0 && context != null) {
            try {
                String json = context.getSharedPreferences("QueuePrefs", android.content.Context.MODE_PRIVATE).getString("recent", "[]");
                recentQueue = new JSArray(json);
            } catch (Exception e) {}
        }
        return recentQueue;
    }

    public static JSArray getStaticFavorites(android.content.Context context) {
        if (favoritesQueue.length() == 0 && context != null) {
            try {
                String json = context.getSharedPreferences("QueuePrefs", android.content.Context.MODE_PRIVATE).getString("favorites", "[]");
                favoritesQueue = new JSArray(json);
            } catch (Exception e) {}
        }
        return favoritesQueue;
    }

    @PluginMethod
    public void updateMediaSession(PluginCall call) {
        String title = call.getString("title");
        String artist = call.getString("artist");
        String album = call.getString("album");
        String artwork = call.getString("artwork");
        Double duration = call.getDouble("duration");
        Double position = call.getDouble("position");
        Boolean isPlaying = call.getBoolean("isPlaying");
        
        AndroidAutoService service = AndroidAutoService.getInstance();
        if (service != null) {
            service.updateSessionState(title, artist, album, artwork, duration, position, isPlaying);
        }
        call.resolve();
    }

    public void triggerPlayRequest(String id) {
        JSObject data = new JSObject();
        data.put("id", id);
        notifyListeners("playRequest", data);
    }

    public void triggerActionRequest(String action) {
        JSObject data = new JSObject();
        data.put("action", action);
        notifyListeners("actionRequest", data);
    }
}
