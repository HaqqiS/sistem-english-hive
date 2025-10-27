export type NavItem = {
  title: string;
  url: string;
  icon: string;
  label?: string;
  disabled?: boolean;
};

// Anda mungkin juga perlu ini untuk user dropdown atau team switcher
export type UserNavItem = {
  title: string;
};
