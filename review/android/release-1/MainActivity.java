package com.lochlans.pipspots;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.MutableContextWrapper;
import android.media.AudioManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.window.OnBackInvokedCallback;
import android.window.OnBackInvokedDispatcher;
import android.webkit.*;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

/**
 * Pip's Pots wrapper. Background behaviour (0.12.7):
 *  - onPause: the page is told it is in the background (window.__pipLifecycle.pause(), which
 *    suspends the AudioContext and stands the game still), then WebView.onPause() and
 *    pauseTimers(). Audio focus is given back. onResume undoes all of it, in reverse.
 *  - There is only ever one WebView and one page. The WebView outlives the Activity (it is kept
 *    in a static and re-parented), so if Android destroys and recreates the Activity while the app
 *    is in the background, the player comes back to the same game in the same state, and no
 *    orphaned page is left playing music behind a new one.
 *  - launchMode singleTask plus the task-root check stop a second Activity (and a second page)
 *    being stacked on top when the app is reopened from the launcher.
 *  - If the whole process was killed and Android restores the app, the page is loaded with
 *    ?resume=1 and reopens the game the player was in.
 *
 * release-1 (1.0.0) hardening:
 *  - Only https://appassets.androidplatform.net/www/... is ever loaded; any other navigation is
 *    refused (shouldOverrideUrlLoading), there is no file or content access, and the app has no
 *    INTERNET permission at all.
 *  - Edge to edge with the system bars hidden (WindowInsetsController on API 30+), drawing into the
 *    display cut-out; the page keeps its buttons out of it with env(safe-area-inset-*).
 *  - Back does nothing (toddler-safe): a stray Back press can't drop the child out of the game. The
 *    grown-up way out is the in-game home button (a 3 s hold) or the system Home gesture.
 */
