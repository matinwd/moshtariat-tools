# ابزارهای فروش مشتریات

مجموعه ماشین‌حساب‌های رایگان محاسبات فروش در آدرس
[moshtariat.ir/tools](https://moshtariat.ir/tools/) — رأس چک، پیش‌فاکتور آنلاین،
فروش اقساطی، درصد تخفیف، ارزش افزوده، قیمت‌گذاری (مارک‌آپ و حاشیه سود) و نقطهٔ
سر به سر.

ریپو **کاملاً جدا از کد‌بیس مشتریات** است: سایت ایستا، بدون وابستگی، و همهٔ
محاسبه‌ها در مرورگر کاربر انجام می‌شود.

## ساختار

```text
src/lib/       منطق محاسبه (ESM خالص، مشترک بین مرورگر، Node و build)
src/client/    اسکریپت هر ابزار
src/pages/     HTML، محتوای آموزشی و FAQ هر صفحه
src/static/    CSS، فونت Vazirmatn (OFL)، تصاویر برند
src/site.js    ثابت‌ها و رجیستری ابزارها (منبع واحد هاب/منو/sitemap)
scripts/       build.js → dist/tools، check-dist.js، serve.js
test/          تست واحد node:test برای lib
deploy/        nginx.conf کانتینر + نمونهٔ route پروکسی Production
```

## توسعه

```bash
npm test          # تست واحد
npm run build     # خروجی در dist/tools با assets هش‌شده — dist/ کامیت می‌شود
npm run serve     # پیش‌نمایش روی http://localhost:4173/tools/
npm run check     # هر سه مرحلهٔ بالا
```

`dist/` عمداً در ریپو کامیت می‌شود تا بیلد Production نیاز به pull رجیستری یا
نصب Node نداشته باشد. بعد از هر تغییر `src`، `npm run build` را اجرا و خروجی
را همان کامیت کنید؛ CI با rebuild تعیینی
(`SOURCE_DATE_EPOCH=$(git log -1 --format=%ct)`) ثابت می‌کند dist به‌روز است.

افزودن ابزار جدید: ورودی در `TOOLS` داخل `src/site.js`، فایل
`src/pages/<slug>.js` (متن، ابزار، FAQ) و `src/client/<slug>.js` (منطق زنده).
بیلد بقیه را خودش می‌چیند.

## دیپلوی

ایمیج = nginx روی Alpine + خروجی استاتیک. `docker-compose.yml` کانتینر را روی
شبکهٔ پروکسی edge با alias ‏`tools-web` بالا می‌آورد و
`deploy/proxy-route.conf` بلاک لازم برای route عمومی `moshtariat.ir/tools` است.
چون این ریپو عمومی است، نام شبکه/میزبان/مسیرهای واقعی Production در کد نیست؛
آن‌ها در `deploy/production.env` (gitignore) یا مستندات عملیاتی خصوصی می‌نشینند.
روش کامل: `deploy/README.md`.

بیلد ایمیج نیاز به pull از رجیستری ندارد: `dist/` کامیت شده، alpine با digest
پین است و nginx از apk نصب می‌شود.
