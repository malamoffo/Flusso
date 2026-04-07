package com.flusso.app;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.os.IBinder;
import android.util.Log;

import androidx.media3.common.MediaItem;
import androidx.media3.common.MediaMetadata;
import androidx.media3.common.Player;
import androidx.media3.session.MediaController;
import androidx.media3.session.SessionToken;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.google.common.util.concurrent.ListenableFuture;
import com.google.common.util.concurrent.MoreExecutors;

@CapacitorPlugin(name = "Media3")
public class Media3Plugin extends Plugin {

    private static final String TAG = "Media3Plugin";
    private MediaController mediaController;
    private ListenableFuture<MediaController> controllerFuture;

    @Override
    public void load() {
        super.load();
        Log.d(TAG, "Media3Plugin loaded");
        initializeController();
    }

    private void initializeController() {
        Context context = getContext();
        SessionToken sessionToken = new SessionToken(context, new ComponentName(context, Media3Service.class));
        controllerFuture = new MediaController.Builder(context, sessionToken).buildAsync();
        controllerFuture.addListener(() -> {
            try {
                mediaController = controllerFuture.get();
                mediaController.addListener(new Player.Listener() {
                    @Override
                    public void onIsPlayingChanged(boolean isPlaying) {
                        notifyStateChange();
                    }

                    @Override
                    public void onPlaybackStateChanged(int playbackState) {
                        notifyStateChange();
                    }
                    
                    @Override
                    public void onPositionDiscontinuity(Player.PositionInfo oldPosition, Player.PositionInfo newPosition, int reason) {
                        notifyStateChange();
                    }
                });
            } catch (Exception e) {
                Log.e(TAG, "Failed to initialize MediaController", e);
            }
        }, MoreExecutors.directExecutor());
    }

    private void notifyStateChange() {
        if (mediaController == null) return;
        JSObject ret = new JSObject();
        ret.put("isPlaying", mediaController.isPlaying());
        ret.put("position", mediaController.getCurrentPosition());
        ret.put("duration", mediaController.getDuration());
        
        MediaItem currentItem = mediaController.getCurrentMediaItem();
        if (currentItem != null) {
            ret.put("id", currentItem.mediaId);
        } else {
            ret.put("id", "");
        }
        notifyListeners("onStateChanged", ret);
    }

    @PluginMethod
    public void play(PluginCall call) {
        String url = call.getString("url");
        String title = call.getString("title", "Unknown Title");
        String artist = call.getString("artist", "Unknown Artist");
        String albumArt = call.getString("albumArt", "");
        String id = call.getString("id", url);

        if (url == null) {
            call.reject("Must provide an url");
            return;
        }

        if (mediaController == null) {
            call.reject("MediaController not initialized");
            return;
        }

        getActivity().runOnUiThread(() -> {
            MediaMetadata metadata = new MediaMetadata.Builder()
                    .setTitle(title)
                    .setArtist(artist)
                    .setArtworkUri(android.net.Uri.parse(albumArt))
                    .build();

            MediaItem mediaItem = new MediaItem.Builder()
                    .setMediaId(id)
                    .setUri(url)
                    .setMediaMetadata(metadata)
                    .build();

            mediaController.setMediaItem(mediaItem);
            mediaController.prepare();
            mediaController.play();
            call.resolve();
        });
    }

    @PluginMethod
    public void pause(PluginCall call) {
        if (mediaController != null) {
            getActivity().runOnUiThread(() -> {
                mediaController.pause();
                call.resolve();
            });
        } else {
            call.reject("MediaController not initialized");
        }
    }

    @PluginMethod
    public void resume(PluginCall call) {
        if (mediaController != null) {
            getActivity().runOnUiThread(() -> {
                mediaController.play();
                call.resolve();
            });
        } else {
            call.reject("MediaController not initialized");
        }
    }

    @PluginMethod
    public void seekTo(PluginCall call) {
        Integer position = call.getInt("position");
        if (position == null) {
            call.reject("Must provide position");
            return;
        }
        if (mediaController != null) {
            getActivity().runOnUiThread(() -> {
                mediaController.seekTo(position);
                call.resolve();
            });
        } else {
            call.reject("MediaController not initialized");
        }
    }

    @PluginMethod
    public void skipForward(PluginCall call) {
        if (mediaController != null) {
            getActivity().runOnUiThread(() -> {
                long pos = mediaController.getCurrentPosition();
                mediaController.seekTo(pos + 15000);
                call.resolve();
            });
        } else {
            call.reject("MediaController not initialized");
        }
    }

    @PluginMethod
    public void skipBackward(PluginCall call) {
        if (mediaController != null) {
            getActivity().runOnUiThread(() -> {
                long pos = mediaController.getCurrentPosition();
                mediaController.seekTo(Math.max(0, pos - 15000));
                call.resolve();
            });
        } else {
            call.reject("MediaController not initialized");
        }
    }

    @PluginMethod
    public void setPlaybackRate(PluginCall call) {
        Float rate = call.getFloat("rate");
        if (rate == null) {
            call.reject("Must provide rate");
            return;
        }
        if (mediaController != null) {
            getActivity().runOnUiThread(() -> {
                mediaController.setPlaybackParameters(new androidx.media3.common.PlaybackParameters(rate));
                call.resolve();
            });
        } else {
            call.reject("MediaController not initialized");
        }
    }
    
    @Override
    protected void handleOnDestroy() {
        super.handleOnDestroy();
        if (controllerFuture != null) {
            MediaController.releaseFuture(controllerFuture);
        }
    }
}
