export default function Loading() {
	return (
		<div className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center backdrop-blur">
			{/* Ganti dengan skeleton/spinner favoritmu */}
			<div className="border-primary h-16 w-16 animate-spin rounded-full border-4 border-t-transparent" />
			<span className="sr-only">Loading...</span>
		</div>
	);
}
