# See https://github.com/reflex-dev/reflex/issues/1291#issuecomment-1643858964
import reflex as rx
from reflex.style import Style
from reflex.components.component import NoSSRComponent


class LeafletLib(rx.Component):
    def _get_imports(self):
        return {}

        # leaflet_routing_machine = ImportVar()
        # leaflet = ImportVar()
        # return {
        #     "leaflet": [leaflet],
        #     "leaflet-routing-machine": [leaflet_routing_machine],
        # }

    @classmethod
    def create(cls, *children, **props):
        custom_style = props.pop("style", {})

        # Transfer style props to the custom style prop.
        for key, value in props.items():
            if key not in cls.get_fields():
                custom_style[key] = value

        # Create the component.
        return super().create(
            *children,
            **props,
            custom_style=Style(custom_style),
        )

    def _add_style(self, style):
        self.custom_style = self.custom_style or {}
        self.custom_style.update(style)

    def _render(self):
        out = super()._render()
        return out.add_props(style=self.custom_style).remove_props(
            "custom_style"
        )


class MapContainer(LeafletLib):
    library = "react-leaflet"
    tag = "MapContainer"

    center: rx.Var[list[float]]
    zoom: rx.Var[int]
    scroll_wheel_zoom: rx.Var[bool]

    def _get_custom_code(self) -> str:
        return """
import "leaflet/dist/leaflet.css";

const MapContainer = dynamic(async () => {
    const mod = await import('react-leaflet')

    await import('leaflet-routing-machine')

    return mod.MapContainer
}, { ssr: false });
"""


class Huh(NoSSRComponent):
    library = "@react-leaflet/core"
    tag = "useLeafletContext"

    def _get_hooks(self) -> str:
        return """
    const context = useLeafletContext();

    // if (L.Routing !== undefined) {
    //     const routerControl = L.Routing.control({
    //         router: L.Routing.osrmv1(),
    //         plan: L.Routing.plan([]),
    //     });

    //     useEffect(() => {
    //         return () => {
    //         };
    //     }, [context.map]);
    // }
"""


class TileLayer(LeafletLib):
    library = "react-leaflet"
    tag = "TileLayer"

    def _get_custom_code(self) -> str:
        return """
const TileLayer = dynamic(async () => {
    const mod = await import('react-leaflet')
    return mod.TileLayer
}, { ssr: false });
"""

    attribution: rx.Var[str]
    url: rx.Var[str]


class UseMap(LeafletLib):
    library = "react-leaflet"
    tag = "useMap"


class UseLeafletContext(rx.Fragment):
    library = "@react-leaflet/core"
    tag = "useLeafletContext"

    def _get_imports(self):
        return {}

    def _get_custom_code(self) -> str:
        return """
const useLeafletContext = dynamic(async () => {
    const mod = await import('@react-leaflet/core')
    return mod.useLeafletContext
}, { ssr: false });
"""


class Marker(LeafletLib):
    library = "react-leaflet"
    tag = "Marker"

    def _get_custom_code(self) -> str:
        return """
const Marker = dynamic(async () => {
    const mod = await import('react-leaflet')
    return mod.Marker
}, { ssr: false });
"""

    position: rx.Var[list[float]]
    icon: rx.Var[dict]


class Popup(LeafletLib):
    library = "react-leaflet"
    tag = "Popup"

    def _get_custom_code(self) -> str:
        return """
const Popup = dynamic(async () => {
    const mod = await import('react-leaflet')
    return mod.Popup
}, { ssr: false });
"""


class L(LeafletLib):
    library = "leaflet"
    tag = "L"
    is_default = True

    def _get_custom_code(self) -> str:
        return """
const L = dynamic(async () => {
    const mod = await import('leaflet')
    await import('leaflet-routing-machine')
    return mod
}, { ssr: false });
"""


map_container = MapContainer.create
tile_layer = TileLayer.create
use_map = UseMap.create
marker = Marker.create
popup = Popup.create
huh = Huh.create
use_leaflet_context = UseLeafletContext
l = L.create


def index():
    return rx.box(
        l(),
        # use_leaflet_context(),
        map_container(
            tile_layer(
                attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors",
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            ),
            huh(),
            marker(popup("Hello, world"), position=[51.505, -0.09]),
            center=[51.505, -0.09],
            zoom=13,
            scroll_wheel_zoom=True,
            height="100%",
            width="100%",
        ),
        width="100vw",
        height="100vh",
    )


app = rx.App()
app.add_page(index)
