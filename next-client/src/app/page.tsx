"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";

import { type FormEvent, useState, useEffect, useMemo } from "react";
import type Coordinate from "@/types/Coordinate";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ModeToggle() {
	const { setTheme } = useTheme();

	const handleThemeChange = (theme: string) => {
		document.documentElement.setAttribute("data-theme", theme);
		setTheme(theme);
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="icon">
					<Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
					<Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
					<span className="sr-only">Toggle theme</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem onClick={() => handleThemeChange("light")}>
					Light
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => handleThemeChange("dark")}>
					Dark
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => handleThemeChange("system")}>
					System
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function App() {
	const [latitude, setLatitude] = useState<string>("");
	const [longitude, setLongitude] = useState<string>("");
	const [imagePoints, setImagePoints] = useState<L.LatLngTuple[]>([]);

	const Map = useMemo(
		() =>
			dynamic(() => import("@/app/Map"), {
				loading: () => <p>Loading</p>,
				ssr: false,
			}),
		[],
	);

	async function pullImage() {
		const res = await fetch("/maps/image");
		const imagePointsList: Coordinate[] = await res.json();
		setImagePoints(imagePointsList.map((c) => [c.latitude, c.longitude]));
	}

	async function sendLatLon(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const res = await fetch("/maps/latlon", {
			method: "POST",
			body: JSON.stringify({
				latitude: Number.parseFloat(latitude),
				longitude: Number.parseFloat(longitude),
			}),
			headers: {
				"Content-Type": "application/json",
			},
		});
		const json = await res.json();
		console.log(json);
	}

	useEffect(() => {
		pullImage();
	}, []);

	return imagePoints.length > 0 ? (
		<div className="h-screen w-screen">
			<ModeToggle />
			<Map points={imagePoints} />
			<div className="card px-5 py-4 border-2 max-w-xs mx-4 my-3 z-10 absolute">
				<h1 className="text-3xl">LAMaps</h1>
				<p className="my-3">Please input latitude and longitude.</p>
				<form onSubmit={sendLatLon}>
					<input
						type="text"
						placeholder="Latitude"
						className="input input-bordered input-success w-full max-w-xs mb-3"
						pattern="-?[0-9]+(.[0-9]+)"
						value={latitude}
						onChange={(e) => setLatitude(e.target.value)}
						required
					/>
					<br />
					<input
						type="text"
						placeholder="Longitude"
						className="input input-bordered input-success w-full max-w-xs mb-3"
						pattern="-?[0-9]+(.[0-9]+)"
						value={longitude}
						onChange={(e) => setLongitude(e.target.value)}
						required
					/>
					<br />
					<button type="submit" className="btn btn-success">
						Submit
					</button>
				</form>
			</div>
		</div>
	) : null;
}

export default App;
