from fastapi import FastAPI
from hard_coded_text_pts import text_pts

app = FastAPI()

def generate_points(text: str):
    '''
    Generate points in 2d that if traced would draw out `text`. Returns a list of float tuples. The scale is such that each line of text is ~1 unit tall
    '''

    # convert to uppercase
    pts = []
    for i, char in enumerate(text.upper()):
        if char == ' ':
            continue
        shifted_pts = [
            (x+i, y) for x, y in text_pts[char]
        ]
        pts.extend(shifted_pts)
    return pts
    
print(generate_points("LA HACKS"))

@app.get("/")
async def root() -> dict[str, str]:
    return {"message": "hello"}
