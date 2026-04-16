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

    private static void saveToFile(android.content.Context context, String filename, String content) {
        if (context == null) return;
        try {
            java.io.FileOutputStream fos = context.openFileOutput(filename, android.content.Context.MODE_PRIVATE);
            fos.write(content.getBytes());
            fos.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static String readFromFile(android.content.Context context, String filename) {
        if (context == null) return "[]";
        try {
            java.io.File file = new java.io.File(context.getFilesDir(), filename);
            if (!file.exists()) return "[]";
            java.io.FileInputStream fis = context.openFileInput(filename);
            byte[] bytes = new byte[(int) file.length()];
            fis.read(bytes);
            fis.close();
            return new String(bytes);
        } catch (Exception e) {
            e.printStackTrace();
            return "[]";
        }
    }

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
        if (queue != null) {
            currentQueue = queue;
            saveToFile(getContext(), "queue.json", queue.toString());
        }
        if (recent != null) {
            recentQueue = recent;
            saveToFile(getContext(), "recent.json", recent.toString());
        }
        if (favorites != null) {
            favoritesQueue = favorites;
            saveToFile(getContext(), "favorites.json", favorites.toString());
        }
        
        AndroidAutoService.notifyQueueChanged();
        call.resolve();
    }

    public static JSArray getStaticQueue(android.content.Context context) {
        if (currentQueue.length() == 0 && context != null) {
            try {
                String json = readFromFile(context, "queue.json");
                currentQueue = new JSArray(json);
            } catch (Exception e) {}
        }
        return currentQueue;
    }

    public static JSArray getStaticRecent(android.content.Context context) {
        if (recentQueue.length() == 0 && context != null) {
            try {
                String json = readFromFile(context, "recent.json");
                recentQueue = new JSArray(json);
            } catch (Exception e) {}
        }
        return recentQueue;
    }

    public static JSArray getStaticFavorites(android.content.Context context) {
        if (favoritesQueue.length() == 0 && context != null) {
            try {
                String json = readFromFile(context, "favorites.json");
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
        String artworkFilename = call.getString("artworkFilename");
        Double duration = call.getDouble("duration");
        Double position = call.getDouble("position");
        Boolean isPlaying = call.getBoolean("isPlaying");
        
        AndroidAutoService service = AndroidAutoService.getInstance();
        if (service != null) {
            service.updateSessionState(title, artist, album, artwork, artworkFilename, duration, position, isPlaying);
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
