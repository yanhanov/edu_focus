export type AppTabName = 'index' | 'schedule' | 'homework' | 'profile';

export type AppTabItem = {
  name: AppTabName;
  href: '/' | '/schedule' | '/homework' | '/profile';
  label: string;
  icon: {
    ios: { default: string; selected: string };
    android: { default: string; selected: string };
  };
};

export const APP_TABS: readonly AppTabItem[] = [
  {
    name: 'index',
    href: '/',
    label: 'Главная',
    icon: {
      ios: { default: 'house', selected: 'house.fill' },
      android: { default: 'home', selected: 'home' },
    },
  },
  {
    name: 'schedule',
    href: '/schedule',
    label: 'Расписание',
    icon: {
      ios: { default: 'calendar', selected: 'calendar' },
      android: { default: 'calendar_month', selected: 'calendar_month' },
    },
  },
  {
    name: 'homework',
    href: '/homework',
    label: 'ДЗ',
    icon: {
      ios: { default: 'square.and.pencil', selected: 'square.and.pencil' },
      android: { default: 'edit_note', selected: 'edit_note' },
    },
  },
  {
    name: 'profile',
    href: '/profile',
    label: 'Профиль',
    icon: {
      ios: { default: 'person', selected: 'person.fill' },
      android: { default: 'person', selected: 'person' },
    },
  },
];
