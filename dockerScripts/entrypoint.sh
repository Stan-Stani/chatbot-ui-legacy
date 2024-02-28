#!/bin/sh

echo "Check that we have NEXT_PUBLIC_DEFAULT_SYSTEM_PROMPT vars"
test -n "$NEXT_PUBLIC_DEFAULT_SYSTEM_PROMPT"

find /app/.next \( -type d -name .git -prune \) -o -type f -print0 | xargs -0 sed -i "s#PLACEHOLDER_NEXT_PUBLIC_DEFAULT_SYSTEM_PROMPT#$NEXT_PUBLIC_DEFAULT_SYSTEM_PROMPT#g"

echo "Starting Nextjs"
exec "$@"