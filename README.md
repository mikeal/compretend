# Compretend

[![Greenkeeper badge](https://badges.greenkeeper.io/mikeal/compretend.svg?token=79fcbe04c043b2363fcfd80ab8272a9ea060d8c2c7dbf185d05aed54a44ba5d0&ts=1506032457372)](https://greenkeeper.io/)

Web application building blocks power by ML.

This repo contains:

* An API service.
* WebComponents that rely on the API service.

## Usage

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
