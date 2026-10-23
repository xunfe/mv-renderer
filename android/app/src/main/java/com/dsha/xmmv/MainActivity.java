package com.dsha.xmmv;

import java.io.File;
import java.io.InputStream;

import android.app.Activity;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.OpenableColumns;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;

public class MainActivity extends Activity {

    private static final int REQ_ZIP = 1001;
    private static final int REQ_AUDIO = 1002;
    private String pendingAudioId = "world-execute";
    private WebView web;
    private AssetServer server;
    private int port = 0;

    private class Bridge {
        @JavascriptInterface
        public String mode() { return "app"; }

        @JavascriptInterface
        public void openExternal(final String url) {
            try {
                Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(i);
            } catch (Exception e) {
                Toast.makeText(MainActivity.this, "打不开链接", Toast.LENGTH_SHORT).show();
            }
        }

        @JavascriptInterface
        public void pickAudio(final String id) {
            runOnUiThread(new Runnable() {
                public void run() {
                    Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                    i.addCategory(Intent.CATEGORY_OPENABLE);
                    i.setType("audio/*");
                    pendingAudioId = id == null ? "world-execute" : id;
                    try {
                        startActivityForResult(i, REQ_AUDIO);
                    } catch (Exception e) {
                        Toast.makeText(MainActivity.this, "打不开文件选择器", Toast.LENGTH_SHORT).show();
                    }
                }
            });
        }

        @JavascriptInterface
        public void pickZip() {
            runOnUiThread(new Runnable() {
                public void run() {
                    Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                    i.addCategory(Intent.CATEGORY_OPENABLE);
                    i.setType("*/*");
                    i.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{"application/zip", "application/x-zip-compressed"});
                    try {
                        startActivityForResult(i, REQ_ZIP);
                    } catch (Exception e) {
                        Toast.makeText(MainActivity.this, "打不开文件选择器", Toast.LENGTH_SHORT).show();
                    }
                }
            });
        }
    }

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        if (Build.VERSION.SDK_INT >= 28) {
            getWindow().getAttributes().layoutInDisplayCutoutMode =
                    WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
        }

        FrameLayout rootView = new FrameLayout(this);
        web = new WebView(this);
        web.setBackgroundColor(0xFF050505);
        rootView.addView(web, new FrameLayout.LayoutParams(-1, -1));
        setContentView(rootView);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setCacheMode(WebSettings.LOAD_NO_CACHE);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);

        web.addJavascriptInterface(new Bridge(), "XmApp");
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView v, String url) {
                injectMenu();
            }
        });
        web.setLayerType(View.LAYER_TYPE_HARDWARE, null);

        try {
            server = new AssetServer(this);
            port = server.start();
            web.loadUrl("http://127.0.0.1:" + port + "/home.html");
        } catch (Exception e) {
            e.printStackTrace();
            web.loadData("<h1 style='color:#f66;font-family:monospace'>本地服务器启动失败</h1>", "text/html", "utf-8");
        }

        hideSystemUi();
    }

    /** 每个页面注入一个左上角返回按钮（回到选择页）。 */
    private void injectMenu() {
        String js = "(function(){" +
                "if(location.pathname==='/home.html')return;" +
                "if(document.getElementById('__menubtn'))return;" +
                "var b=document.createElement('button');" +
                "b.id='__menubtn';b.textContent='\u2630';" +
                "b.style.cssText='position:fixed;left:12px;top:12px;z-index:99998;width:40px;height:40px;" +
                "border-radius:20px;border:1px solid #ff4d12;background:#000c;color:#ff4d12;" +
                "font:18px/1 ui-monospace,monospace;cursor:pointer';" +
                "b.onclick=function(){location.href='http://127.0.0.1:" + port + "/home.html'};" +
                "document.body.appendChild(b);" +
                "})();";
        web.evaluateJavascript(js, null);
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        super.onActivityResult(req, res, data);
        if (req == REQ_AUDIO) {
            if (res != RESULT_OK || data == null || data.getData() == null) return;
            try {
                Uri u = data.getData();
                String name = "audio.bin";
                Cursor c = getContentResolver().query(u, null, null, null, null);
                if (c != null) {
                    int idx = c.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                    if (c.moveToFirst() && idx >= 0) name = c.getString(idx);
                    c.close();
                }
                String ext = name.contains(".") ? name.substring(name.lastIndexOf('.')) : ".bin";
                File dir = new File(getFilesDir(), "audio");
                dir.mkdirs();
                File[] olds = dir.listFiles();
                if (olds != null) for (File f : olds) if (f.getName().startsWith(pendingAudioId + ".")) f.delete();
                File dst = new File(dir, pendingAudioId + ext);
                InputStream in = getContentResolver().openInputStream(u);
                java.io.FileOutputStream fo = new java.io.FileOutputStream(dst);
                byte[] buf = new byte[65536];
                int n;
                while ((n = in.read(buf)) > 0) fo.write(buf, 0, n);
                in.close();
                fo.close();
                Toast.makeText(this, "音频已替换：" + name, Toast.LENGTH_LONG).show();
                web.evaluateJavascript("window.__onImport && window.__onImport('ok:audio')", null);
            } catch (Exception e) {
                e.printStackTrace();
                Toast.makeText(this, "替换失败：" + e.getMessage(), Toast.LENGTH_LONG).show();
            }
            return;
        }
        if (req != REQ_ZIP || res != RESULT_OK || data == null || data.getData() == null) return;
        Uri uri = data.getData();
        String name = "imported.zip";
        try {
            Cursor c = getContentResolver().query(uri, null, null, null, null);
            if (c != null) {
                int idx = c.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                if (c.moveToFirst() && idx >= 0) name = c.getString(idx);
                c.close();
            }
            InputStream in = getContentResolver().openInputStream(uri);
            final String id = server.importZip(in, name);
            final String msg = id != null ? ("ok:" + id) : "err:包里没有 index.html";
            runOnUiThread(new Runnable() {
                public void run() {
                    if (id == null) Toast.makeText(MainActivity.this, "导入失败：包里找不到 index.html", Toast.LENGTH_LONG).show();
                    web.evaluateJavascript("window.__onImport && window.__onImport('" + msg + "')", null);
                }
            });
        } catch (Exception e) {
            e.printStackTrace();
            Toast.makeText(this, "导入失败：" + e.getMessage(), Toast.LENGTH_LONG).show();
        }
    }

    private void hideSystemUi() {
        View d = getWindow().getDecorView();
        d.setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
    }

    @Override
    public void onWindowFocusChanged(boolean has) {
        super.onWindowFocusChanged(has);
        if (has) hideSystemUi();
    }

    @Override
    public void onBackPressed() {
        if (web != null && web.canGoBack()) {
            web.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        if (server != null) server.stop();
        if (web != null) {
            web.loadUrl("about:blank");
            web.destroy();
        }
        super.onDestroy();
    }
}
