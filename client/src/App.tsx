import "./App.css";
import Map from "./Map";

function App() {
	async function sendLatLon() { }

	return (
		<div className="h-screen w-screen">
			<Map />
			<div className="card px-5 py-4 border-2 max-w-xs mx-4 my-3 z-10 bg-white absolute">
				<h1 className="text-3xl">LAMaps</h1>
				<p className="my-3">Please input latitude and longitude.</p>
				<form onSubmit={sendLatLon}>
					<input
						type="text"
						placeholder="Latitude"
						className="input input-bordered input-success w-full max-w-xs mb-3"
						pattern="[0-9]+(.[0-9]+)"
						required
					/>
					<br />
					<input
						type="text"
						placeholder="Longitude"
						className="input input-bordered input-success w-full max-w-xs mb-3"
						pattern="[0-9]+(.[0-9]+)"
						required
					/>
					<br />
					<button type="submit" className="btn btn-success">
						Submit
					</button>
				</form>
			</div>
		</div>
	);
}

export default App;
