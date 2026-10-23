package com.dsha.xmmv;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import android.content.ContentValues;
import android.content.Context;
import android.content.res.AssetManager;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;

/**
 * 极简本地 HTTP 服务器，把内置资源与用户导入的 MV 一起当成网站根目录。
 *
 *   /                 -> assets/www      （P(doom) MV，默认）
 *   /engine/...       -> assets/engine   （引擎演示 demo-a / demo-b / 3d）
 *   /custom/<id>/...  -> filesDir/mv/<id>/（导入的 MV）
 *
 * 另外：
 *   POST /__rec?name=...  录制结果落盘到系统下载目录
 *   GET  /__imports       已导入的 MV 列表（JSON）
 *   POST /__delete?id=    删除一个导入的 MV
 *   POST /__import?name=  上传 zip 并解压（备用通道）
 */
public class AssetServer {

    private final Context ctx;
    private final AssetManager am;
    private ServerSocket ss;
    private Thread thread;
    private volatile boolean running = true;

    AssetServer(Context ctx) {
        this.ctx = ctx;
        this.am = ctx.getAssets();
    }

    File mvRoot() {
        File f = new File(ctx.getFilesDir(), "mv");
        if (!f.exists()) f.mkdirs();
        return f;
    }

    int start() throws IOException {
        ss = new ServerSocket(0, 16, InetAddress.getByName("127.0.0.1"));
        thread = new Thread(new Runnable() {
            public void run() {
                while (running) {
                    try {
                        final Socket s = ss.accept();
                        new Thread(new Runnable() {
                            public void run() { handle(s); }
                        }).start();
                    } catch (IOException e) {
                        if (running) e.printStackTrace();
                    }
                }
            }
        }, "asset-server");
        thread.setDaemon(true);
        thread.start();
        return ss.getLocalPort();
    }

    void stop() {
        running = false;
        try { if (ss != null) ss.close(); } catch (IOException ignored) {}
    }

    private static String mime(String p) {
        String x = p.toLowerCase(Locale.US);
        if (x.endsWith(".html")) return "text/html; charset=utf-8";
        if (x.endsWith(".js") || x.endsWith(".mjs")) return "text/javascript; charset=utf-8";
        if (x.endsWith(".css")) return "text/css; charset=utf-8";
        if (x.endsWith(".json")) return "application/json";
        if (x.endsWith(".mp3")) return "audio/mpeg";
        if (x.endsWith(".m4a")) return "audio/mp4";
        if (x.endsWith(".flac")) return "audio/flac";
        if (x.endsWith(".wav")) return "audio/wav";
        if (x.endsWith(".ogg")) return "audio/ogg";
        if (x.endsWith(".mp4")) return "video/mp4";
        if (x.endsWith(".png")) return "image/png";
        if (x.endsWith(".jpg") || x.endsWith(".jpeg")) return "image/jpeg";
        if (x.endsWith(".webp")) return "image/webp";
        if (x.endsWith(".svg")) return "image/svg+xml";
        if (x.endsWith(".woff2")) return "font/woff2";
        if (x.endsWith(".woff")) return "font/woff";
        if (x.endsWith(".ttf")) return "font/ttf";
        if (x.endsWith(".otf")) return "font/otf";
        return "application/octet-stream";
    }

    // ---- 路径解析：返回 null 表示越权/非法 ----
    private byte[] readPath(String path) throws IOException {
        if (path.startsWith("/custom/")) {
            String[] parts = path.substring(8).split("/", 2);
            String id = parts[0];
            if (!id.matches("[A-Za-z0-9._-]+")) return null;
            String rel = parts.length > 1 ? parts[1] : "index.html";
            if (rel.isEmpty() || rel.endsWith("/")) rel = rel + "index.html";
            File base = new File(mvRoot(), id).getCanonicalFile();
            File f = new File(base, rel).getCanonicalFile();
            if (!f.getPath().startsWith(base.getPath())) return null; // 目录穿越
            if (!f.isFile()) throw new IOException("missing " + rel);
            return readFile(f);
        }
        if (path.startsWith("/execute/")) {
            // 用户自己提供的音频优先（他们自己拥有录音的场合）
            if (path.equals("/execute/song.m4a")) {
                File ua = userAudio("world-execute");
                if (ua != null) return readFile(ua);
            }
            return readAsset("execute/" + path.substring(9));
        }
        if (path.startsWith("/engine/")) {
            return readAsset("engine/" + path.substring(8));
        }
        return readAsset("www" + (path.equals("/") ? "/index.html" : path));
    }

