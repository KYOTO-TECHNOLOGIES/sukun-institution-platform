#!/bin/sh
# One-time hostname setup; existing Nginx sites and certificates are preserved.
set -eu
test "$(id -u)" = 0
mode=${1:-enable}
case "$mode" in enable|--bootstrap-only) ;; *) exit 2 ;; esac
templates=/usr/local/lib/sukun/deploy
site=/etc/nginx/sites-available/sukun-lms
enabled=/etc/nginx/sites-enabled/sukun-lms
bootstrap="$templates/nginx-sukun-bootstrap.conf.example"
final="$templates/nginx-sukun-domain.conf.example"
test -f "$bootstrap"
test -f "$final"
nginx -t
if test -e "$site" && ! cmp -s "$site" "$bootstrap" && ! cmp -s "$site" "$final"; then
    echo 'Refusing to replace an unrecognized Sukun Nginx configuration.' >&2
    exit 1
fi
if test -L "$enabled"; then
    test "$(readlink "$enabled")" = "$site"
elif test -e "$enabled"; then
    echo 'Expected a dedicated Sukun site symlink.' >&2
    exit 1
fi
install -d -m 755 /var/www/sukun-acme
if ! test -e "$site"; then
    # Refuse duplicate hostname definitions in another enabled site.
    if nginx -T 2>/dev/null | grep -q 'server_name.*lms\.sukunweb\.com'; then
        echo 'Hostname already configured in another site; inspect it first.' >&2
        exit 1
    fi
    install -m 644 "$bootstrap" "$site"
fi
test -L "$enabled" || ln -s "$site" "$enabled"
if ! nginx -t; then
    # Only remove our symlink; leave source configuration for diagnosis.
    unlink "$enabled"
    exit 1
fi
systemctl reload nginx
test "$mode" != --bootstrap-only || exit 0
python3 - <<'PY'
import socket
try:
    addresses = {item[4][0] for item in socket.getaddrinfo('lms.sukunweb.com', 80, socket.AF_INET)}
except socket.gaierror:
    addresses = set()
if addresses != {'187.127.171.93'}:
    raise SystemExit('Set DNS A record lms.sukunweb.com to 187.127.171.93, then run this command again.')
PY
certbot certonly --non-interactive --webroot -w /var/www/sukun-acme --cert-name lms.sukunweb.com --keep-until-expiring -d lms.sukunweb.com
previous=$(mktemp)
trap 'rm -f "$previous"' EXIT
cp "$site" "$previous"
install -m 644 "$final" "$site"
if ! nginx -t; then
    install -m 644 "$previous" "$site"
    exit 1
fi
systemctl reload nginx
install -d -m 755 /etc/letsencrypt/renewal-hooks/deploy
cat > /etc/letsencrypt/renewal-hooks/deploy/sukun-nginx <<'HOOK'
#!/bin/sh
set -eu
case "${RENEWED_LINEAGE:-}" in
    /etc/letsencrypt/live/lms.sukunweb.com) nginx -t && systemctl reload nginx ;;
esac
HOOK
chmod 755 /etc/letsencrypt/renewal-hooks/deploy/sukun-nginx
echo 'HTTPS is configured for lms.sukunweb.com.'
