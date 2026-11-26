#!/usr/bin/env bash
set -euo pipefail
test "${SASKHANDY_STAGING_PREVIEW:-}" = 1
test "${#STAGING_ACCESS_PASSWORD}" -ge 24
# Never inherit production connections or credentials.
unset DATABASE_URL JWT_SECRET STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET SMTP_HOST SMTP_USER SMTP_PASS EMAIL_FROM GROQ_API_KEY GROQ_VISION_MODEL CLOUDINARY_URL CLOUDINARY_API_KEY CLOUDINARY_API_SECRET CLOUDINARY_CLOUD_NAME BREVO_API_KEY TWILIO_AUTH_TOKEN TWILIO_ACCOUNT_SID BUILT_IN_FORGE_API_KEY
export STRIPE_SECRET_KEY=sk_test_preview_placeholder_not_valid
export JWT_SECRET="$(node -e 'process.stdout.write(require("node:crypto").randomBytes(32).toString("hex"))')"
export APP_URL="${RENDER_EXTERNAL_URL:-https://saskhandy-v2.onrender.com}"
export NODE_OPTIONS="--max-old-space-size=192"
dbpass="$(node -e 'process.stdout.write(require("node:crypto").randomBytes(24).toString("hex"))')"
dir="$(mktemp -d /tmp/saskhandy-preview.XXXXXX)"
chown mysql:mysql "$dir"
mariadb-install-db --user=mysql --datadir="$dir" --auth-root-authentication-method=socket --skip-test-db >/dev/null
mariadbd --user=mysql --datadir="$dir" --socket="$dir/mysql.sock" --pid-file="$dir/mysql.pid" --bind-address=127.0.0.1 --port=3306 --innodb-buffer-pool-size=48M --key-buffer-size=4M --max-connections=20 --performance-schema=OFF --skip-log-bin --skip-name-resolve &
dbpid=$!
trap 'kill "$dbpid" 2>/dev/null || true' EXIT
for i in $(seq 1 60); do if mariadb-admin --socket="$dir/mysql.sock" ping --silent; then break; fi; sleep 1; done
mariadb --socket="$dir/mysql.sock" -e "CREATE DATABASE saskhandy_preview CHARACTER SET utf8mb4; CREATE USER 'preview'@'127.0.0.1' IDENTIFIED BY '$dbpass'; GRANT ALL ON saskhandy_preview.* TO 'preview'@'127.0.0.1';"
for migration in staging-schema/*.sql; do sed 's/--> statement-breakpoint//g' "$migration" | mariadb --socket="$dir/mysql.sock" saskhandy_preview; done
export DATABASE_URL="mysql://preview:$dbpass@127.0.0.1:3306/saskhandy_preview"
node scripts/staging/seed.mjs
node dist/index.js &
apppid=$!
trap 'kill "$apppid" "$dbpid" 2>/dev/null || true' TERM INT EXIT
wait -n "$apppid" "$dbpid"
