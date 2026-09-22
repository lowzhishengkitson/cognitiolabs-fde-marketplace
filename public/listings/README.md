# Local listing images

Place optimized listing images in this directory and add root-relative paths to
the listing's optional `images` array, for example:

`images: ["/listings/thinkpad-t14.webp"]`

WebP or AVIF is preferred. Keep source images reasonably sized; `next/image`
handles responsive delivery in the card and detail layouts.
