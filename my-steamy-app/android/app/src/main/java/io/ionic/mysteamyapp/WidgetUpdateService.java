package io.ionic.mysteamyapp;

import android.app.Service;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.util.Log;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;

public class WidgetUpdateService extends Service {

    private static final String TAG = "WidgetUpdateService";
    private static final String BASE_URL = "https://www.cheapshark.com/api/1.0";
    private static final long ROTATION_DELAY_MS = 5000L;

    private Handler rotationHandler;
    private List<DealSlide> dealSlides = new ArrayList<>();
    private int currentSlide = 0;
    private boolean useSlotA = true;

    // Holds data for one deal slide
    static class DealSlide {
        String title;
        String storeID;
        String storeName;
        String storeLogoUrl;
        String salePrice;
        String normalPrice;
        String savings;
        String thumbUrl;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        int appWidgetId = intent.getIntExtra(
                AppWidgetManager.EXTRA_APPWIDGET_ID,
                AppWidgetManager.INVALID_APPWIDGET_ID);

        // Run network on background thread
        new Thread(() -> {
            try {
                loadAndDisplayWidget(appWidgetId);
            } catch (Exception e) {
                Log.e(TAG, "Error updating widget", e);
                showEmptyState(appWidgetId);
            } finally {
                stopSelf();
            }
        }).start();

        return START_NOT_STICKY;
    }

    private void loadAndDisplayWidget(int appWidgetId) throws Exception {
        // 1. Read favorite from CapacitorStorage
        String favoriteJson = GameWidget.getFavoriteJson(this);
        if (favoriteJson == null || favoriteJson.isEmpty()) {
            showEmptyState(appWidgetId);
            return;
        }

        JSONObject favorite = new JSONObject(favoriteJson);
        String gameID = favorite.optString("gameID", "");
        if (gameID.isEmpty()) {
            showEmptyState(appWidgetId);
            return;
        }

        // 2. Fetch game deals from CheapShark
        String gameJson = fetchUrl(BASE_URL + "/games?id=" + gameID);
        if (gameJson == null) {
            showEmptyState(appWidgetId);
            return;
        }
        JSONObject gameData = new JSONObject(gameJson);

        // Game info
        JSONObject info = gameData.getJSONObject("info");
        String gameTitle = info.optString("title", "Unknown Game");
        String thumbUrl = info.optString("thumb", "");

        // Deals array from game
        JSONArray dealsArr = gameData.getJSONArray("deals");

        // 3. Fetch stores
        String storesJson = fetchUrl(BASE_URL + "/stores");
        if (storesJson == null) {
            showEmptyState(appWidgetId);
            return;
        }
        JSONArray storesArr = new JSONArray(storesJson);

        // 4. Build slide list
        dealSlides.clear();
        for (int i = 0; i < dealsArr.length() && i < 6; i++) {
            JSONObject deal = dealsArr.getJSONObject(i);
            String storeID = deal.optString("storeID", "");

            // Find store info
            String storeName = "Store";
            String storeLogoUrl = "";
            for (int s = 0; s < storesArr.length(); s++) {
                JSONObject store = storesArr.getJSONObject(s);
                if (store.optString("storeID").equals(storeID)) {
                    storeName = store.optString("storeName", "Store");
                    JSONObject images = store.optJSONObject("images");
                    if (images != null) {
                        storeLogoUrl = "https://www.cheapshark.com" + images.optString("logo", "");
                    }
                    break;
                }
            }

            DealSlide slide = new DealSlide();
            slide.title = gameTitle;
            slide.storeID = storeID;
            slide.storeName = storeName;
            slide.storeLogoUrl = storeLogoUrl;
            slide.salePrice = "$" + deal.optString("price", "0.00");
            slide.normalPrice = "$" + deal.optString("retailPrice", "0.00");
            double savings = 0;
            try {
                double sale = Double.parseDouble(deal.optString("price", "0"));
                double retail = Double.parseDouble(deal.optString("retailPrice", "0"));
                if (retail > 0)
                    savings = ((retail - sale) / retail) * 100;
            } catch (Exception ignored) {
            }
            slide.savings = "-" + Math.round(savings) + "%";
            slide.thumbUrl = thumbUrl;

            dealSlides.add(slide);
        }

        if (dealSlides.isEmpty()) {
            showEmptyState(appWidgetId);
            return;
        }

        // 5. Download images and start rotation on main thread
        startCarousel(appWidgetId);
    }