public class MainActivity extends Activity implements AudioManager.OnAudioFocusChangeListener {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String START = "https://" + HOST + "/www/index.html";
    /** The one page. Survives Activity recreation; destroyed only when the app really finishes. */
    private static WebView sWeb;
    private static MutableContextWrapper sCtx;
    private WebView web;
    private AudioManager am;
    private boolean resumed;

    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        // Reopened from the launcher while a Pip's Pots task is already running (the classic
        // "opened from the installer, then from the icon" case): don't stack a second copy.
        if (!isTaskRoot()) {
            Intent i = getIntent();
            if (i != null && i.hasCategory(Intent.CATEGORY_LAUNCHER) && Intent.ACTION_MAIN.equals(i.getAction())) {
                finish();
                return;
            }
        }
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON | WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED);
        swallowBack();
        am = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        if (sWeb != null) {
            // Same page as before: just hand it to this Activity.
            sCtx.setBaseContext(this);
            web = sWeb;
            ViewGroup parent = (ViewGroup) web.getParent();
            if (parent != null) parent.removeView(web);
            setContentView(web);
            hideBars();
            return;
        }
        sCtx = new MutableContextWrapper(this);
        web = new WebView(sCtx);
        sWeb = web;
        web.setLayerType(View.LAYER_TYPE_HARDWARE, null);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setGeolocationEnabled(false);
        s.setSupportMultipleWindows(false);
        s.setJavaScriptCanOpenWindowsAutomatically(false);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        web.setWebChromeClient(new WebChromeClient());
        final Context assetsCtx = getApplicationContext();
        web.setWebViewClient(new WebViewClient() {
            /** Never leave the app: only our own pages may load in the WebView; nothing opens outside. */
            @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                return !("https".equals(u.getScheme()) && HOST.equals(u.getHost()));
            }

            @Override public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                // Anything not ours gets an empty 404 here, so no request ever reaches the network.
                if (!HOST.equals(u.getHost())) return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", null, null);
                String path = u.getPath();
                if (path == null || path.equals("/") || path.equals("/www/")) path = "/www/index.html";
                if (path.contains("..") || !path.startsWith("/www/")) return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", null, null);
                try {
                    InputStream in = assetsCtx.getAssets().open(path.substring(1));
                    Map<String, String> h = new HashMap<>();
                    h.put("Access-Control-Allow-Origin", "*");
                    h.put("Cache-Control", "no-cache");
                    return new WebResourceResponse(mime(path), mime(path).startsWith("text") || path.endsWith(".js") ? "utf-8" : null, 200, "OK", h, in);
                } catch (Exception e) {
                    return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", null, null);
                }
            }
        });
        setContentView(web);
        hideBars();
        // b != null: Android closed the app in the background and is restoring it. Go back to the
        // game the player was in (the page saved it when it went to the background).
        web.loadUrl(b != null ? START + "?resume=1" : START);
    }

    private static String mime(String p) {
        p = p.toLowerCase();
        if (p.endsWith(".html")) return "text/html";
        if (p.endsWith(".js") || p.endsWith(".mjs")) return "application/javascript";
        if (p.endsWith(".css")) return "text/css";
        if (p.endsWith(".svg")) return "image/svg+xml";
        if (p.endsWith(".png")) return "image/png";
        if (p.endsWith(".jpg") || p.endsWith(".jpeg")) return "image/jpeg";
        if (p.endsWith(".webp")) return "image/webp";
        if (p.endsWith(".json")) return "application/json";
        if (p.endsWith(".wasm")) return "application/wasm";
        if (p.endsWith(".mp3")) return "audio/mpeg";
        if (p.endsWith(".ogg")) return "audio/ogg";
        if (p.endsWith(".txt")) return "text/plain";
        return "application/octet-stream";
    }

    /** Full screen, edge to edge: system bars hidden, a swipe shows them briefly. */
    @SuppressWarnings("deprecation")
    private void hideBars() {
        if (Build.VERSION.SDK_INT >= 30) {
            getWindow().setDecorFitsSystemWindows(false);
            WindowInsetsController c = getWindow().getInsetsController();
            if (c != null) {
                c.hide(WindowInsets.Type.systemBars());
                c.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);
        }
    }

    /** Back does nothing (API 33+: a registered no-op callback; older: onBackPressed below). */
    private OnBackInvokedCallback backSink;

    private void swallowBack() {
        if (Build.VERSION.SDK_INT >= 33 && backSink == null) {
            backSink = () -> { /* toddler-safe: ignore Back */ };
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(OnBackInvokedDispatcher.PRIORITY_DEFAULT, backSink);
        }
    }

    private void js(String call) {
        if (web != null) web.evaluateJavascript("window.__pipLifecycle && window.__pipLifecycle." + call + "();", null);
    }

    /** Page to the background: silence and stand still first, then freeze the WebView. */
    private void pausePage() {
        if (web == null) return;
        final WebView w = web;
        w.evaluateJavascript("window.__pipLifecycle && window.__pipLifecycle.pause();", v -> {
            // Still in the background once the page has suspended its audio: freeze timers too.
            if (!resumed && w == sWeb) w.pauseTimers();
        });
        w.onPause();
    }

    private void resumePage() {
        if (web == null) return;
        web.resumeTimers();
        web.onResume();
        js("resume");
    }

    @Override public void onWindowFocusChanged(boolean f) { super.onWindowFocusChanged(f); if (f) hideBars(); }

    @Override protected void onPause() {
        resumed = false;
        pausePage();
        if (am != null) am.abandonAudioFocus(this);
        super.onPause();
    }

    @Override protected void onResume() {
        super.onResume();
        resumed = true;
        if (am != null) am.requestAudioFocus(this, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN);
        resumePage();
    }

    /** A phone call or another app's sound took over: go quiet; carry on when it hands back. */
    @Override public void onAudioFocusChange(int change) {
        if (change == AudioManager.AUDIOFOCUS_LOSS || change == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT) js("pause");
        else if (change == AudioManager.AUDIOFOCUS_GAIN && resumed) js("resume");
    }

    @Override protected void onDestroy() {
        if (web != null && web == sWeb) {
            ViewGroup parent = (ViewGroup) web.getParent();
            if (parent != null) parent.removeView(web);
            if (isFinishing()) {
                // Really closing: tear the page down so nothing (music included) outlives the app.
                web.resumeTimers();
                web.loadUrl("about:blank");
                web.destroy();
                sWeb = null;
                sCtx = null;
            } else {
                // Android is recreating the Activity: keep the page, off this Activity's context.
                sCtx.setBaseContext(getApplicationContext());
            }
        }
        if (Build.VERSION.SDK_INT >= 33 && backSink != null) {
            getOnBackInvokedDispatcher().unregisterOnBackInvokedCallback(backSink);
            backSink = null;
        }
        web = null;
        super.onDestroy();
    }

    /** Before API 33 (and as a fallback): Back does nothing. */
    @SuppressWarnings("deprecation")
    @Override public void onBackPressed() { /* toddler-safe: ignore Back */ }
}
