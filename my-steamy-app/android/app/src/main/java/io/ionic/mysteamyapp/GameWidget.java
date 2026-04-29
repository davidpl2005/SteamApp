package io.ionic.mysteamyapp;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

public class GameWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            startUpdateService(context, appWidgetId);
        }
    }

    @Override
    public void onEnabled(Context context) {
        super.onEnabled(context);
    }

    @Override
    public void onDisabled(Context context) {
        super.onDisabled(context);
    }

    private void startUpdateService(Context context, int appWidgetId) {
        Intent intent = new Intent(context, WidgetUpdateService.class);
        intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId);
        context.startService(intent);
    }

    // ── Static helper: Read favorite from CapacitorStorage ──
    public static String getFavoriteJson(Context context) {
        // @capacitor/preferences usa el grupo "CapacitorStorage" como nombre del SharedPreferences
        SharedPreferences prefs = context.getSharedPreferences(
            "CapacitorStorage",
            Context.MODE_PRIVATE
        );
        // La clave en Capacitor Preferences se guarda como "favoriteGame"
        return prefs.getString("favoriteGame", null);
    }
}