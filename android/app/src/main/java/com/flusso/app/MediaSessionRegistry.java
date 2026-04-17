package com.flusso.app;

import android.support.v4.media.session.MediaSessionCompat;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Singleton thread-safe per il bridge tra Plugin Capacitor e AndroidAutoService.
 * Elimina la necessità di ricorrere alla Reflection per recuperare la sessione.
 */
public class MediaSessionRegistry {
    private static final MediaSessionRegistry instance = new MediaSessionRegistry();
    private final AtomicReference<MediaSessionCompat.Token> sessionToken = new AtomicReference<>();
    
    private MediaSessionRegistry() {}

    public static MediaSessionRegistry getInstance() {
        return instance;
    }

    public void setSessionToken(MediaSessionCompat.Token token) {
        this.sessionToken.set(token);
    }

    public MediaSessionCompat.Token getSessionToken() {
        return this.sessionToken.get();
    }
}
