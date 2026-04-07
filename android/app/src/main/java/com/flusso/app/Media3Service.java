package com.flusso.app;

import android.content.Intent;
import androidx.media3.common.Player;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.session.MediaLibraryService;
import androidx.media3.session.MediaSession;
import androidx.media3.session.LibraryResult;
import com.google.common.util.concurrent.ListenableFuture;
import com.google.common.util.concurrent.Futures;
import androidx.media3.common.MediaItem;
import java.util.List;
import com.google.common.collect.ImmutableList;

public class Media3Service extends MediaLibraryService {

    private MediaLibrarySession mediaLibrarySession;
    private ExoPlayer player;

    @Override
    public void onCreate() {
        super.onCreate();
        player = new ExoPlayer.Builder(this).build();
        
        MediaLibrarySession.Callback callback = new MediaLibrarySession.Callback() {
            @Override
            public ListenableFuture<LibraryResult<MediaItem>> onGetLibraryRoot(MediaLibrarySession session, MediaSession.ControllerInfo browser, LibraryParams params) {
                return Futures.immediateFuture(LibraryResult.ofItem(
                        new MediaItem.Builder().setMediaId("root").build(), params));
            }

            @Override
            public ListenableFuture<LibraryResult<ImmutableList<MediaItem>>> onGetChildren(MediaLibrarySession session, MediaSession.ControllerInfo browser, String parentId, int page, int pageSize, LibraryParams params) {
                return Futures.immediateFuture(LibraryResult.ofItemList(ImmutableList.of(), params));
            }
        };

        mediaLibrarySession = new MediaLibrarySession.Builder(this, player, callback).build();
    }

    @Override
    public MediaLibrarySession onGetSession(MediaSession.ControllerInfo controllerInfo) {
        return mediaLibrarySession;
    }

    @Override
    public void onDestroy() {
        if (mediaLibrarySession != null) {
            mediaLibrarySession.release();
            mediaLibrarySession = null;
        }
        if (player != null) {
            player.release();
            player = null;
        }
        super.onDestroy();
    }
}