    private void handle(Socket s) {
        try {
            s.setSoTimeout(60000);
            InputStream in = s.getInputStream();
            OutputStream out = s.getOutputStream();

            StringBuilder head = new StringBuilder();
            int c, nl = 0;
            while ((c = in.read()) != -1) {
                head.append((char) c);
                if (c == '\n') { nl++; if (nl >= 2) break; } else if (c != '\r') nl = 0;
                if (head.length() > 32768) break;
            }
            if (head.length() == 0) { s.close(); return; }

            String[] lines = head.toString().split("\r?\n");
            String[] first = lines[0].split(" ");
            if (first.length < 2) { s.close(); return; }
            String method = first[0];
            String path = first[1];
            int q = path.indexOf('?');
            String query = q >= 0 ? path.substring(q + 1) : "";
            if (q >= 0) path = path.substring(0, q);
            if (path.equals("/")) path = "/index.html";

            long contentLength = -1;
            String range = null;
            for (String h : lines) {
                String lh = h.toLowerCase(Locale.US);
                if (lh.startsWith("content-length:")) contentLength = Long.parseLong(h.substring(15).trim());
                if (lh.startsWith("range:")) range = h.substring(6).trim();
            }

            if (path.equals("/__rec") && method.equals("POST")) {
                receiveRecording(in, out, query, contentLength);
                return;
            }
            if (path.equals("/__imports")) {
                json(out, importsJson());
                return;
            }
            if (path.equals("/__delete") && method.equals("POST")) {
                String id = param(query, "id");
                boolean ok = false;
                if (id != null && id.matches("[A-Za-z0-9._-]+")) {
                    ok = deleteTree(new File(mvRoot(), id));
                }
                json(out, "{\"ok\":" + ok + "}");
                return;
            }

            // 大文件走流式，绝不整块进内存（母带 FLAC 有 148MB）
            if (!serve(out, path, range)) return;
            out.flush();
            s.close();
        } catch (Exception e) {
            e.printStackTrace();
            try { s.close(); } catch (IOException ignored) {}
        }
    }

