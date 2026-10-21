# moshtariat-tools — static site behind the production proxy at /tools.
#
# dist/ is committed (build is reproducible; CI verifies it's in sync), so the
# image needs no Node stage and no registry pull: alpine:3.23 is pinned by
# digest and nginx comes from apk.
FROM alpine:3.23@sha256:fd791d74b68913cbb027c6546007b3f0d3bc45125f797758156952bc2d6daf40
ARG GIT_SHA=local
ARG BUILD_DATE
LABEL org.opencontainers.image.title="moshtariat-tools" \
      org.opencontainers.image.revision="${GIT_SHA}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.source="https://github.com/matinwd/moshtariat-tools"
RUN apk add --no-cache nginx curl
COPY dist/tools /var/www/tools
COPY deploy/nginx.conf /etc/nginx/nginx.conf
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fsS -o /dev/null http://127.0.0.1:8080/tools/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
