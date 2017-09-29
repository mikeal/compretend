# Compretend

Web application building blocks power by ML.

This repo contains:

* An API service.
* WebComponents that rely on the API service.

## Usage

Include compretend on your web page.

```html
<script src="https://cdn.jsdelivr.net/npm/compretend@latest/dist/compretend.min.js"></script>
```
Now you can add compretend elements to your page.

```html
<compretend-img src="http://site.com/image.png" crop="faces" />
```

The above example will place an image on the page centered around the faces detected in the image.

## Detection

Currently available detection APIs are:

* **faces**: Front and profile faces detection.
* **people**: Detection of people by full body, upper torso, and lower torso.

## Components

Compretend components have many properties. These properties
can be set as element attributes or with JavaScript.

```javascript
let elem = document.querySelector('compretend-image')
elem.crop = "faces"
elem.width = 320
```

### <compretend-image>

Displays an image. Image data can be set by either specifying the "src" attribute or setting the "data" property to an ArrayBuffer or Blob.

* **src**: URL to remote image. Can be on any publicly available server.
* **data**: ArrayBuffer or Blob representing image data.
* **crop**: String for detection method.
  * Detected attributes in the image will be centered within the
    constraints set of width/height. If width/height are not set
    the image is cropped around the detected elements.
* **width**: Image element width.
* **height**: Image element height.
* **scaled**: Scale image down to the specific dimensions (height and width). Defaults to false.
* **margin**: Ads margin to a cropped and scaled image.

## REST API

All APIs require a `body`. This can be an HTTP PUT/POST body **or** it can be a querystring identifier (hash or remote URL).

### /images/detect/faces

Accepts only the `body` argument.

Return JSON of all facial detections.

### /images/detect/people

Accepts only the `body` argument.

Return JSON of all people detections.

### /images/generate

Returns generated image data as PNG.

Accepts the following querystring parameters:

* **body**: Hash or remote URL. Optionally defined as a PUT/POST body.
* **crop**: Detection method to use for crop boundary detection. `faces` and `people` currently implemented.
* **width**: Image element width.
* **height**: Image element height.
* **scaled**: Scale image down to the specific dimensions (height and width). Defaults to false.
* **margin**: Ads margin to a cropped and scaled image.

### /images/bounds

Returns JSON data describing the crop boundaries for the given query.

Accepts the following querystring parameters:

* **body**: Hash or remote URL. Optionally defined as a PUT/POST body.
* **crop**: Detection method to use for crop boundary detection. `faces` and `people` currently implemented.
* **width**: Image element width.
* **height**: Image element height.
* **scaled**: Scale image down to the specific dimensions (height and width). Defaults to false.
* **margin**: Ads margin to a cropped and scaled image.