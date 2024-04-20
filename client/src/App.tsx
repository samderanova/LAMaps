import { FormEvent, useState, useEffect } from "react";
import "./App.css";
import Map from "./Map";
import Coordinate from "./types/Coordinate";

function App() {
	const [latitude, setLatitude] = useState<string>("");
	const [longitude, setLongitude] = useState<string>("");
	const [imagePoints, setImagePoints] = useState<L.LatLngTuple[]>([]);

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


	return imagePoints.length > 0 ? (
		<div className="h-screen w-screen">
			<Map points={imagePoints} />
			<div className="card px-5 py-4 border-2 max-w-xs mx-4 my-3 z-10 bg-white absolute">
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
