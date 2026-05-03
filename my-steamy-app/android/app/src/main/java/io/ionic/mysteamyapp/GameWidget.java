package io.ionic.mysteamyapp;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Paint;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONObject;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class GameWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateWidget(context, appWidgetId);
        }
    }

    public static void updateAllWidgets(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        ComponentName componentName = new ComponentName(context, GameWidget.class);
        int[] widgetIds = manager.getAppWidgetIds(componentName);

        for (int widgetId : widgetIds) {
            updateWidget(context, widgetId);
        }
    }

    private static void updateWidget(Context context, int appWidgetId) {
        new Thread(() -> {
            try {
                String json = getFavoriteJson(context);
                RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.game_widget);

                if (json == null || json.isEmpty()) {
                    views.setTextViewText(R.id.txtWidgetTitle, "No favorite game yet");
                    views.setTextViewText(R.id.txtWidgetStore, "Add one from the app");
                    views.setTextViewText(R.id.txtWidgetSalePrice, "$0.00");
                    views.setTextViewText(R.id.txtWidgetNormalPrice, "");
                    views.setTextViewText(R.id.txtWidgetSavings, "");
                    views.setViewVisibility(R.id.imgWidgetBackground, View.GONE);
                    update(context, appWidgetId, views);
                    return;
                }

                JSONObject favorite = new JSONObject(json);

                String title = favorite.optString("title", "Favorite Game");
                String storeName = favorite.optString("storeName", "Store");
                String thumb = favorite.optString("thumb", "");
                String salePrice = "$" + favorite.optString("salePrice", "0.00");
                String normalPrice = "$" + favorite.optString("normalPrice", "0.00");
                String savings = favorite.optString("savings", "0");
                String savingsPercent = "-" + Math.round(Double.parseDouble(savings)) + "%";

                views.setTextViewText(R.id.txtWidgetTitle, title);
                views.setTextViewText(R.id.txtWidgetStore, storeName);
                views.setTextViewText(R.id.txtWidgetSalePrice, salePrice);
                views.setTextViewText(R.id.txtWidgetNormalPrice, normalPrice);
                views.setTextViewText(R.id.txtWidgetSavings, savingsPercent);

                views.setInt(
                        R.id.txtWidgetNormalPrice,
                        "setPaintFlags",
                        Paint.STRIKE_THRU_TEXT_FLAG | Paint.ANTI_ALIAS_FLAG);

                Bitmap bitmap = loadBitmap(thumb);
                if (bitmap != null) {
                    views.setViewVisibility(R.id.imgWidgetBackground, View.VISIBLE);
                    views.setImageViewBitmap(R.id.imgWidgetBackground, bitmap);
                } else {
                    views.setViewVisibility(R.id.imgWidgetBackground, View.GONE);
                }

                update(context, appWidgetId, views);

            } catch (Exception e) {
                RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.game_widget);
                views.setTextViewText(R.id.txtWidgetTitle, "Widget error");
                views.setTextViewText(R.id.txtWidgetStore, "Open the app again");
                views.setTextViewText(R.id.txtWidgetSalePrice, "");
                views.setTextViewText(R.id.txtWidgetNormalPrice, "");
                views.setTextViewText(R.id.txtWidgetSavings, "");
                views.setViewVisibility(R.id.imgWidgetBackground, View.GONE);
                update(context, appWidgetId, views);
            }
        }).start();
    }

    private static void update(Context context, int appWidgetId, RemoteViews views) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        manager.updateAppWidget(appWidgetId, views);
    }

    private static String getFavoriteJson(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(
                "CapacitorStorage",
                Context.MODE_PRIVATE);

        return prefs.getString("favoriteGame", null);
    }

    private static Bitmap loadBitmap(String imageUrl) {
        try {
            if (imageUrl == null || imageUrl.isEmpty())
                return null;

            URL url = new URL(imageUrl);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setConnectTimeout(7000);
            connection.setReadTimeout(7000);
            connection.connect();

            InputStream inputStream = connection.getInputStream();
            return BitmapFactory.decodeStream(inputStream);

        } catch (Exception e) {
            return null;
        }
    }
}