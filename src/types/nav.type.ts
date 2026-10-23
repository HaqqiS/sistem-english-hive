export type NavItem = {
	title: string;
	/** Judul pendek untuk ruang sempit (mis. bottom nav HP). */
	shortTitle?: string;
	url: string;
	icon: string;
	label?: string;
	disabled?: boolean;
};
export type NavCollapsibleItem = {
	title: string;
	isActive?: boolean;
	items: {
		title: string;
		url: string;
		icon: string;
	}[];
};

export type UserNavItem = {
	title: string;
};
