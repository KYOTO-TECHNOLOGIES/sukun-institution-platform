#!/bin/sh
# Run as root from a reviewed checkout, after Docker Engine/Compose installation.
set -eu
test "$(id -u)" = 0
test -f scripts/deploy_server.py
test -f compose.yaml
docker compose version
if ! id sukun-deploy >/dev/null 2>&1; then
    useradd --create-home --shell /bin/sh sukun-deploy
fi
# This user deliberately has no Docker group or general sudo membership.
test "$(id -nG sukun-deploy)" = sukun-deploy
install -d -o root -g root -m 755 /usr/local/lib/sukun/deploy /var/lib/sukun
install -d -o sukun-deploy -g sukun-deploy -m 700 /var/lib/sukun/incoming
install -d -o root -g root -m 750 /opt/sukun
install -d -o root -g root -m 700 /var/backups/sukun
install -m 644 scripts/deploy_server.py /usr/local/lib/sukun/deploy_server.py
install -m 644 compose.yaml /usr/local/lib/sukun/compose.yaml
install -m 644 deploy/compose.small-server.yaml /usr/local/lib/sukun/deploy/compose.small-server.yaml
install -m 644 deploy/nginx-sukun-bootstrap.conf.example /usr/local/lib/sukun/deploy/nginx-sukun-bootstrap.conf.example
install -m 644 deploy/nginx-sukun-domain.conf.example /usr/local/lib/sukun/deploy/nginx-sukun-domain.conf.example
install -m 755 scripts/enable_https.sh /usr/local/sbin/sukun-enable-https
ln -sfn /opt/sukun/production.env /usr/local/lib/sukun/deploy/production.env
printf '%s\n' '#!/bin/sh' 'exec /usr/bin/python3 -I /usr/local/lib/sukun/deploy_server.py "$@"' > /usr/local/sbin/sukun-deploy
chown root:root /usr/local/sbin/sukun-deploy
chmod 755 /usr/local/sbin/sukun-deploy
rule=$(mktemp)
trap 'rm -f "$rule"' EXIT
printf '%s\n' 'sukun-deploy ALL=(root) NOPASSWD: /usr/local/sbin/sukun-deploy *' > "$rule"
visudo -cf "$rule"
install -o root -g root -m 440 "$rule" /etc/sudoers.d/sukun-deploy
printf '%s\n' 'Sukun helper installed. Add the dedicated public SSH key before enabling Actions.'