    private void startCarousel(int appWidgetId) {
        if (rotationHandler != null) {
            rotationHandler.removeCallbacksAndMessages(null);
        }
        rotationHandler = new Handler(Looper.getMainLooper());
        currentSlide = 0;

        Runnable rotateRunnable = new Runnable() {
            @Override
            public void run() {
                DealSlide slide = dealSlides.get(currentSlide);
                renderSlide(appWidgetId, slide, useSlotA);
                useSlotA = !useSlotA;
                currentSlide = (currentSlide + 1) % dealSlides.size();
                rotationHandler.postDelayed(this, ROTATION_DELAY_MS);
            }
        };

        rotationHandler.post(rotateRunnable);
    }

    private void renderSlide(int appWidgetId, DealSlide slide, boolean useSlotA) {
        AppWidgetManager manager = AppWidgetManager.getInstance(this);
        RemoteViews views = new RemoteViews(getPackageName(), R.layout.game_widget);

        // Show main content, hide empty state
        views.setViewVisibility(R.id.emptyState, View.GONE);
        views.setViewVisibility(R.id.viewFlipper, View.VISIBLE);

        // Flip to next slot
        if (useSlotA) {
            fillSlot(views, slide,
                    R.id.imgThumbA, R.id.txtTitleA, R.id.imgStoreLogoA,
                    R.id.txtStoreA, R.id.txtNormalPriceA, R.id.txtSalePriceA, R.id.txtSavingsA);
            views.setDisplayedChild(R.id.viewFlipper, 0);
        } else {
            fillSlot(views, slide,
                    R.id.imgThumbB, R.id.txtTitleB, R.id.imgStoreLogoB,
                    R.id.txtStoreB, R.id.txtNormalPriceB, R.id.txtSalePriceB, R.id.txtSavingsB);
            views.setDisplayedChild(R.id.viewFlipper, 1);
        }

        manager.updateAppWidget(appWidgetId, views);
    }

    private void fillSlot(RemoteViews views, DealSlide slide,
            int imgThumbId, int txtTitleId, int imgStoreLogoId,
            int txtStoreId, int txtNormalPriceId, int txtSalePriceId, int txtSavingsId) {

        views.setTextViewText(txtTitleId, slide.title);
        views.setTextViewText(txtStoreId, slide.storeName);
        views.setTextViewText(txtNormalPriceId, slide.normalPrice);
        views.setTextViewText(txtSalePriceId, slide.salePrice);
        views.setTextViewText(txtSavingsId, slide.savings);

        // Load thumbnail async
        loadBitmapIntoView(views, slide.thumbUrl, imgThumbId);

        // Load store logo async
        if (!slide.storeLogoUrl.isEmpty()) {
            loadBitmapIntoView(views, slide.storeLogoUrl, imgStoreLogoId);
        }
    }

    private void loadBitmapIntoView(RemoteViews views, String imageUrl, int viewId) {
        try {
            if (imageUrl == null || imageUrl.isEmpty())
                return;
            URL url = new URL(imageUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(5000);
            conn.connect();
            Bitmap bitmap = BitmapFactory.decodeStream(conn.getInputStream());
            if (bitmap != null) {
                views.setImageViewBitmap(viewId, bitmap);
            }
        } catch (Exception e) {
            Log.w(TAG, "Could not load image: " + imageUrl, e);
        }
    }

    private void showEmptyState(int appWidgetId) {
        AppWidgetManager manager = AppWidgetManager.getInstance(this);
        RemoteViews views = new RemoteViews(getPackageName(), R.layout.game_widget);
        views.setViewVisibility(R.id.viewFlipper, View.GONE);
        views.setViewVisibility(R.id.emptyState, View.VISIBLE);
        manager.updateAppWidget(appWidgetId, views);
    }

    private String fetchUrl(String urlString) {
        try {
            URL url = new URL(urlString);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(8000);
            conn.setReadTimeout(8000);
            conn.connect();

            int responseCode = conn.getResponseCode();
            if (responseCode != 200)
                return null;

            InputStream is = conn.getInputStream();
            BufferedReader reader = new BufferedReader(new InputStreamReader(is));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
            return sb.toString();
        } catch (Exception e) {
            Log.e(TAG, "fetchUrl failed: " + urlString, e);
            return null;
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        if (rotationHandler != null) {
            rotationHandler.removeCallbacksAndMessages(null);
        }
        super.onDestroy();
    }
}