# Maya portrait and motion — November 12, 2026

The user approved this visual direction during implementation. Both images were created with the built-in image-generation tool and copied into the project. They depict an original fictional adult receptionist, not an employee photograph.

- Base image: `dist/assets/maya-portrait.png`
- Closed-eye frame: `dist/assets/maya-blink.png`
- Reusable component: `dist/maya-avatar.mjs`
- Motion and responsive styles: `dist/maya-avatar.css`

The same portrait appears in the website concierge section, reception dashboard, and Maya conversation window. A masked closed-eye frame produces short blinks; subtle motion gives the portrait a gentle idle presence. The local animation has no external avatar subscription or inference dependency. It is an animated portrait, not a lip-synchronized video character.

Listening, processing and speaking labels follow microphone, request and audio states. Audio begins only on an explicit user action. The pause control synchronizes across visible portraits and remembers the preference in that browser. Reduced-motion preferences stop animation. The interface identifies Maya as a virtual receptionist and retains accurate telephone connection status.

Browser verification: portrait/frame assets loaded; blink animation and masks active; pause disabled animation; playback resumed; English and Spanish audio samples showed Speaking; language change returned to idle; mobile inquiry advanced to the name prompt; modal close returned to the page; no console errors were recorded. Desktop and 390-pixel mobile layouts were inspected. Live microphone transcription was not retested for this visual change because the preview server had no speech service attached.

Visual evidence: `maya-human-desktop.jpg` and `maya-human-mobile.jpg`.

## Original portrait prompt

Use case: photorealistic-natural. Asset type: original portrait for Maya, a clearly labeled virtual receptionist in M Law's website and law-office software. Create a photorealistic, beautiful fictional adult woman around 32, warm and calm, with medium warm skin, dark brown eyes, neatly groomed long dark brown hair, natural understated makeup and a gentle closed-lip smile. She wears an elegant dark forest-green tailored blazer over an ivory blouse and a discreet black receptionist headset with a fine microphone boom at her cheek. Scene: softly blurred, refined contemporary New York law office reception, warm stone and walnut, daylight, no visible logos. Camera is straight on, eyes looking directly at viewer, face centered and symmetrical, head upright, shoulders visible, upper chest included. Square portrait, realistic editorial photograph, soft flattering window light, natural skin texture, honest human proportions, premium but approachable. Eyes fully open; face well illuminated; no hands, no lettering, no watermark, no real-person resemblance request. Leave a little space above the hair. The image will be used as an animation base, so clear unobscured eyes and a still frontal pose are essential.

## Blink-frame edit prompt

Use case: identity-preserve. This is the exact animation base portrait of fictional virtual receptionist Maya. Edit target: the attached portrait. Produce the next blink frame. Change ONLY both eyelids: her two eyes are naturally and fully CLOSED for a brief relaxed blink, lashes resting together, no iris or whites visible. Keep her eyebrows, face position, proportions, gaze direction/head pose, gentle closed-lip smile, all skin texture outside the tiny eyelid regions, hair, headset, green blazer, ivory blouse, lighting, background, camera framing and exact square image dimensions IDENTICAL. Do not reframe, retouch, beautify, move or repaint any other element. No text. This image will be overlaid on the original for a subtle realistic eye blink.
