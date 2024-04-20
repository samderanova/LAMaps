import reflex as rx
from reflex.components.component import NoSSRComponent


class UseLeafletContext(rx.Fragment, NoSSRComponent):
    library = "@react-leaflet/core"
    tag = "useLeafletContext"

    def _get_hooks(self) -> str:
        return """
"""


class MapContainer(NoSSRComponent):
    library = "react-leaflet"
    tag = "MapContainer"
    lib_dependencies: list[str] = ["leaflet", "leaflet-routing-machine"]

    center: rx.Var[list[float]]
    zoom: rx.Var[int]
    scroll_wheel_zoom: rx.Var[bool]

    def _get_custom_code(self) -> str:
        return """
    import "leaflet/dist/leaflet.css";
    import L from 'leaflet';
    import 'leaflet-routing-machine';
    """


class Bruh(NoSSRComponent):
    def render(self):
        return MapContainer


class Leaflet(rx.Fragment):
    def _get_custom_code(self) -> str:
        return """
"""


class Lol(rx.Fragment):
    def _get_imports(self) -> rx.utils.imports.ImportDict:
        return rx.utils.imports.merge_imports(
            super()._get_imports(),
            {"react": {rx.utils.imports.ImportVar(tag="useEffect")}},
        )

    def _get_hooks(self):
        return """
const doSomething = async () => {
    const L = await import('leaflet');
    await import('leaflet-routing-machine');
    console.log("L :", L.Router, window.L.Router)
}
useEffect(() => {
    doSomething()
}, [])
"""


class LeafletRoutingMachine(rx.Fragment):
    library = "leaflet-routing-machine"

    def render(self) -> str:
        return ""


class TileLayer(NoSSRComponent):
    library = "react-leaflet"
    tag = "TileLayer"

    attribution: rx.Var[str]
    url: rx.Var[str]


class Marker(NoSSRComponent):
    library = "react-leaflet"
    tag = "Marker"

    position: rx.Var[list[float]]
    icon: rx.Var[dict]


class Popup(NoSSRComponent):
    library = "react-leaflet"
    tag = "Popup"


def index():
    return rx.center(
        Leaflet.create(),
        Bruh.create(),
        MapContainer.create(
            TileLayer.create(
                attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors",
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            ),
            Marker.create(
                Popup.create("Hello, world"), position=[51.505, -0.09]
            ),
            UseLeafletContext.create(),
            Lol.create(),
            center=[51.505, -0.09],
            zoom=13,
            scroll_wheel_zoom=True,
            height="98vh",
            width="100%",
        ),
    )


# Add state and page to the app.
app = rx.App()
app.add_page(index)
