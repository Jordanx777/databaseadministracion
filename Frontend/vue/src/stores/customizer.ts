import { ref } from 'vue';
import { defineStore } from 'pinia';
import config from '@/config';

export const useCustomizerStore = defineStore('customizer', () => {
  const Sidebar_drawer = ref(config.Sidebar_drawer);
  const Customizer_drawer = ref(config.Customizer_drawer);
  const mini_sidebar = ref(config.mini_sidebar);
  const setHorizontalLayout = ref(config.setHorizontalLayout);
  const actTheme = ref(config.actTheme);
  const fontTheme = ref(config.fontTheme);
  const inputBg = ref(config.inputBg);
  const boxed = ref(config.boxed);

  function SET_SIDEBAR_DRAWER() {
    Sidebar_drawer.value = !Sidebar_drawer.value;
  }

  function SET_MINI_SIDEBAR(payload: boolean) {
    mini_sidebar.value = payload;
  }

  function SET_CUSTOMIZER_DRAWER(payload: boolean) {
    Customizer_drawer.value = payload;
  }

  function SET_LAYOUT(payload: boolean) {
    setHorizontalLayout.value = payload;
  }

  function SET_THEME(payload: string) {
    actTheme.value = payload;
  }

  function SET_INPUTBG(payload: boolean) {
    inputBg.value = payload;
  }

  function SET_BOXED(payload: boolean) {
    boxed.value = payload;
  }

  function SET_FONT(payload: string) {
    fontTheme.value = payload;
  }

  return {
    Sidebar_drawer,
    Customizer_drawer,
    mini_sidebar,
    setHorizontalLayout,
    actTheme,
    fontTheme,
    inputBg,
    boxed,
    SET_THEME,
    SET_SIDEBAR_DRAWER,
    SET_CUSTOMIZER_DRAWER,
    SET_MINI_SIDEBAR,
    SET_LAYOUT,
    SET_FONT,
    SET_INPUTBG,
    SET_BOXED
  };
});
