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
        }
        if (recent != null) {
            recentQueue = recent;
        }
        if (favorites != null) {
            favoritesQueue = favorites;
        }
        
        call.resolve();
    }

    public static JSArray getStaticQueue() {
        return currentQueue;
    }

    public static JSArray getStaticRecent() {
        return recentQueue;
    }

    public static JSArray getStaticFavorites() {
        return favoritesQueue;
    }

    public void triggerPlayRequest(String id) {
        JSObject data = new JSObject();
        data.put("id", id);
        notifyListeners("playRequest", data);
    }
}
