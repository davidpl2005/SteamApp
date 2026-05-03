import { registerPlugin } from '@capacitor/core';

export interface WidgetPlugin {
  updateWidget(): Promise<{ updated: boolean }>;
}

export const Widget = registerPlugin<WidgetPlugin>('Widget');