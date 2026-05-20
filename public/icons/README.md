# أيقونات PWA (`public/icons`)

هذه **ليست** صور Angular الافتراضية بعد التحديث — تُولَّد من شعار التطبيق `public/logo.svg`.

## أين تُستخدم؟

| الملف              | الاستخدام                                                           |
| ------------------ | ------------------------------------------------------------------- |
| `icon-*.png`       | `manifest.webmanifest` — تثبيت التطبيق (PWA) على الجوال وسطح المكتب |
| `icon-192x192.png` | `index.html` — أيقونة PNG احتياطية + Apple touch icon               |
| `icon-512x512.png` | `index.html` — معاينة المشاركة (Open Graph)                         |
| `logo.svg`         | شريط التنقل، الصفحة الرئيسية، **favicon** الأساسي في المتصفح        |

## إعادة التوليد

بعد تغيير `public/logo.svg`:

```bash
npm run icons:generate
```

ثم اعمل commit للملفات في `public/icons/` و`public/favicon.png`.
