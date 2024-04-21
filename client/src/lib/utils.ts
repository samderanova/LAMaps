import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function saveFile(b64FileContents: string) {
	// Replace 'your_base64_string' with the actual encoded string from Python
	const decoded = atob(b64FileContents);
	const blob = new Blob([decoded], { type: "text/plain;charset=utf-8" });
	const filename = "encoded_data.gpx";

	// Create a download link
	const link = document.createElement("a");
	link.href = URL.createObjectURL(blob);
	link.download = filename;
	link.click();

	// Revoke the object URL to avoid memory leaks
	URL.revokeObjectURL(link.href);
}

export async function coordinatize(
	mapBounds: L.LatLngBounds | null,
	blob: Blob,
	snap: boolean
) {
	const formData = new FormData();
	formData.set("snap", snap ? "true" : "false")
	formData.set("bounds", JSON.stringify(mapBounds));
	formData.set("image", blob);
	formData.set("max_points", "20");

	const res = await fetch("/api/maps/coordinatize", {
		method: "POST",
		body: formData,
	});

	return await res.json();
}