    /** 直接把文件流式写给客户端，支持 Range；返回 false 表示已经写过错误响应。 */
    private boolean serve(OutputStream out, String path, String range) throws IOException {
        String m = mime(path);
        long total;
        InputStream in;

        if (path.startsWith("/custom/")) {
            String[] parts = path.substring(8).split("/", 2);
            String id = parts[0];
            if (!id.matches("[A-Za-z0-9._-]+")) { text(out, 403, "403 forbidden"); return false; }
            String rel = parts.length > 1 ? parts[1] : "index.html";
            if (rel.isEmpty() || rel.endsWith("/")) rel = rel + "index.html";
            File base = new File(mvRoot(), id).getCanonicalFile();
            File f = new File(base, rel).getCanonicalFile();
            if (!f.getPath().startsWith(base.getPath())) { text(out, 403, "403 forbidden"); return false; }
            if (!f.isFile()) { text(out, 404, "404 not found: " + path); return false; }
            total = f.length();
            in = new FileInputStream(f);
        } else if (path.startsWith("/execute/") && path.equals("/execute/song.flac")) {
            File ua = userAudio("world-execute");
            if (ua != null && ua.length() > 0) {
                total = ua.length();
                in = new FileInputStream(ua);
            } else {
                Object[] r = openAsset("execute/song.flac");
                if (r == null) { text(out, 404, "404 " + path); return false; }
                total = (Long) r[0];
                in = (InputStream) r[1];
            }
        } else if (path.startsWith("/execute/")) {
            Object[] r = openAsset("execute/" + path.substring(9));
            if (r == null) { text(out, 404, "404 not found: " + path); return false; }
            total = (Long) r[0];
            in = (InputStream) r[1];
        } else if (path.startsWith("/engine/")) {
            Object[] r = openAsset("engine/" + path.substring(8));
            if (r == null) { text(out, 404, "404 not found: " + path); return false; }
            total = (Long) r[0];
            in = (InputStream) r[1];
        } else {
            Object[] r = openAsset("www" + (path.equals("/") ? "/index.html" : path));
            if (r == null) { text(out, 404, "404 not found: " + path); return false; }
            total = (Long) r[0];
            in = (InputStream) r[1];
        }

        long start = 0, end = total - 1;
        boolean partial = false;
        if (range != null && range.startsWith("bytes=")) {
            String spec = range.substring(6).split(",")[0];
            String[] se = spec.split("-", -1);
            try {
                if (se[0].isEmpty()) {                       // bytes=-N
                    long n = Long.parseLong(se[1]);
                    start = Math.max(0, total - n);
                } else {
                    start = Long.parseLong(se[0]);
                    if (se.length > 1 && !se[1].isEmpty()) end = Math.min(Long.parseLong(se[1]), total - 1);
                }
            } catch (NumberFormatException e) { start = 0; end = total - 1; }
            if (start > end || start >= total) {
                in.close();
                text(out, 416, "bad range");
                return false;
            }
            partial = true;
        }
        long len = end - start + 1;
        if (partial) {
            out.write(("HTTP/1.1 206 Partial Content\r\nContent-Type: " + m +
                    "\r\nContent-Range: bytes " + start + "-" + end + "/" + total +
                    "\r\nAccept-Ranges: bytes\r\nCache-Control: no-cache\r\nContent-Length: " + len +
                    "\r\nConnection: close\r\n\r\n").getBytes("UTF-8"));
        } else {
            out.write(("HTTP/1.1 200 OK\r\nContent-Type: " + m +
                    "\r\nAccept-Ranges: bytes\r\nCache-Control: no-cache\r\nContent-Length: " + total +
                    "\r\nConnection: close\r\n\r\n").getBytes("UTF-8"));
        }

        long skipped = 0;
        while (skipped < start) {
            long n = in.skip(start - skipped);
            if (n <= 0) { int b = in.read(); if (b < 0) break; skipped++; } else skipped += n;
        }
        byte[] buf = new byte[262144];
        long left = len;
        while (left > 0) {
            int n = in.read(buf, 0, (int) Math.min(buf.length, left));
            if (n < 0) break;
            out.write(buf, 0, n);
            left -= n;
        }
        in.close();
        return true;
    }

    /** 打开 assets 里的文件：未压缩的走 openFd（可拿到长度、不必整块读），否则退回全读。 */
    private Object[] openAsset(String p) {
        try {
            android.content.res.AssetFileDescriptor fd = am.openFd(p);
            long len = fd.getLength();
            InputStream in = fd.createInputStream();
            if (len >= 0) return new Object[]{len, in};
            fd.close();
        } catch (IOException ignored) {}
        try {
            InputStream is = am.open(p);
            java.io.ByteArrayOutputStream bo = new java.io.ByteArrayOutputStream(Math.max(4096, is.available()));
            byte[] b = new byte[65536];
            int n;
            while ((n = is.read(b)) > 0) bo.write(b, 0, n);
            is.close();
            byte[] body = bo.toByteArray();
            return new Object[]{(long) body.length, new java.io.ByteArrayInputStream(body)};
        } catch (IOException e) {
            return null;
        }
    }

