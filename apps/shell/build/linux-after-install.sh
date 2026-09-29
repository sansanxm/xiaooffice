#!/bin/sh
# deb/rpm post-install: expose the xiaooffice command line shipped inside the app.
set -e
launcher="/opt/Xiao Office/resources/cli/genoffice"
[ -x "$launcher" ] || launcher="/opt/xiaooffice/resources/cli/genoffice"
[ -x "$launcher" ] || launcher="/opt/GenOffice/resources/cli/genoffice"
[ -x "$launcher" ] || exit 0

for link in "/usr/bin/xiaooffice" "/usr/bin/genoffice"; do
  if [ -L "$link" ]; then
    case "$(readlink "$link")" in
      /opt/Xiao*|/opt/xiao*|/opt/GenOffice/*) ;;
      *) [ -e "$link" ] && continue ;;
    esac
  elif [ -e "$link" ]; then
    continue
  fi
  ln -sfn "$launcher" "$link"
done
exit 0
