import googlemaps
from dotenv import load_dotenv

import os
from datetime import datetime

load_dotenv()

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
GMAPS = googlemaps.Client(key=GOOGLE_MAPS_API_KEY)


def get_directions(startLatLon: str, endLatLon: str):
    """
    :param startLatLon: The start point's latitude and longitude, specified as two
        decimals separated by a comma
    :type startLatLon: string

    :param endLatLon: The start point's latitude and longitude, specified as two
        decimals separated by a comma
    :type endLatLon: string

    :rtype: list of routes
    """
    now = datetime.now()
    return GMAPS.directions(startLatLon, endLatLon, mode="driving", departure_time=now)