    private static String param(String query, String key) {
        for (String kv : query.split("&")) {
            int i = kv.indexOf('=');
            if (i > 0 && kv.substring(0, i).equals(key)) return Uri.decode(kv.substring(i + 1));
        }
        return null;
    }

    private void text(OutputStream out, int code, String msg) throws IOException {
        byte[] b = msg.getBytes("UTF-8");
        String head = code == 404 ? "404 Not Found" : code == 403 ? "403 Forbidden" : "416 Range Not Satisfiable";
        out.write(("HTTP/1.1 " + head + "\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Length: " + b.length +
                "\r\nConnection: close\r\n\r\n").getBytes("UTF-8"));
        out.write(b);
        out.flush();
        try { out.close(); } catch (IOException ignored) {}
    }

    private void json(OutputStream out, String body) throws IOException {
        byte[] b = body.getBytes("UTF-8");
        out.write(("HTTP/1.1 200 OK\r\nContent-Type: application/json; charset=utf-8\r\nContent-Length: " + b.length +
                "\r\nCache-Control: no-cache\r\nConnection: close\r\n\r\n").getBytes("UTF-8"));
        out.write(b);
        out.flush();
        try { out.close(); } catch (IOException ignored) {}
    }

    String importsJson() {
        File[] dirs = mvRoot().listFiles();
        StringBuilder sb = new StringBuilder("[");
        if (dirs != null) {
            Arrays.sort(dirs);
            boolean first = true;
            for (File d : dirs) {
                if (!d.isDirectory()) continue;
                if (!new File(d, "index.html").isFile()) continue;
                if (!first) sb.append(',');
                first = false;
                sb.append("{\"id\":\"").append(d.getName()).append("\",\"name\":\"")
                        .append(d.getName().replace('_', ' ')).append("\"}");
            }
        }
        return sb.append(']').toString();
    }

    static boolean deleteTree(File f) {
        if (f.isDirectory()) {
            File[] cs = f.listFiles();
            if (cs != null) for (File c : cs) deleteTree(c);
        }
        return f.delete();
    }

    /** 用户为某支 MV 自备的音频（自己合法拥有的录音），没有就返回 null。 */
    File userAudio(String id) {
        File dir = new File(ctx.getFilesDir(), "audio");
        if (!dir.isDirectory()) return null;
        File[] fs = dir.listFiles();
        if (fs == null) return null;
        for (File f : fs) {
            String n = f.getName();
            if (n.startsWith(id + ".")) return f;
        }
        return null;
    }

    private byte[] readAsset(String p) throws IOException {
        InputStream is = am.open(p);
        ByteArrayOutputStream bo = new ByteArrayOutputStream(Math.max(4096, is.available()));
        byte[] buf = new byte[65536];
        int n;
        while ((n = is.read(buf)) > 0) bo.write(buf, 0, n);
        is.close();
        return bo.toByteArray();
    }

    private byte[] readFile(File f) throws IOException {
        FileInputStream fi = new FileInputStream(f);
        ByteArrayOutputStream bo = new ByteArrayOutputStream((int) Math.min(f.length(), 1 << 24));
        byte[] buf = new byte[65536];
        int n;
        while ((n = fi.read(buf)) > 0) bo.write(buf, 0, n);
        fi.close();
        return bo.toByteArray();
    }

    /** 接收录制文件：先写缓存，再塞进系统「下载」目录。 */
    private void receiveRecording(InputStream in, OutputStream out, String query, long len) throws IOException {
        String name = "pdoom-render-" + new SimpleDateFormat("MMdd-HHmmss", Locale.US).format(new Date());
        String n0 = param(query, "name");
        if (n0 != null && n0.length() > 0) {
            String clean = n0.replaceAll("[^A-Za-z0-9._-]", "_");
            if (clean.length() > 0) name = clean;
        }
        File tmp = new File(ctx.getCacheDir(), name);
        FileOutputStream fo = new FileOutputStream(tmp);
        byte[] buf = new byte[65536];
        long left = len <= 0 ? Long.MAX_VALUE : len;
        int n;
        while (left > 0 && (n = in.read(buf, 0, (int) Math.min(buf.length, left))) > 0) {
            fo.write(buf, 0, n);
            left -= n;
        }
        fo.close();
        String where = saveToDownloads(tmp, name);
        byte[] b = where.getBytes("UTF-8");
        out.write(("HTTP/1.1 200 OK\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Length: " + b.length +
                "\r\nConnection: close\r\n\r\n").getBytes("UTF-8"));
        out.write(b);
        out.flush();
        try { out.close(); } catch (IOException ignored) {}
    }

