import googlemaps
from dotenv import load_dotenv
import os
import pprint
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

    :rtype: a list of tuples (start, end, polyline) for each step in each leg
        of the journey
    """

    now = datetime.now()
    result = GMAPS.directions(
        startLatLon, endLatLon, mode="driving", departure_time=now
    )
    if len(result) > 0:
        result = result[0]

    points = []
    for leg in result["legs"]:
        for step in leg["steps"]:
            points.append([step["start_location"], step["end_location"]])

    return points


pprint.pprint(get_directions("34.0544,-118.2441", "34.0544,-117.2441"))
