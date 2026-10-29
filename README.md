# The Room Study

A dependency-free, responsive static comparison of twelve Decoliving rugs in a bedroom with a pale pine Scandi Home Japanese queen bed.

## View locally

Serve this directory over HTTP rather than opening `index.html` directly. For example, from this directory:

```sh
python -m http.server 8000
```

Open `http://localhost:8000`. A local server is needed for the collection JSON request.

## Files expected

- `index.html`, `styles.css`, `app.js`
- `rugs.json`: an array of 12 products, sorted by numeric `rank`
- `assets/rooms/baseline.webp`: the room without a rug
- `assets/rooms/{slug}.webp`: each rug in the same room and camera view
- `assets/swatches/{slug}.jpg`: the original product crop

Each JSON entry uses `slug`, `name`, `price` (PHP number), `page`, `collection`, `tags` (array), `rank`, `recommendation`, `pros` (array), `cons` (array), and `size` (normally `8 × 11 ft`). Supported filter tags are `traditional`, `darker`, `neutral`, and `rust`. Multiple active filters match any selected tag.

## Controls

- Starts on the generated baseline without a rug.
- Select a product through the dropdown, swatch strip or room card.
- Use the before/after range control to reveal the selected rug; the baseline button temporarily shows the baseline.
- Select up to three comparison checkboxes. Other checkboxes become unavailable until one is removed.
- Share copies the current URL, including `rug`, optional `view=baseline`, and comma-separated `compare` values. If clipboard access is unavailable, a selectable URL dialog appears.
- Invalid URL product names are ignored. All content and controls use local files; there are no external fonts, packages, analytics or network services.

## Publication

Upload the entire folder to a static web host, keeping relative paths and filename case intact. GitHub Pages can serve these files directly from a designated published branch/folder. Ensure all 13 room images, 12 product crops and `rugs.json` are present before publishing. Do not upload the source PDF, private room photograph, intermediate assets, or credentials.

The website does not itself deploy or publish anything. This README does not imply a live deployment.

## Release checks

Check the initial no-rug view, all 12 room previews, keyboard range control, baseline toggle, each filter, three-item limit, removal and clearing, copied/reopened URLs, and clipboard fallback. Inspect at mobile, tablet and desktop widths, ensure every product swatch matches its catalogue page, and confirm no broken images or browser errors. Room views use a fixed 4:3 display ratio, matching the 1448 × 1086 baseline. The baseline and rug room images must share the same aspect ratio, framing and fixed room geometry for the split view to align. Original portrait swatches use `object-fit: contain`, without colour filters.

The site clearly labels room images as artist’s visualizations, catalogue prices as a snapshot with unknown availability, approximate rug sizing/placement, and unverified bedding height, topper and Eight Sleep compatibility.
