# دیپلوی Production

این ریپو عمومی است؛ **مقادیر واقعی زیرساخت (نام شبکه، میزبان، مسیر config
پروکسی) اینجا نوشته نشده‌اند.** آن‌ها را در `deploy/production.env` کنار خود
ریپو نگه دارید — این فایل gitignore شده است.

```bash
cp deploy/production.env.example deploy/production.env
# مقادیر واقعی را از مستندات عملیاتی خصوصی پروژه پر کنید
```

`deploy.sh` همین فایل را می‌خواند و بیلد، بالا آمدن کانتینر و نصب route پروکسی
را انجام می‌دهد:

```bash
./deploy/deploy.sh build   # ایمیج را روی میزبان می‌سازد (بدون pull رجیستری)
./deploy/deploy.sh up      # کانتینر را روی شبکهٔ edge بالا می‌آورد
./deploy/deploy.sh route   # بلوک /tools را به کانفیگ پروکسی اضافه و reload می‌کند
```

## متغیرهای `production.env`

| متغیر | معنی |
|---|---|
| `SSH_HOST` | alias میزبان Production در `~/.ssh/config` |
| `DOCKER_BIN` | مسیر باینری docker روی میزبان (rootless) |
| `TOOLS_EDGE_NETWORK` | نام شبکهٔ خارجی‌ای که پروکسی edge در آن است |
| `PROXY_CONTAINER` | نام کانتینر پروکسی edge |
| `PROXY_CONF` | مسیر فایل conf پروکسی روی میزبان |

## Rollback

```bash
./deploy/deploy.sh unroute   # بلوک /tools را از پروکسی حذف و reload می‌کند
./deploy/deploy.sh down      # کانتینر را می‌بردارد
```

کانتینر هیچ دیتابیس، volume یا secret ندارد؛ حذفش بی‌خطر است.
