package io.ionic.mysteamyapp;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "Widget")
public class WidgetPlugin extends Plugin {

    @PluginMethod
    public void updateWidget(PluginCall call) {
        GameWidget.updateAllWidgets(getContext());

        JSObject result = new JSObject();
        result.put("updated", true);
        call.resolve(result);
    }
}