import reflex as rx
from reflex.components.component import NoSSRComponent


class UseLeafletContext(rx.Fragment, NoSSRComponent):
    library = "@react-leaflet/core"
    tag = "useLeafletContext"

    def render(self) -> str:
        return ""


class MapContainer(NoSSRComponent):
    library = "@ap0nia/leaflet-with-routing"
    tag = "MapThingy"

    center: rx.Var[list[float]]
    zoom: rx.Var[int]
    scroll_wheel_zoom: rx.Var[bool]

    def _get_custom_code(self) -> str:
        return """
    import "leaflet/dist/leaflet.css";
    """


class Leaflet(rx.Fragment):
    def _get_custom_code(self) -> str:
        return """ """


class Lol(rx.Fragment):
    def _get_imports(self) -> rx.utils.imports.ImportDict:
        return rx.utils.imports.merge_imports(
            super()._get_imports(),
            {
                "react": {rx.utils.imports.ImportVar(tag="useEffect")},
                "@react-leaflet/core": {
                    rx.utils.imports.ImportVar(tag="useLeafletContext")
                },
            },
        )

    def _get_hooks(self):
        return """
const context = useLeafletContext()

const doSomething = async () => {
    const L = await import('leaflet');
    console.log("L :", L.Routing)
}
useEffect(() => {
    doSomething()
}, [context])
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


class UseMap(rx.Component):
    url: rx.Var[str]
    tag = "Mapper"

    def _get_custom_code(self) -> str | None:
        return f"""
import {{ useRef }} from "react"
import {{ useLoader }} from '@react-three/fiber'
import {{ GLTFLoader }} from 'three/addons/loaders/GLTFLoader.js'
    
function Mapper({{children}}) {{
    const context = useLeafletContext()

    return (
        <div map={map}>
            {children}
        </div>
    )
}}
"""

    def _render(self, props: dict[str, Any] | None = None) -> Tag:
        return Tag(name="Loader", props={"url": self.url})


def index():
    return rx.center(
        Leaflet.create(),
        # UseLeafletContext.create(),
        MapContainer.create(
            Lol.create(),
            TileLayer.create(
                attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors",
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            ),
            Marker.create(
                Popup.create("Hello, world"), position=[51.505, -0.09]
            ),
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