    private String saveToDownloads(File tmp, String name) {
        String mimeType = name.endsWith(".mp4") ? "video/mp4" : "video/webm";
        if (Build.VERSION.SDK_INT >= 29) {
            try {
                ContentValues v = new ContentValues();
                v.put(MediaStore.MediaColumns.DISPLAY_NAME, name);
                v.put(MediaStore.MediaColumns.MIME_TYPE, mimeType);
                v.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
                v.put(MediaStore.MediaColumns.IS_PENDING, 1);
                Uri uri = ctx.getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
                if (uri != null) {
                    OutputStream os = ctx.getContentResolver().openOutputStream(uri);
                    FileInputStream fi = new FileInputStream(tmp);
                    byte[] buf = new byte[65536];
                    int n;
                    while ((n = fi.read(buf)) > 0) os.write(buf, 0, n);
                    fi.close();
                    os.close();
                    ContentValues done = new ContentValues();
                    done.put(MediaStore.MediaColumns.IS_PENDING, 0);
                    ctx.getContentResolver().update(uri, done, null, null);
                    tmp.delete();
                    return "已保存到 下载/" + name;
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        File dst = new File(ctx.getExternalFilesDir(null), name);
        try {
            FileInputStream fi = new FileInputStream(tmp);
            FileOutputStream fo = new FileOutputStream(dst);
            byte[] buf = new byte[65536];
            int n;
            while ((n = fi.read(buf)) > 0) fo.write(buf, 0, n);
            fi.close();
            fo.close();
            tmp.delete();
        } catch (IOException e) {
            e.printStackTrace();
        }
        return "已保存到 " + dst.getAbsolutePath();
    }

    /** 把 zip 解到 filesDir/mv/<id>/，自动剥掉唯一的外层文件夹。 */
    String importZip(InputStream raw, String rawName) throws IOException {
        String id = rawName.replaceAll("\\.[Zz][Ii][Pp]$", "")
                .replaceAll("[^A-Za-z0-9._-]", "_");
        if (id.length() == 0) id = "mv" + System.currentTimeMillis();
        File dir = new File(mvRoot(), id);
        if (dir.exists()) deleteTree(dir);
        dir.mkdirs();

        ZipInputStream zis = new ZipInputStream(raw);
        List<String> names = new ArrayList<>();
        ZipEntry e;
        int guard = 0;
        while ((e = zis.getNextEntry()) != null && guard++ < 20000) {
            String n = e.getName();
            if (n.endsWith("/")) continue;
            File f = new File(dir, n);
            if (!f.getCanonicalPath().startsWith(dir.getCanonicalPath())) continue;
            f.getParentFile().mkdirs();
            OutputStream os = new FileOutputStream(f);
            byte[] buf = new byte[65536];
            int r;
            while ((r = zis.read(buf)) > 0) os.write(buf, 0, r);
            os.close();
            names.add(n);
        }
        zis.close();

        // 如果 index.html 藏在唯一一个一级目录里，就把它提到根
        if (!new File(dir, "index.html").isFile()) {
            File[] tops = dir.listFiles();
            if (tops != null && tops.length == 1 && tops[0].isDirectory()) {
                File inner = tops[0];
                File[] cs = inner.listFiles();
                if (cs != null) for (File c : cs) c.renameTo(new File(dir, c.getName()));
                inner.delete();
            }
        }
        return new File(dir, "index.html").isFile() ? id : null;
    }
}
